const baseUrl = process.env.API_BASE_URL || "http://localhost:4100";
const password = process.env.ADMIN_PASSWORD || "priceai_admin_dev_password";

const login = await fetch(`${baseUrl}/api/admin/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ password }),
});
const loginBody = await readJson(login);
const cookie = login.headers.get("set-cookie")?.split(";")[0] || "";

if (!login.ok || !loginBody.ok || !cookie) {
  throw new Error(`Admin login failed: ${JSON.stringify(loginBody)}`);
}

const session = await fetch(`${baseUrl}/api/admin/session`, {
  headers: { cookie },
});
const sessionBody = await readJson(session);
if (!session.ok || !sessionBody.authenticated) {
  throw new Error(`Admin session failed: ${JSON.stringify(sessionBody)}`);
}

const list = await fetch(`${baseUrl}/api/admin/transit/submissions?status=all&limit=5`, {
  headers: { cookie },
});
const listBody = await readJson(list);
if (!list.ok || !Array.isArray(listBody.submissions)) {
  throw new Error(`Admin submission list failed: ${JSON.stringify(listBody)}`);
}

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  authenticated: true,
  submissions: listBody.submissions.length,
  firstSubmissionId: listBody.submissions[0]?.id || null,
}, null, 2));

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}
