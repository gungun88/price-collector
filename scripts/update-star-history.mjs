#!/usr/bin/env node

import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const DEFAULT_REPOSITORY = "dimthink/PriceAI";
const DEFAULT_OUTPUT = "assets/priceai-star-history.svg";
const DEFAULT_TITLE = "PriceAI Star History";

try {
  const options = parseArgs(process.argv.slice(2));
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  const data = await fetchStarHistory(options.repository, token);
  const svg = renderStarHistorySvg(data, {
    title: options.title,
    generatedAt: new Date(),
  });

  if (options.stdout) {
    process.stdout.write(`${svg}\n`);
  } else {
    await mkdir(path.dirname(options.output), { recursive: true });
    await writeFile(options.output, `${svg}\n`, "utf8");
    console.log(
      `Updated ${options.output} with ${data.stargazers.length} stars for ${data.repository.fullName}.`,
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function fetchStarHistory(repository, token) {
  const [owner, repo] = splitRepository(repository);
  const apiBase = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const metadata = await fetchJson(apiBase, token, "application/vnd.github+json");
  const stargazers = [];

  for (let page = 1; ; page += 1) {
    const url = `${apiBase}/stargazers?per_page=100&page=${page}`;
    const items = await fetchJson(url, token, "application/vnd.github.star+json");
    if (!Array.isArray(items)) {
      throw new Error("GitHub stargazers API returned an unexpected payload.");
    }

    for (const item of items) {
      const starredAt = item?.starred_at;
      if (!starredAt) {
        throw new Error(
          "GitHub did not return starred_at timestamps. Check that the star+json media type is accepted.",
        );
      }
      stargazers.push({
        login: item?.user?.login || "",
        starredAt: new Date(starredAt),
      });
    }

    if (items.length < 100) break;
  }

  stargazers.sort((a, b) => a.starredAt.getTime() - b.starredAt.getTime());

  return {
    repository: {
      fullName: metadata.full_name || `${owner}/${repo}`,
      htmlUrl: metadata.html_url || `https://github.com/${owner}/${repo}`,
      createdAt: new Date(metadata.created_at || Date.now()),
      stargazersCount: Number(metadata.stargazers_count || stargazers.length),
    },
    stargazers,
  };
}

async function fetchJson(url, token, accept) {
  const headers = {
    accept,
    "user-agent": "priceai-star-history-updater",
    "x-github-api-version": "2022-11-28",
  };
  if (token) headers.authorization = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  const body = await response.text();

  if (!response.ok) {
    const hint =
      response.status === 401
        ? "GitHub returned 401. Provide GITHUB_TOKEN or GH_TOKEN; the stargazers timeline endpoint now requires authentication."
        : response.status === 403
          ? `GitHub returned 403. Remaining rate limit: ${response.headers.get("x-ratelimit-remaining") || "unknown"}.`
          : `GitHub returned HTTP ${response.status}.`;
    throw new Error(`${hint}\n${body.slice(0, 500)}`);
  }

  return body ? JSON.parse(body) : null;
}

function renderStarHistorySvg(data, options) {
  const width = 960;
  const height = 520;
  const plot = {
    left: 82,
    right: 36,
    top: 68,
    bottom: 78,
  };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const generatedAt = options.generatedAt;
  const startDate = startOfUtcDay(data.repository.createdAt);
  const lastStarDate = data.stargazers.at(-1)?.starredAt || startDate;
  const endDate = new Date(Math.max(generatedAt.getTime(), lastStarDate.getTime(), startDate.getTime() + 86_400_000));
  const latestCount = data.stargazers.length;
  const yMax = niceMax(Math.max(latestCount, data.repository.stargazersCount));
  const dateRange = Math.max(1, endDate.getTime() - startDate.getTime());

  const scaleX = (date) =>
    plot.left + ((date.getTime() - startDate.getTime()) / dateRange) * plotWidth;
  const scaleY = (value) => plot.top + plotHeight - (value / yMax) * plotHeight;
  const points = [{ date: startDate, count: 0 }];

  data.stargazers.forEach((star, index) => {
    points.push({ date: star.starredAt, count: index + 1 });
  });
  points.push({ date: endDate, count: latestCount });

  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${formatCoord(scaleX(point.date))} ${formatCoord(scaleY(point.count))}`)
    .join(" ");
  const yTicks = buildYTicks(yMax);
  const xTicks = buildDateTicks(startDate, endDate, 7);
  const latestPoint = points.at(-1);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">${escapeXml(options.title)}</title>
<desc id="desc">GitHub star history for ${escapeXml(data.repository.fullName)}, from ${formatIsoDate(startDate)} to ${formatIsoDate(endDate)}, latest ${latestCount} stars.</desc>
<rect width="100%" height="100%" fill="#ffffff"/>
<style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.axis{stroke:#222;stroke-width:1.5}.grid{stroke:#e8ecef;stroke-width:1}.label{fill:#626a70;font-size:13px}.title{fill:#20272b;font-size:24px;font-weight:700}.subtitle{fill:#626a70;font-size:13px}.legend{fill:#20272b;font-size:14px;font-weight:600}.line{fill:none;stroke:#dd4528;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.dot{fill:#dd4528;stroke:#fff;stroke-width:2}</style>
<text class="title" x="${width / 2}" y="34" text-anchor="middle">${escapeXml(options.title)}</text>
<text class="subtitle" x="${width / 2}" y="54" text-anchor="middle">${escapeXml(data.repository.fullName)} · latest ${latestCount} stars · updated ${formatUtcDateTime(generatedAt)}</text>
${yTicks
  .map((tick) => {
    const y = formatCoord(scaleY(tick));
    return `<line class="grid" x1="${plot.left}" y1="${y}" x2="${width - plot.right}" y2="${y}"/>
<text class="label" x="${plot.left - 12}" y="${formatCoord(Number(y) + 4)}" text-anchor="end">${formatNumber(tick)}</text>`;
  })
  .join("\n")}
<line class="axis" x1="${plot.left}" y1="${plot.top}" x2="${plot.left}" y2="${height - plot.bottom}"/>
<line class="axis" x1="${plot.left}" y1="${height - plot.bottom}" x2="${width - plot.right}" y2="${height - plot.bottom}"/>
${xTicks
  .map((tick) => {
    const x = formatCoord(scaleX(tick));
    return `<text class="label" x="${x}" y="${height - plot.bottom + 28}" text-anchor="middle">${escapeXml(formatMonthDay(tick))}</text>`;
  })
  .join("\n")}
<text class="label" x="${width / 2}" y="${height - 20}" text-anchor="middle">Date</text>
<text class="label" transform="translate(22 ${plot.top + plotHeight / 2}) rotate(-90)" text-anchor="middle">GitHub Stars</text>
<rect x="${plot.left + 10}" y="${plot.top + 12}" width="278" height="38" rx="6" fill="#fff" stroke="#dce1e5"/>
<rect x="${plot.left + 28}" y="${plot.top + 26}" width="12" height="12" rx="2" fill="#dd4528"/>
<text class="legend" x="${plot.left + 50}" y="${plot.top + 37}">${escapeXml(data.repository.fullName)}</text>
<path class="line" d="${pathData}"/>
<circle class="dot" cx="${formatCoord(scaleX(latestPoint.date))}" cy="${formatCoord(scaleY(latestPoint.count))}" r="6"/>
<text class="legend" x="${formatCoord(Math.max(plot.left + 40, scaleX(latestPoint.date) - 8))}" y="${formatCoord(scaleY(latestPoint.count) - 14)}" text-anchor="end">${formatNumber(latestCount)}</text>
</svg>`;
}

function parseArgs(args) {
  const parsed = {
    repository: process.env.STAR_HISTORY_REPOSITORY || process.env.GITHUB_REPOSITORY || DEFAULT_REPOSITORY,
    output: process.env.STAR_HISTORY_OUTPUT || DEFAULT_OUTPUT,
    title: process.env.STAR_HISTORY_TITLE || DEFAULT_TITLE,
    stdout: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--repo") parsed.repository = readValue(args, ++index, arg);
    else if (arg.startsWith("--repo=")) parsed.repository = arg.slice("--repo=".length);
    else if (arg === "--out") parsed.output = readValue(args, ++index, arg);
    else if (arg.startsWith("--out=")) parsed.output = arg.slice("--out=".length);
    else if (arg === "--title") parsed.title = readValue(args, ++index, arg);
    else if (arg.startsWith("--title=")) parsed.title = arg.slice("--title=".length);
    else if (arg === "--stdout") parsed.stdout = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  splitRepository(parsed.repository);
  return parsed;
}

function splitRepository(repository) {
  const parts = String(repository || "").split("/");
  if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_.-]+$/.test(part))) {
    throw new Error(`Invalid repository "${repository}". Expected owner/name.`);
  }
  return parts;
}

function readValue(args, index, flag) {
  const value = args[index];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value.`);
  return value;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/update-star-history.mjs [--repo owner/name] [--out assets/priceai-star-history.svg]

Environment:
  GITHUB_TOKEN or GH_TOKEN          Token used for the GitHub stargazers timeline API
  STAR_HISTORY_REPOSITORY          Repository to chart, default ${DEFAULT_REPOSITORY}
  STAR_HISTORY_OUTPUT              Output SVG path, default ${DEFAULT_OUTPUT}
`);
}

function buildYTicks(yMax) {
  const step = yMax / 5;
  return Array.from({ length: 6 }, (_, index) => Math.round(step * index));
}

function buildDateTicks(startDate, endDate, count) {
  const start = startDate.getTime();
  const range = Math.max(1, endDate.getTime() - start);
  return Array.from({ length: count }, (_, index) => new Date(start + (range * index) / (count - 1)));
}

function niceMax(value) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatMonthDay(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function formatUtcDateTime(date) {
  return date.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatCoord(value) {
  return Number(value).toFixed(1);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
