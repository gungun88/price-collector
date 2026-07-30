"use client";

import { Activity, BarChart3, Check, Clock3, Database, Edit3, Eye, EyeOff, Globe2, Inbox, LogOut, Plus, RefreshCw, Save, Search, Server, ShieldCheck, X } from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { TRANSIT_STANDARD_MODELS } from "@/data/api-transit/types";

type AdminTab = "submissions" | "stations" | "offers";
type ReviewStatus = "pending" | "collector_todo" | "approved" | "rejected";
type StationBucket = "all" | "pending" | "published" | "removed";
type OfferStatus = "active" | "needs_review" | "inactive";
type OfferFamily = "gpt" | "claude" | "gemini" | "grok" | "glm" | "deepseek" | "image" | "video";

type TransitSubmission = {
  id: string;
  submittedUrl: string;
  submittedName: string | null;
  contact: string | null;
  notes: string | null;
  submittedModels: string[];
  reviewStatus: ReviewStatus;
  stationId: string | null;
  duplicateOf: string | null;
  createdAt: string;
};

type TransitStation = {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string;
  logoUrl: string | null;
  apiBaseUrl: string | null;
  pricingUrl: string | null;
  monitorUrl: string | null;
  summary: string;
  status: "unknown" | "active" | "risky" | "inactive";
  sourceType: string;
  commercialRelation: "unknown" | "none" | "partner" | "sponsor";
  stationSystem: "new_api" | "sub_to_api" | "custom" | "unknown";
  operatorType: "company" | "individual" | "unknown";
  invoiceSupport: "supported" | "unsupported" | "unknown";
  channelTypes: string[];
  accountPools: string[];
  paymentMethods: string[];
  supportChannels: string[];
  riskLabels: string[];
  minimumTopUp: string | null;
  balanceExpiry: string | null;
  refundPolicy: string | null;
  strengths: string[];
  cautions: string[];
  published: boolean;
  dataStatus: "pending_review" | "verified" | "stale";
  usageAdvice: "pending" | "trial_only" | "normal" | "avoid";
  adminNote: string | null;
  offerCount: number;
  activeOfferCount: number;
  pendingOfferCount: number;
  removedAt?: string | null;
  removedReason?: string | null;
  updatedAt: string | null;
  createdAt: string;
};

type TransitOffer = {
  id: string;
  stationId: string;
  family: OfferFamily;
  standardModel: string;
  rawModelName: string | null;
  groupName: string;
  rechargeRatio: string | null;
  modelMultiplier: number | null;
  inputPrice: number | null;
  outputPrice: number | null;
  cacheReadPrice: number | null;
  cacheWritePrice: number | null;
  fixedPrice: number | null;
  fixedPriceUnit: string | null;
  currency: "CNY";
  accountPool: string | null;
  channelType: string | null;
  priceSource: string | null;
  status: OfferStatus;
  lastVerifiedAt: string | null;
  updatedAt: string | null;
  createdAt: string;
};

type StationFormState = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string;
  logoUrl: string;
  apiBaseUrl: string;
  pricingUrl: string;
  monitorUrl: string;
  summary: string;
  status: TransitStation["status"];
  published: boolean;
  stationSystem: TransitStation["stationSystem"];
  operatorType: TransitStation["operatorType"];
  invoiceSupport: TransitStation["invoiceSupport"];
  channelTypes: string;
  accountPools: string;
  paymentMethods: string;
  supportChannels: string;
  riskLabels: string;
  minimumTopUp: string;
  balanceExpiry: string;
  refundPolicy: string;
  strengths: string;
  cautions: string;
  usageAdvice: TransitStation["usageAdvice"];
  dataStatus: TransitStation["dataStatus"];
  adminNote: string;
  removedAt: string | null;
  removedReason: string | null;
};

type OfferFormState = {
  id: string;
  stationId: string;
  family: OfferFamily;
  standardModel: string;
  rawModelName: string;
  groupName: string;
  rechargeRatio: string;
  modelMultiplier: string;
  inputPrice: string;
  outputPrice: string;
  cacheReadPrice: string;
  cacheWritePrice: string;
  fixedPrice: string;
  fixedPriceUnit: string;
  accountPool: string;
  channelType: string;
  priceSource: string;
  status: OfferStatus;
  lastVerifiedAt: string;
};

const reviewStatusLabels: Record<ReviewStatus, string> = {
  pending: "待审核",
  collector_todo: "待采集",
  approved: "已通过",
  rejected: "已拒绝",
};

const submissionStatusOptions: Array<{ value: ReviewStatus | "all"; label: string }> = [
  { value: "pending", label: "待审核" },
  { value: "collector_todo", label: "待采集" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已拒绝" },
  { value: "all", label: "全部" },
];

const stationBucketOptions: Array<{ value: StationBucket; label: string }> = [
  { value: "all", label: "全部站点" },
  { value: "pending", label: "草稿" },
  { value: "published", label: "已发布" },
  { value: "removed", label: "已下架" },
];

const offerFamilyOptions: Array<{ value: OfferFamily | "all"; label: string }> = [
  { value: "all", label: "全部系列" },
  { value: "gpt", label: "GPT" },
  { value: "claude", label: "Claude" },
  { value: "gemini", label: "Gemini" },
  { value: "grok", label: "Grok" },
  { value: "glm", label: "GLM" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "image", label: "图片" },
  { value: "video", label: "视频" },
];

const offerStatusOptions: Array<{ value: OfferStatus | "all"; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "active", label: "启用" },
  { value: "needs_review", label: "待复核" },
  { value: "inactive", label: "停用" },
];

const offerFamilyLabels: Record<OfferFamily, string> = {
  gpt: "GPT",
  claude: "Claude",
  gemini: "Gemini",
  grok: "Grok",
  glm: "GLM",
  deepseek: "DeepSeek",
  image: "图片",
  video: "视频",
};

const offerStatusLabels: Record<OfferStatus, string> = {
  active: "启用",
  needs_review: "待复核",
  inactive: "停用",
};

const adminTabLabels: Record<AdminTab, string> = {
  submissions: "提交线索",
  stations: "站点池",
  offers: "报价管理",
};

const adminTabDescriptions: Record<AdminTab, string> = {
  submissions: "处理前台提交的新渠道、重复线索和采集任务。",
  stations: "维护中转 API 站点资料、公开状态、风险提示和运营信息。",
  offers: "按站点录入模型报价、倍率、状态和最近核验时间。",
};

export function SelfhostTransitAdminConsole() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("submissions");
  const [submissionStatus, setSubmissionStatus] = useState<ReviewStatus | "all">("pending");
  const [stationBucket, setStationBucket] = useState<StationBucket>("all");
  const [stationSearch, setStationSearch] = useState("");
  const [submissions, setSubmissions] = useState<TransitSubmission[]>([]);
  const [stations, setStations] = useState<TransitStation[]>([]);
  const [offers, setOffers] = useState<TransitOffer[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [stationForm, setStationForm] = useState<StationFormState | null>(null);
  const [offerForm, setOfferForm] = useState<OfferFormState | null>(null);
  const [creatingStation, setCreatingStation] = useState(false);
  const [creatingOffer, setCreatingOffer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedStation = creatingStation ? null : stations.find((station) => station.id === selectedStationId) || stations[0] || null;
  const selectedOffer = creatingOffer ? null : offers.find((offer) => offer.id === selectedOfferId) || offers[0] || null;

  const metrics = useMemo(() => ({
    pendingSubmissions: submissions.filter((item) => item.reviewStatus === "pending").length,
    draftStations: stations.filter((item) => !item.published).length,
    publishedStations: stations.filter((item) => item.published).length,
    totalStations: stations.length,
    activeStations: stations.filter((item) => item.status === "active" && item.published && !item.removedAt).length,
    totalOffers: offers.length,
    activeOffers: offers.filter((item) => item.status === "active").length,
    reviewOffers: offers.filter((item) => item.status === "needs_review").length,
  }), [offers, stations, submissions]);

  useEffect(() => {
    void checkSession();
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    void loadSubmissions(submissionStatus);
    void loadStations("all", "");
    void loadOffers(undefined);
    // These loaders intentionally run once after login to hydrate the dashboard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;
    if (activeTab === "submissions") void loadSubmissions(submissionStatus);
    if (activeTab === "stations") void loadStations(stationBucket, stationSearch);
    if (activeTab === "offers") {
      void loadStations("all");
      void loadOffers(selectedStationId || undefined);
    }
    // The admin loaders are local event helpers; this effect follows tab/filter state only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authenticated, stationBucket, stationSearch, submissionStatus]);

  async function checkSession() {
    setCheckingSession(true);
    try {
      const response = await fetch("/api/selfhost/admin/session", { cache: "no-store" });
      const json = await response.json().catch(() => null);
      setAuthenticated(Boolean(response.ok && json?.authenticated));
    } finally {
      setCheckingSession(false);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const response = await fetch("/api/selfhost/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.ok) {
      setError(json?.message || "登录失败，请检查管理员密码。");
      return;
    }
    setPassword("");
    setAuthenticated(true);
    setMessage("已登录自托管后台。");
  }

  async function logout() {
    await fetch("/api/selfhost/admin/logout", { method: "POST" }).catch(() => undefined);
    setAuthenticated(false);
    setSubmissions([]);
    setStations([]);
    setOffers([]);
  }

  async function loadSubmissions(nextStatus = submissionStatus) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/selfhost/admin/transit/submissions?status=${nextStatus}&limit=50`, { cache: "no-store" });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) throw new Error(json?.message || "读取提交线索失败。");
      setSubmissions(json.submissions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取提交线索失败。");
    } finally {
      setLoading(false);
    }
  }

  async function loadStations(nextBucket = stationBucket, nextSearch = stationSearch) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ bucket: nextBucket, limit: "100" });
      const query = nextSearch.trim();
      if (query) params.set("q", query);
      const response = await fetch(`/api/selfhost/admin/transit/stations?${params.toString()}`, { cache: "no-store" });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) throw new Error(json?.message || "读取站点失败。");
      const nextStations = json.stations || [];
      setStations(nextStations);
      const nextSelectedStation = selectedStationId ? nextStations.find((station: TransitStation) => station.id === selectedStationId) : nextStations[0] || null;
      if (!selectedStationId && nextSelectedStation) setSelectedStationId(nextSelectedStation.id);
      if (!creatingStation) setStationForm(nextSelectedStation ? stationToForm(nextSelectedStation) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取站点失败。");
    } finally {
      setLoading(false);
    }
  }

  async function loadOffers(stationId?: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "120" });
      if (stationId) params.set("stationId", stationId);
      const response = await fetch(`/api/selfhost/admin/transit/offers?${params.toString()}`, { cache: "no-store" });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) throw new Error(json?.message || "读取报价失败。");
      const nextOffers = json.offers || [];
      setOffers(nextOffers);
      if (!creatingOffer) {
        const nextSelectedOffer = selectedOfferId ? nextOffers.find((offer: TransitOffer) => offer.id === selectedOfferId) : nextOffers[0] || null;
        setSelectedOfferId(nextSelectedOffer?.id || null);
        setOfferForm(nextSelectedOffer ? offerToForm(nextSelectedOffer) : newOfferForm(stationId || selectedStation?.id || stations[0]?.id || ""));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取报价失败。");
    } finally {
      setLoading(false);
    }
  }

  async function reviewSubmission(id: string, nextReviewStatus: ReviewStatus) {
    setActionId(`${id}:${nextReviewStatus}`);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/selfhost/admin/transit/submissions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, reviewStatus: nextReviewStatus, adminNote: reviewStatusLabels[nextReviewStatus] }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) throw new Error(json?.message || "审核操作失败。");
      setMessage(nextReviewStatus === "approved" ? `已通过，草稿站点：${json.station?.id || json.submission?.stationId || "已生成"}` : "审核状态已更新。");
      await loadSubmissions(submissionStatus);
      await loadStations(stationBucket, stationSearch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "审核操作失败。");
    } finally {
      setActionId(null);
    }
  }

  async function saveStation(overrides: Partial<StationFormState> = {}) {
    if (!stationForm) return;
    const nextForm = { ...stationForm, ...overrides };
    const editing = Boolean(nextForm.id);
    setActionId(editing ? `station:${nextForm.id}` : "station:new");
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/selfhost/admin/transit/stations", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(formToStationPayload(nextForm)),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) throw new Error(json?.message || "保存站点失败。");
      setMessage(nextForm.published ? "站点已保存并发布。" : "站点已保存为草稿。");
      setCreatingStation(false);
      const savedStationId = json.station?.id || nextForm.id || null;
      setSelectedStationId(savedStationId);
      if (!editing && savedStationId) {
        setStationBucket("all");
        setStationSearch("");
        setActiveTab("offers");
        setCreatingOffer(true);
        setOfferForm(newOfferForm(savedStationId));
        await loadStations("all", "");
        await loadOffers(savedStationId);
      } else {
        await loadStations(stationBucket, stationSearch);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存站点失败。");
    } finally {
      setActionId(null);
    }
  }

  async function removeStation(id: string) {
    if (!id || !window.confirm("确认下架这个站点？下架后前台不会再展示。")) return;
    setActionId(`station-remove:${id}`);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/selfhost/admin/transit/stations", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, removedReason: "后台手动下架" }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) throw new Error(json?.message || "下架站点失败。");
      setMessage("站点已下架，前台不再展示。");
      setSelectedStationId(null);
      await loadStations(stationBucket, stationSearch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "下架站点失败。");
    } finally {
      setActionId(null);
    }
  }

  async function restoreStation(id: string) {
    if (!id) return;
    setActionId(`station-restore:${id}`);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/selfhost/admin/transit/stations", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) throw new Error(json?.message || "恢复站点失败。");
      setMessage("站点已恢复为草稿，确认内容后可重新发布。");
      setSelectedStationId(json.station?.id || id);
      await loadStations(stationBucket, stationSearch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "恢复站点失败。");
    } finally {
      setActionId(null);
    }
  }

  async function saveOffer(overrides: Partial<OfferFormState> = {}) {
    if (!offerForm) return;
    const nextForm = { ...offerForm, ...overrides };
    const editing = Boolean(nextForm.id);
    setActionId(editing ? `offer:${nextForm.id}` : "offer:new");
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/selfhost/admin/transit/offers", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(formToOfferPayload(nextForm)),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) throw new Error(json?.message || "保存报价失败。");
      setMessage(nextForm.status === "active" ? "报价已保存并启用。" : "报价已保存。");
      setCreatingOffer(false);
      setSelectedOfferId(json.offer?.id || nextForm.id || null);
      await loadOffers(nextForm.stationId);
      await loadStations(stationBucket, stationSearch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存报价失败。");
    } finally {
      setActionId(null);
    }
  }

  function startNewStation() {
    setCreatingStation(true);
    setSelectedStationId(null);
    setStationForm(newStationForm());
  }

  function selectStation(id: string) {
    setCreatingStation(false);
    setSelectedStationId(id);
    const station = stations.find((item) => item.id === id) || null;
    setStationForm(station ? stationToForm(station) : null);
  }

  function startNewOffer(stationId?: string) {
    setCreatingOffer(true);
    setSelectedOfferId(null);
    setOfferForm(newOfferForm(stationId || selectedStation?.id || stations[0]?.id || ""));
  }

  function selectOffer(id: string) {
    setCreatingOffer(false);
    setSelectedOfferId(id);
    const offer = offers.find((item) => item.id === id) || null;
    setOfferForm(offer ? offerToForm(offer) : null);
  }

  function selectOfferStation(id: string) {
    setCreatingOffer(false);
    setSelectedStationId(id);
    setSelectedOfferId(null);
    setOfferForm(newOfferForm(id));
    void loadOffers(id);
  }

  if (checkingSession) {
    return <AdminFrame><Panel>正在检查自托管后台登录状态...</Panel></AdminFrame>;
  }

  if (!authenticated) {
    return (
      <AdminFrame>
        <section className="mx-auto w-full max-w-md border border-[#d7dddd] bg-white p-6 shadow-[0_12px_35px_rgba(45,52,53,0.05)]">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center bg-[#eef3f3] text-[#2d3435]"><ShieldCheck className="h-5 w-5" /></span>
            <div>
              <h1 className="text-xl font-semibold text-[#202829]">自托管后台登录</h1>
              <p className="mt-1 text-sm text-[#5a6061]">管理提交线索、中转 API 站点池和报价。</p>
            </div>
          </div>
          <form onSubmit={login} className="mt-5 space-y-4">
            <Field label="管理员密码">
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required className={inputClassName} />
            </Field>
            {error ? <Notice tone="error">{error}</Notice> : null}
            <button type="submit" className="inline-flex h-11 w-full items-center justify-center bg-[#202829] px-4 text-sm font-semibold text-white transition hover:bg-[#111617]">登录</button>
          </form>
        </section>
      </AdminFrame>
    );
  }

  return (
    <AdminFrame>
      <div className="mx-auto grid max-w-[1560px] gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border border-[#d7dddd] bg-[#202829] p-4 text-white lg:min-h-[calc(100vh-48px)]">
          <div className="border-b border-white/12 pb-5">
            <p className="font-mono text-[0.68rem] uppercase text-white/50">PriceAI Admin</p>
            <h1 className="mt-2 text-xl font-semibold text-white">中转 API 管理台</h1>
            <p className="mt-2 text-xs leading-5 text-white/55">自托管 Fastify + PostgreSQL，前台展示与后台维护分离。</p>
          </div>

          <nav className="mt-5 space-y-1" aria-label="后台导航">
            <AdminNavButton active={activeTab === "submissions"} count={metrics.pendingSubmissions} icon={<Inbox className="h-4 w-4" />} label="提交线索" onClick={() => setActiveTab("submissions")} />
            <AdminNavButton active={activeTab === "stations"} count={metrics.totalStations} icon={<Server className="h-4 w-4" />} label="站点池" onClick={() => setActiveTab("stations")} />
            <AdminNavButton active={activeTab === "offers"} count={metrics.totalOffers} icon={<Database className="h-4 w-4" />} label="报价管理" onClick={() => setActiveTab("offers")} />
          </nav>

          <div className="mt-6 border border-white/12 bg-white/[0.04] p-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-white"><Activity className="h-4 w-4" />系统状态</p>
            <dl className="mt-3 space-y-2 text-xs text-white/60">
              <div className="flex items-center justify-between gap-3"><dt>后端模式</dt><dd className="font-semibold text-white">自托管</dd></div>
              <div className="flex items-center justify-between gap-3"><dt>登录状态</dt><dd className="font-semibold text-[#b8f0c8]">已登录</dd></div>
              <div className="flex items-center justify-between gap-3"><dt>当前模块</dt><dd className="font-semibold text-white">{adminTabLabels[activeTab]}</dd></div>
            </dl>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="border border-[#d7dddd] bg-white px-4 py-4 md:px-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-[0.68rem] uppercase text-[#7a8587]">Self-hosted Transit Admin</p>
                <h2 className="mt-1 text-2xl font-semibold text-[#202829]">{adminTabLabels[activeTab]}</h2>
                <p className="mt-1 text-sm text-[#5a6061]">{adminTabDescriptions[activeTab]}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-10 items-center gap-2 border border-[#d7dddd] bg-[#f7f9f9] px-3 text-xs font-semibold text-[#5a6061]">
                  <Globe2 className="h-4 w-4" />/admin
                </span>
                <button type="button" onClick={() => activeTab === "submissions" ? loadSubmissions(submissionStatus) : activeTab === "stations" ? loadStations(stationBucket) : loadOffers(selectedStationId || undefined)} className={secondaryButtonClassName}>
                  <RefreshCw className="h-4 w-4" />刷新
                </button>
                <button type="button" onClick={logout} className={primaryButtonClassName}>
                  <LogOut className="h-4 w-4" />退出
                </button>
              </div>
            </div>
          </header>

          <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetric icon={<Inbox className="h-5 w-5" />} label="待审核线索" value={metrics.pendingSubmissions} hint={`提交记录 ${submissions.length}`} />
            <DashboardMetric icon={<Server className="h-5 w-5" />} label="已发布站点" value={metrics.publishedStations} hint={`草稿 ${metrics.draftStations}`} />
            <DashboardMetric icon={<Activity className="h-5 w-5" />} label="正常站点" value={metrics.activeStations} hint={`站点池 ${metrics.totalStations}`} />
            <DashboardMetric icon={<BarChart3 className="h-5 w-5" />} label="启用报价" value={metrics.activeOffers} hint={`待复核 ${metrics.reviewOffers}`} />
          </section>

          {message ? <Notice tone="success">{message}</Notice> : null}
          {error ? <Notice tone="error">{error}</Notice> : null}

          {activeTab === "submissions" ? (
            <SubmissionsSection
              actionId={actionId}
              loading={loading}
              status={submissionStatus}
              submissions={submissions}
              onReview={reviewSubmission}
              onStatusChange={setSubmissionStatus}
            />
          ) : activeTab === "stations" ? (
            <StationsSection
              actionId={actionId}
              bucket={stationBucket}
              form={stationForm}
              isCreating={creatingStation}
              loading={loading}
              search={stationSearch}
              selectedStation={selectedStation}
              stations={stations}
              onBucketChange={setStationBucket}
              onFormChange={setStationForm}
              onNewStation={startNewStation}
              onRemoveStation={removeStation}
              onRestoreStation={restoreStation}
              onSave={saveStation}
              onSearchChange={setStationSearch}
              onSelectStation={selectStation}
            />
          ) : (
            <OffersSection
              actionId={actionId}
              form={offerForm}
              isCreating={creatingOffer}
              loading={loading}
              offers={offers}
              selectedOffer={selectedOffer}
              selectedStationId={selectedStationId}
              stations={stations}
              onFormChange={setOfferForm}
              onNewOffer={startNewOffer}
              onSave={saveOffer}
              onSelectOffer={selectOffer}
              onSelectStation={selectOfferStation}
            />
          )}
        </div>
      </div>
    </AdminFrame>
  );
}

function SubmissionsSection({ actionId, loading, status, submissions, onReview, onStatusChange }: {
  actionId: string | null;
  loading: boolean;
  status: ReviewStatus | "all";
  submissions: TransitSubmission[];
  onReview: (id: string, reviewStatus: ReviewStatus) => void;
  onStatusChange: (status: ReviewStatus | "all") => void;
}) {
  return (
    <>
      <section className="mt-4 border border-[#d7dddd] bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#202829]">线索审核队列</h3>
            <p className="mt-1 text-sm text-[#5a6061]">审核后可以生成草稿站点，再进入站点池补全资料。</p>
          </div>
          <p className="text-sm text-[#5a6061]">{loading ? "正在读取..." : `共 ${submissions.length} 条`}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {submissionStatusOptions.map((option) => (
            <button key={option.value} type="button" onClick={() => onStatusChange(option.value)} className={filterButtonClassName(status === option.value)}>{option.label}</button>
          ))}
        </div>
      </section>

      <section className="mt-4 overflow-x-auto border border-[#d7dddd] bg-white">
        <table className="min-w-full divide-y divide-[#e3e8e8] text-left text-sm">
          <thead className="bg-[#f2f4f4] text-xs font-semibold text-[#5a6061]">
            <tr>
              <th className="px-4 py-3">渠道</th>
              <th className="px-4 py-3">模型/备注</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">时间</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf0f0]">
            {submissions.map((submission) => (
              <tr key={submission.id} className="align-top">
                <td className="max-w-[360px] px-4 py-3">
                  <a href={submission.submittedUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#202829] hover:underline">{submission.submittedName || safeDomain(submission.submittedUrl) || submission.id}</a>
                  <p className="mt-1 break-all text-xs leading-5 text-[#5a6061]">{submission.submittedUrl}</p>
                  {submission.contact ? <p className="mt-1 text-xs text-[#7a8587]">联系：{submission.contact}</p> : null}
                </td>
                <td className="max-w-[420px] px-4 py-3 text-[#5a6061]">
                  {submission.submittedModels?.length ? <p className="text-xs font-semibold text-[#2d3435]">{submission.submittedModels.join(" / ")}</p> : null}
                  {submission.notes ? <p className="mt-1 whitespace-pre-wrap text-xs leading-5">{submission.notes}</p> : <p className="text-xs text-[#9aa3a4]">无备注</p>}
                  {submission.duplicateOf ? <p className="mt-1 text-xs text-[#7a541b]">重复：{submission.duplicateOf}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <Badge>{reviewStatusLabels[submission.reviewStatus]}</Badge>
                  {submission.stationId ? <p className="mt-1 text-xs text-[#5a6061]">站点：{submission.stationId}</p> : null}
                </td>
                <td className="px-4 py-3 text-xs text-[#5a6061]">{formatDate(submission.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <ActionButton loading={actionId === `${submission.id}:approved`} onClick={() => onReview(submission.id, "approved")} label="通过" icon={<Check className="h-4 w-4" />} />
                    <ActionButton loading={actionId === `${submission.id}:collector_todo`} onClick={() => onReview(submission.id, "collector_todo")} label="待采集" icon={<Clock3 className="h-4 w-4" />} />
                    <ActionButton loading={actionId === `${submission.id}:rejected`} onClick={() => onReview(submission.id, "rejected")} label="拒绝" icon={<X className="h-4 w-4" />} />
                  </div>
                </td>
              </tr>
            ))}
            {!submissions.length ? <EmptyRow colSpan={5} text="当前筛选下没有提交记录。" /> : null}
          </tbody>
        </table>
      </section>
    </>
  );
}

function StationsSection({ actionId, bucket, form, isCreating, loading, search, selectedStation, stations, onBucketChange, onFormChange, onNewStation, onRemoveStation, onRestoreStation, onSave, onSearchChange, onSelectStation }: {
  actionId: string | null;
  bucket: StationBucket;
  form: StationFormState | null;
  isCreating: boolean;
  loading: boolean;
  search: string;
  selectedStation: TransitStation | null;
  stations: TransitStation[];
  onBucketChange: (bucket: StationBucket) => void;
  onFormChange: (form: StationFormState) => void;
  onNewStation: () => void;
  onRemoveStation: (id: string) => void;
  onRestoreStation: (id: string) => void;
  onSave: (overrides?: Partial<StationFormState>) => void;
  onSearchChange: (value: string) => void;
  onSelectStation: (id: string) => void;
}) {
  return (
    <section className="mt-4 grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="border border-[#d7dddd] bg-white">
        <div className="border-b border-[#d7dddd] p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#202829]">站点目录</h3>
              <p className="mt-1 text-sm text-[#5a6061]">{loading ? "正在读取..." : `共 ${stations.length} 个站点`}</p>
            </div>
            <button type="button" onClick={onNewStation} className={primaryButtonClassName}>
              <Plus className="h-4 w-4" />新增
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {stationBucketOptions.map((option) => (
              <button key={option.value} type="button" onClick={() => onBucketChange(option.value)} className={filterButtonClassName(bucket === option.value)}>{option.label}</button>
            ))}
          </div>
          <div className="mt-3">
            <Field label="搜索站点">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8587]" />
                <input className={`${inputClassName} pl-9`} value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="名称、slug、网址" />
              </div>
            </Field>
          </div>
        </div>
        <div className="max-h-[720px] overflow-y-auto">
          {stations.map((station) => (
            <button
              key={station.id}
              type="button"
              onClick={() => onSelectStation(station.id)}
              className={`block w-full border-b border-[#edf0f0] px-4 py-3 text-left transition hover:bg-[#f7f9f9] ${selectedStation?.id === station.id && !isCreating ? "bg-[#eef3f3]" : "bg-white"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#202829]">{station.name}</p>
                  <p className="mt-1 truncate text-xs text-[#5a6061]">{station.websiteUrl}</p>
                </div>
                <Badge>{station.removedAt ? "已下架" : station.published ? "已发布" : "草稿"}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-[#5a6061]">
                <span>报价 {station.offerCount}</span>
                <span>启用 {station.activeOfferCount}</span>
                <span>{station.status}</span>
              </div>
            </button>
          ))}
          {!stations.length ? <p className="px-4 py-10 text-center text-sm text-[#7a8587]">当前筛选下没有站点。</p> : null}
        </div>
      </div>

      <StationFormPanel
        actionId={actionId}
        form={form}
        isCreating={isCreating}
        onFormChange={onFormChange}
        onRemoveStation={onRemoveStation}
        onRestoreStation={onRestoreStation}
        onSave={onSave}
      />
    </section>
  );
}

function StationFormPanel({ actionId, form, isCreating, onFormChange, onRemoveStation, onRestoreStation, onSave }: {
  actionId: string | null;
  form: StationFormState | null;
  isCreating: boolean;
  onFormChange: (form: StationFormState) => void;
  onRemoveStation: (id: string) => void;
  onRestoreStation: (id: string) => void;
  onSave: (overrides?: Partial<StationFormState>) => void;
}) {
  return (
    <div className="border border-[#d7dddd] bg-white p-4">
      {!form ? (
        <p className="py-10 text-center text-sm text-[#7a8587]">请选择或新增一个站点。</p>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[#202829]"><Edit3 className="h-4 w-4" />{isCreating ? "新增站点" : "编辑站点"}</h2>
              <p className="mt-1 text-sm text-[#5a6061]">{form.id || "保存后生成站点 ID"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isCreating && form.removedAt ? (
                <button type="button" onClick={() => onRestoreStation(form.id)} className={secondaryButtonClassName} disabled={actionId === `station-restore:${form.id}`}>
                  <RefreshCw className="h-4 w-4" />恢复为草稿
                </button>
              ) : null}
              {!isCreating && !form.removedAt ? (
                <button type="button" onClick={() => onRemoveStation(form.id)} className={secondaryButtonClassName} disabled={actionId === `station-remove:${form.id}`}>
                  <X className="h-4 w-4" />下架站点
                </button>
              ) : null}
              <button type="button" onClick={() => onSave({ published: !form.published })} className={secondaryButtonClassName} disabled={Boolean(form.removedAt) || actionId === `station:${form.id}` || actionId === "station:new"}>
                {form.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {form.published ? "保存为草稿" : "保存并发布"}
              </button>
              <button type="submit" className={primaryButtonClassName} disabled={actionId === `station:${form.id}` || actionId === "station:new"}>
                <Save className="h-4 w-4" />保存
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="站点名称"><input className={inputClassName} value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} required /></Field>
            <Field label="Slug"><input className={inputClassName} value={form.slug} onChange={(event) => onFormChange({ ...form, slug: event.target.value })} placeholder="留空时按名称生成" /></Field>
            <Field label="官网"><input className={inputClassName} value={form.websiteUrl} onChange={(event) => onFormChange({ ...form, websiteUrl: event.target.value })} required /></Field>
            <Field label="Logo URL"><input className={inputClassName} value={form.logoUrl} onChange={(event) => onFormChange({ ...form, logoUrl: event.target.value })} /></Field>
            <Field label="API Base"><input className={inputClassName} value={form.apiBaseUrl} onChange={(event) => onFormChange({ ...form, apiBaseUrl: event.target.value })} /></Field>
            <Field label="价格页"><input className={inputClassName} value={form.pricingUrl} onChange={(event) => onFormChange({ ...form, pricingUrl: event.target.value })} /></Field>
            <Field label="监控页"><input className={inputClassName} value={form.monitorUrl} onChange={(event) => onFormChange({ ...form, monitorUrl: event.target.value })} /></Field>
            <Field label="最低充值"><input className={inputClassName} value={form.minimumTopUp} onChange={(event) => onFormChange({ ...form, minimumTopUp: event.target.value })} /></Field>
          </div>

          <Field label="简介"><textarea className={textareaClassName} value={form.summary} onChange={(event) => onFormChange({ ...form, summary: event.target.value })} /></Field>

          <div className="grid gap-3 md:grid-cols-3">
            <SelectField label="发布状态" value={String(form.published)} onChange={(value) => onFormChange({ ...form, published: value === "true" })} options={[["false", "草稿"], ["true", "发布"]]} />
            <SelectField label="站点状态" value={form.status} onChange={(value) => onFormChange({ ...form, status: value as StationFormState["status"] })} options={[["unknown", "未知"], ["active", "正常"], ["risky", "风险"], ["inactive", "不可用"]]} />
            <SelectField label="数据状态" value={form.dataStatus} onChange={(value) => onFormChange({ ...form, dataStatus: value as StationFormState["dataStatus"] })} options={[["pending_review", "待复核"], ["verified", "已核验"], ["stale", "过期"]]} />
            <SelectField label="使用建议" value={form.usageAdvice} onChange={(value) => onFormChange({ ...form, usageAdvice: value as StationFormState["usageAdvice"] })} options={[["pending", "待判断"], ["trial_only", "小额试用"], ["normal", "正常"], ["avoid", "避免使用"]]} />
            <SelectField label="站点系统" value={form.stationSystem} onChange={(value) => onFormChange({ ...form, stationSystem: value as StationFormState["stationSystem"] })} options={[["unknown", "未知"], ["new_api", "New API"], ["sub_to_api", "Sub to API"], ["custom", "自研"]]} />
            <SelectField label="运营主体" value={form.operatorType} onChange={(value) => onFormChange({ ...form, operatorType: value as StationFormState["operatorType"] })} options={[["unknown", "未知"], ["individual", "个人"], ["company", "公司"]]} />
            <SelectField label="发票支持" value={form.invoiceSupport} onChange={(value) => onFormChange({ ...form, invoiceSupport: value as StationFormState["invoiceSupport"] })} options={[["unknown", "未知"], ["supported", "支持"], ["unsupported", "不支持"]]} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="渠道类型"><input className={inputClassName} value={form.channelTypes} onChange={(event) => onFormChange({ ...form, channelTypes: event.target.value })} placeholder="逗号或换行分隔" /></Field>
            <Field label="号池来源"><input className={inputClassName} value={form.accountPools} onChange={(event) => onFormChange({ ...form, accountPools: event.target.value })} placeholder="逗号或换行分隔" /></Field>
            <Field label="支付方式"><input className={inputClassName} value={form.paymentMethods} onChange={(event) => onFormChange({ ...form, paymentMethods: event.target.value })} placeholder="逗号或换行分隔" /></Field>
            <Field label="支持渠道"><input className={inputClassName} value={form.supportChannels} onChange={(event) => onFormChange({ ...form, supportChannels: event.target.value })} placeholder="逗号或换行分隔" /></Field>
            <Field label="风险标签"><input className={inputClassName} value={form.riskLabels} onChange={(event) => onFormChange({ ...form, riskLabels: event.target.value })} placeholder="逗号或换行分隔" /></Field>
            <Field label="余额有效期"><input className={inputClassName} value={form.balanceExpiry} onChange={(event) => onFormChange({ ...form, balanceExpiry: event.target.value })} /></Field>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="优势"><textarea className={textareaClassName} value={form.strengths} onChange={(event) => onFormChange({ ...form, strengths: event.target.value })} placeholder="每行或逗号分隔" /></Field>
            <Field label="注意事项"><textarea className={textareaClassName} value={form.cautions} onChange={(event) => onFormChange({ ...form, cautions: event.target.value })} placeholder="每行或逗号分隔" /></Field>
            <Field label="退款规则"><textarea className={textareaClassName} value={form.refundPolicy} onChange={(event) => onFormChange({ ...form, refundPolicy: event.target.value })} /></Field>
            <Field label="后台备注"><textarea className={textareaClassName} value={form.adminNote} onChange={(event) => onFormChange({ ...form, adminNote: event.target.value })} /></Field>
          </div>
        </form>
      )}
    </div>
  );
}

function OffersSection({ actionId, form, isCreating, loading, offers, selectedOffer, selectedStationId, stations, onFormChange, onNewOffer, onSave, onSelectOffer, onSelectStation }: {
  actionId: string | null;
  form: OfferFormState | null;
  isCreating: boolean;
  loading: boolean;
  offers: TransitOffer[];
  selectedOffer: TransitOffer | null;
  selectedStationId: string | null;
  stations: TransitStation[];
  onFormChange: (form: OfferFormState) => void;
  onNewOffer: (stationId?: string) => void;
  onSave: (overrides?: Partial<OfferFormState>) => void;
  onSelectOffer: (id: string) => void;
  onSelectStation: (id: string) => void;
}) {
  const selectedStation = stations.find((station) => station.id === selectedStationId) || stations[0] || null;
  const stationName = (stationId: string) => stations.find((station) => station.id === stationId)?.name || stationId;
  const [familyFilter, setFamilyFilter] = useState<OfferFamily | "all">("all");
  const [statusFilter, setStatusFilter] = useState<OfferStatus | "all">("all");
  const offerStats = useMemo(() => ({
    total: offers.length,
    active: offers.filter((offer) => offer.status === "active").length,
    needsReview: offers.filter((offer) => offer.status === "needs_review").length,
    inactive: offers.filter((offer) => offer.status === "inactive").length,
  }), [offers]);
  const visibleOffers = useMemo(() => offers.filter((offer) => {
    if (familyFilter !== "all" && offer.family !== familyFilter) return false;
    if (statusFilter !== "all" && offer.status !== statusFilter) return false;
    return true;
  }), [familyFilter, offers, statusFilter]);
  const groupedOffers = useMemo(() => {
    const groups = new Map<OfferFamily, TransitOffer[]>();
    for (const offer of visibleOffers) {
      groups.set(offer.family, [...(groups.get(offer.family) || []), offer]);
    }
    return offerFamilyOptions
      .map((option) => option.value)
      .filter((value): value is OfferFamily => value !== "all" && groups.has(value))
      .map((family) => ({ family, offers: groups.get(family) || [] }));
  }, [visibleOffers]);

  return (
    <section className="mt-4 grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="border border-[#d7dddd] bg-white">
        <div className="border-b border-[#d7dddd] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#202829]">报价目录</h3>
              <p className="mt-1 text-sm text-[#5a6061]">{loading ? "正在读取..." : `当前筛选 ${visibleOffers.length} 条报价`}</p>
            </div>
            <button type="button" onClick={() => onNewOffer(selectedStation?.id)} className={primaryButtonClassName} disabled={!stations.length}>
              <Plus className="h-4 w-4" />新增
            </button>
          </div>
          <div className="mt-4">
            <Field label="站点">
              <select value={selectedStation?.id || ""} onChange={(event) => onSelectStation(event.target.value)} className={inputClassName}>
                {stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="mt-3 grid grid-cols-4 border border-[#d7dddd] text-center">
            <OfferMetric label="总数" value={offerStats.total} />
            <OfferMetric label="启用" value={offerStats.active} />
            <OfferMetric label="待复核" value={offerStats.needsReview} />
            <OfferMetric label="停用" value={offerStats.inactive} />
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {offerFamilyOptions.map((option) => (
                <button key={option.value} type="button" onClick={() => setFamilyFilter(option.value)} className={miniFilterButtonClassName(familyFilter === option.value)}>{option.label}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {offerStatusOptions.map((option) => (
                <button key={option.value} type="button" onClick={() => setStatusFilter(option.value)} className={miniFilterButtonClassName(statusFilter === option.value)}>{option.label}</button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {groupedOffers.map((group) => (
              <span key={group.family} className="inline-flex h-7 items-center border border-[#d7dddd] bg-white px-2 text-xs font-semibold text-[#5a6061]">
                {offerFamilyLabels[group.family]} {group.offers.length}
              </span>
            ))}
          </div>
        </div>
        <div className="max-h-[720px] overflow-y-auto">
          {visibleOffers.map((offer) => (
            <button
              key={offer.id}
              type="button"
              onClick={() => onSelectOffer(offer.id)}
              className={`block w-full border-b border-[#edf0f0] px-4 py-3 text-left transition hover:bg-[#f7f9f9] ${selectedOffer?.id === offer.id && !isCreating ? "bg-[#eef3f3]" : "bg-white"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#202829]">{offer.standardModel}</p>
                  <p className="mt-1 truncate text-xs text-[#5a6061]">{stationName(offer.stationId)} / {offer.groupName}</p>
                </div>
                <Badge>{offerStatusLabels[offer.status]}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-[#5a6061]">
                <span>{offerFamilyLabels[offer.family]}</span>
                {offer.rechargeRatio ? <span>比例 {offer.rechargeRatio}</span> : null}
                {offer.modelMultiplier !== null ? <span>倍率 {offer.modelMultiplier}</span> : null}
                {offer.inputPrice !== null ? <span>输入 {offer.inputPrice}</span> : null}
                {offer.outputPrice !== null ? <span>输出 {offer.outputPrice}</span> : null}
              </div>
            </button>
          ))}
          {!visibleOffers.length ? <p className="px-4 py-10 text-center text-sm text-[#7a8587]">当前筛选下没有报价。</p> : null}
        </div>
      </div>

      <OfferFormPanel actionId={actionId} form={form} isCreating={isCreating} stations={stations} onFormChange={onFormChange} onSave={onSave} />
    </section>
  );
}

function OfferFormPanel({ actionId, form, isCreating, stations, onFormChange, onSave }: {
  actionId: string | null;
  form: OfferFormState | null;
  isCreating: boolean;
  stations: TransitStation[];
  onFormChange: (form: OfferFormState) => void;
  onSave: (overrides?: Partial<OfferFormState>) => void;
}) {
  return (
    <div className="border border-[#d7dddd] bg-white p-4">
      {!form ? (
        <p className="py-10 text-center text-sm text-[#7a8587]">请选择或新增一条报价。</p>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[#202829]"><Edit3 className="h-4 w-4" />{isCreating ? "新增报价" : "编辑报价"}</h2>
              <p className="mt-1 text-sm text-[#5a6061]">{form.id || "保存后生成报价 ID"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onSave({ status: form.status === "active" ? "inactive" : "active" })} className={secondaryButtonClassName} disabled={actionId === `offer:${form.id}` || actionId === "offer:new" || !form.stationId}>
                {form.status === "active" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {form.status === "active" ? "保存并停用" : "保存并启用"}
              </button>
              <button type="submit" className={primaryButtonClassName} disabled={actionId === `offer:${form.id}` || actionId === "offer:new" || !form.stationId}>
                <Save className="h-4 w-4" />保存
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <SelectField label="站点" value={form.stationId} onChange={(value) => onFormChange({ ...form, stationId: value })} options={stations.map((station): [string, string] => [station.id, station.name])} />
            <SelectField label="模型系列" value={form.family} onChange={(value) => onFormChange({ ...form, family: value as OfferFamily })} options={[["gpt", "GPT"], ["claude", "Claude"], ["gemini", "Gemini"], ["grok", "Grok"], ["glm", "GLM"], ["deepseek", "DeepSeek"], ["image", "图片"], ["video", "视频"]]} />
            <SelectField label="状态" value={form.status} onChange={(value) => onFormChange({ ...form, status: value as OfferStatus })} options={[["needs_review", "待复核"], ["active", "启用"], ["inactive", "停用"]]} />
            <Field label="标准模型"><input list="transit-standard-models" className={inputClassName} value={form.standardModel} onChange={(event) => onFormChange({ ...form, standardModel: event.target.value })} required /></Field>
            <Field label="原始模型名"><input className={inputClassName} value={form.rawModelName} onChange={(event) => onFormChange({ ...form, rawModelName: event.target.value })} /></Field>
            <Field label="分组"><input className={inputClassName} value={form.groupName} onChange={(event) => onFormChange({ ...form, groupName: event.target.value })} required /></Field>
          </div>

          <datalist id="transit-standard-models">
            {TRANSIT_STANDARD_MODELS.map((model) => <option key={model} value={model} />)}
          </datalist>

          <div className="grid gap-3 md:grid-cols-4">
            <Field label="充值比例"><input className={inputClassName} value={form.rechargeRatio} onChange={(event) => onFormChange({ ...form, rechargeRatio: event.target.value })} placeholder="如 1:1" /></Field>
            <Field label="模型倍率"><input className={inputClassName} value={form.modelMultiplier} onChange={(event) => onFormChange({ ...form, modelMultiplier: event.target.value })} inputMode="decimal" /></Field>
            <Field label="输入价"><input className={inputClassName} value={form.inputPrice} onChange={(event) => onFormChange({ ...form, inputPrice: event.target.value })} inputMode="decimal" /></Field>
            <Field label="输出价"><input className={inputClassName} value={form.outputPrice} onChange={(event) => onFormChange({ ...form, outputPrice: event.target.value })} inputMode="decimal" /></Field>
            <Field label="缓存读"><input className={inputClassName} value={form.cacheReadPrice} onChange={(event) => onFormChange({ ...form, cacheReadPrice: event.target.value })} inputMode="decimal" /></Field>
            <Field label="缓存写"><input className={inputClassName} value={form.cacheWritePrice} onChange={(event) => onFormChange({ ...form, cacheWritePrice: event.target.value })} inputMode="decimal" /></Field>
            <Field label="固定价格"><input className={inputClassName} value={form.fixedPrice} onChange={(event) => onFormChange({ ...form, fixedPrice: event.target.value })} inputMode="decimal" /></Field>
            <Field label="固定单位"><input className={inputClassName} value={form.fixedPriceUnit} onChange={(event) => onFormChange({ ...form, fixedPriceUnit: event.target.value })} placeholder="次 / 月 / 张" /></Field>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="号池"><input className={inputClassName} value={form.accountPool} onChange={(event) => onFormChange({ ...form, accountPool: event.target.value })} placeholder="pro / plus / mixed / undisclosed" /></Field>
            <Field label="渠道类型"><input className={inputClassName} value={form.channelType} onChange={(event) => onFormChange({ ...form, channelType: event.target.value })} placeholder="first_party_pool / reseller / mixed" /></Field>
            <Field label="价格来源"><input className={inputClassName} value={form.priceSource} onChange={(event) => onFormChange({ ...form, priceSource: event.target.value })} /></Field>
            <Field label="核验时间"><input type="datetime-local" className={inputClassName} value={form.lastVerifiedAt} onChange={(event) => onFormChange({ ...form, lastVerifiedAt: event.target.value })} /></Field>
          </div>
        </form>
      )}
    </div>
  );
}

function stationToForm(station: TransitStation): StationFormState {
  return {
    id: station.id,
    name: station.name,
    slug: station.slug,
    websiteUrl: station.websiteUrl,
    logoUrl: station.logoUrl || "",
    apiBaseUrl: station.apiBaseUrl || "",
    pricingUrl: station.pricingUrl || "",
    monitorUrl: station.monitorUrl || "",
    summary: station.summary || "",
    status: station.status,
    published: station.published,
    stationSystem: station.stationSystem,
    operatorType: station.operatorType,
    invoiceSupport: station.invoiceSupport,
    channelTypes: station.channelTypes.join(", "),
    accountPools: station.accountPools.join(", "),
    paymentMethods: station.paymentMethods.join(", "),
    supportChannels: station.supportChannels.join(", "),
    riskLabels: station.riskLabels.join(", "),
    minimumTopUp: station.minimumTopUp || "",
    balanceExpiry: station.balanceExpiry || "",
    refundPolicy: station.refundPolicy || "",
    strengths: station.strengths.join("\n"),
    cautions: station.cautions.join("\n"),
    usageAdvice: station.usageAdvice,
    dataStatus: station.dataStatus,
    adminNote: station.adminNote || "",
    removedAt: station.removedAt || null,
    removedReason: station.removedReason || null,
  };
}

function newStationForm(): StationFormState {
  return {
    id: "",
    name: "",
    slug: "",
    websiteUrl: "",
    logoUrl: "",
    apiBaseUrl: "",
    pricingUrl: "",
    monitorUrl: "",
    summary: "",
    status: "unknown",
    published: false,
    stationSystem: "unknown",
    operatorType: "unknown",
    invoiceSupport: "unknown",
    channelTypes: "",
    accountPools: "",
    paymentMethods: "",
    supportChannels: "",
    riskLabels: "",
    minimumTopUp: "",
    balanceExpiry: "",
    refundPolicy: "",
    strengths: "",
    cautions: "",
    usageAdvice: "pending",
    dataStatus: "pending_review",
    adminNote: "",
    removedAt: null,
    removedReason: null,
  };
}

function formToStationPayload(form: StationFormState) {
  return {
    ...(form.id ? { id: form.id } : {}),
    name: form.name,
    slug: nullableText(form.slug) || undefined,
    websiteUrl: form.websiteUrl,
    logoUrl: nullableUrl(form.logoUrl),
    apiBaseUrl: nullableUrl(form.apiBaseUrl),
    pricingUrl: nullableUrl(form.pricingUrl),
    monitorUrl: nullableUrl(form.monitorUrl),
    summary: form.summary,
    status: form.status,
    published: form.published,
    stationSystem: form.stationSystem,
    operatorType: form.operatorType,
    invoiceSupport: form.invoiceSupport,
    channelTypes: splitList(form.channelTypes),
    accountPools: splitList(form.accountPools),
    paymentMethods: splitList(form.paymentMethods),
    supportChannels: splitList(form.supportChannels),
    riskLabels: splitList(form.riskLabels),
    minimumTopUp: nullableText(form.minimumTopUp),
    balanceExpiry: nullableText(form.balanceExpiry),
    refundPolicy: nullableText(form.refundPolicy),
    strengths: splitList(form.strengths),
    cautions: splitList(form.cautions),
    usageAdvice: form.usageAdvice,
    dataStatus: form.dataStatus,
    adminNote: nullableText(form.adminNote),
  };
}

function offerToForm(offer: TransitOffer): OfferFormState {
  return {
    id: offer.id,
    stationId: offer.stationId,
    family: offer.family,
    standardModel: offer.standardModel,
    rawModelName: offer.rawModelName || "",
    groupName: offer.groupName || "default",
    rechargeRatio: offer.rechargeRatio || "",
    modelMultiplier: numberToText(offer.modelMultiplier),
    inputPrice: numberToText(offer.inputPrice),
    outputPrice: numberToText(offer.outputPrice),
    cacheReadPrice: numberToText(offer.cacheReadPrice),
    cacheWritePrice: numberToText(offer.cacheWritePrice),
    fixedPrice: numberToText(offer.fixedPrice),
    fixedPriceUnit: offer.fixedPriceUnit || "",
    accountPool: offer.accountPool || "undisclosed",
    channelType: offer.channelType || "undisclosed",
    priceSource: offer.priceSource || "后台手动录入",
    status: offer.status,
    lastVerifiedAt: toDatetimeLocal(offer.lastVerifiedAt),
  };
}

function newOfferForm(stationId: string): OfferFormState {
  return {
    id: "",
    stationId,
    family: "gpt",
    standardModel: "GPT 5.5",
    rawModelName: "",
    groupName: "default",
    rechargeRatio: "1:1",
    modelMultiplier: "",
    inputPrice: "",
    outputPrice: "",
    cacheReadPrice: "",
    cacheWritePrice: "",
    fixedPrice: "",
    fixedPriceUnit: "",
    accountPool: "undisclosed",
    channelType: "undisclosed",
    priceSource: "后台手动录入",
    status: "needs_review",
    lastVerifiedAt: "",
  };
}

function formToOfferPayload(form: OfferFormState) {
  return {
    ...(form.id ? { id: form.id } : {}),
    stationId: form.stationId,
    family: form.family,
    standardModel: form.standardModel,
    rawModelName: nullableText(form.rawModelName),
    groupName: form.groupName || "default",
    rechargeRatio: nullableText(form.rechargeRatio),
    modelMultiplier: nullableNumber(form.modelMultiplier),
    inputPrice: nullableNumber(form.inputPrice),
    outputPrice: nullableNumber(form.outputPrice),
    cacheReadPrice: nullableNumber(form.cacheReadPrice),
    cacheWritePrice: nullableNumber(form.cacheWritePrice),
    fixedPrice: nullableNumber(form.fixedPrice),
    fixedPriceUnit: nullableText(form.fixedPriceUnit),
    currency: "CNY" as const,
    accountPool: nullableText(form.accountPool),
    channelType: nullableText(form.channelType),
    priceSource: nullableText(form.priceSource),
    status: form.status,
    lastVerifiedAt: datetimeLocalToIso(form.lastVerifiedAt),
  };
}

function splitList(value: string): string[] {
  return Array.from(new Set(value.split(/[\n,，/|]+/).map((item) => item.trim()).filter(Boolean)));
}

function nullableText(value: string): string | null {
  const text = value.trim();
  return text ? text : null;
}

function nullableUrl(value: string): string | null {
  return nullableText(value);
}

function numberToText(value: number | null): string {
  return value === null || value === undefined ? "" : String(value);
}

function nullableNumber(value: string): number | null {
  const text = value.trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function datetimeLocalToIso(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function AdminFrame({ children }: { children: ReactNode }) {
  return <main className="priceai-square-ui min-h-screen bg-[#f4f6f6] px-4 py-6 text-[#202829] sm:px-6 lg:px-8">{children}</main>;
}

function Panel({ children }: { children: ReactNode }) {
  return <section className="mx-auto max-w-md border border-[#d7dddd] bg-white p-5 text-sm text-[#5a6061]">{children}</section>;
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#5a6061]">{label}</span>{children}</label>;
}

function SelectField({ label, onChange, options, value }: { label: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </Field>
  );
}

function AdminNavButton({ active, count, icon, label, onClick }: { active: boolean; count: number; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 w-full items-center justify-between border px-3 text-sm font-semibold transition ${active ? "border-white bg-white text-[#202829]" : "border-transparent text-white/65 hover:border-white/12 hover:bg-white/[0.06] hover:text-white"}`}
    >
      <span className="flex items-center gap-2">{icon}{label}</span>
      <span className={`min-w-7 px-2 py-0.5 text-center text-xs ${active ? "bg-[#eef3f3] text-[#202829]" : "bg-white/10 text-white/70"}`}>{count}</span>
    </button>
  );
}

function DashboardMetric({ hint, icon, label, value }: { hint: string; icon: ReactNode; label: string; value: number }) {
  return (
    <div className="border border-[#d7dddd] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[0.68rem] uppercase text-[#7a8587]">{label}</p>
          <p className="mt-2 text-3xl font-semibold leading-none text-[#202829]">{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center border border-[#d7dddd] bg-[#f2f4f4] text-[#2d3435]">{icon}</span>
      </div>
      <p className="mt-3 text-sm text-[#5a6061]">{hint}</p>
    </div>
  );
}

function OfferMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r border-[#d7dddd] px-2 py-2 last:border-r-0">
      <p className="font-mono text-[0.62rem] uppercase text-[#7a8587]">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-[#202829]">{value}</p>
    </div>
  );
}

function Notice({ children, tone }: { children: ReactNode; tone: "success" | "error" }) {
  return <p className={`mt-4 border px-3 py-2 text-sm ${tone === "success" ? "border-[#b9d8c4] bg-[#ecf7ef] text-[#2f7a4b]" : "border-[#e7c3bd] bg-[#fbe9e7] text-[#9b3328]"}`}>{children}</p>;
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="inline-flex h-7 items-center bg-[#eef3f3] px-2.5 text-xs font-semibold text-[#2d3435]">{children}</span>;
}

function ActionButton({ icon, label, loading, onClick }: { icon: ReactNode; label: string; loading: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={loading} onClick={onClick} className="inline-flex h-9 items-center gap-1.5 border border-[#adb3b4]/35 bg-white px-2.5 text-xs font-semibold text-[#2d3435] transition hover:bg-[#f2f4f4] disabled:cursor-not-allowed disabled:opacity-60">
      {icon}{loading ? "处理中" : label}
    </button>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return <tr><td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-[#7a8587]">{text}</td></tr>;
}

function safeDomain(value: string): string | null {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function filterButtonClassName(active: boolean): string {
  return `h-9 border px-3 text-sm font-semibold transition ${active ? "border-[#202829] bg-[#202829] text-white" : "border-[#adb3b4]/35 bg-white text-[#2d3435] hover:bg-[#f2f4f4]"}`;
}

function miniFilterButtonClassName(active: boolean): string {
  return `h-8 border px-2.5 text-xs font-semibold transition ${active ? "border-[#202829] bg-[#202829] text-white" : "border-[#adb3b4]/35 bg-white text-[#2d3435] hover:bg-[#f2f4f4]"}`;
}

const inputClassName = "h-11 w-full border border-[#adb3b4]/40 bg-white px-3 text-sm text-[#202829] outline-none focus:border-[#2d3435]";
const textareaClassName = "min-h-24 w-full resize-y border border-[#adb3b4]/40 bg-white px-3 py-2 text-sm leading-6 text-[#202829] outline-none focus:border-[#2d3435]";
const primaryButtonClassName = "inline-flex h-10 items-center justify-center gap-2 bg-[#202829] px-3 text-sm font-semibold text-white transition hover:bg-[#111617] disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClassName = "inline-flex h-10 items-center justify-center gap-2 border border-[#adb3b4]/35 bg-white px-3 text-sm font-semibold text-[#2d3435] transition hover:bg-[#f2f4f4] disabled:cursor-not-allowed disabled:opacity-60";
