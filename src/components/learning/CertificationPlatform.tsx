import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Award, BarChart3, CheckCircle, Download, History, RefreshCw, Search, ShieldCheck, XCircle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { auth } from "../../firebase";
import { useToast } from "../../context/ToastContext";
import { useUserRole } from "../../context/UserRoleContext";

type Tab = "history" | "verify" | "audit" | "analytics";
type Certificate = { id: string; userId: string; studentName: string; examTitle: string; language: string; scorePercent: number; issueDate: string; verificationCode: string; status: "issued" | "revoked"; documentStatus: "pending" | "ready" | "failed"; deliveryStatus: "not_sent" | "sent" | "failed"; documentUrl: string | null; documentSizeBytes: number | null; documentSha256: string | null };
type AuditEvent = { id: string; certificateId: string | null; actorId: string; action: string; result: string; createdAt: string };
type Metrics = { total: number; issued: number; revoked: number; readyDocuments: number; pendingDocuments: number; averageScorePercent: number | null; emissionsByMonth: { month: string; count: number }[] };
const emptyMetrics: Metrics = { total: 0, issued: 0, revoked: 0, readyDocuments: 0, pendingDocuments: 0, averageScorePercent: null, emissionsByMonth: [] };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sessão não autenticada.");
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || payload.error || "Operação indisponível.");
  return payload;
}

export const CertificationPlatform: React.FC = () => {
  const { role } = useUserRole();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("history");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationResult, setVerificationResult] = useState<Certificate | null>(null);
  const [verificationError, setVerificationError] = useState("");
  const admin = ["SUPER_ADMIN", "PLATFORM_ADMIN", "SCHOOL_ADMIN", "ORG_ADMIN"].includes(String(role).toUpperCase());

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [certificateData, auditData, metricData] = await Promise.all([api<Certificate[]>("/api/certification/certificates"), api<AuditEvent[]>("/api/certification/audit"), api<Metrics>("/api/certification/metrics")]);
      setCertificates(certificateData); setAuditEvents(auditData); setMetrics(metricData);
    } catch (err: any) {
      setError(err.message || "Não foi possível consultar os certificados persistidos."); setCertificates([]); setAuditEvents([]); setMetrics(emptyMetrics);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return certificates;
    return certificates.filter((item) => [item.studentName, item.examTitle, item.verificationCode, item.id].some((value) => String(value || "").toLowerCase().includes(needle)));
  }, [certificates, search]);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault(); setVerificationResult(null); setVerificationError("");
    if (!verificationCode.trim()) return setVerificationError("Informe o código de verificação.");
    try { setVerificationResult(await api<Certificate>(`/api/certification/verify/${encodeURIComponent(verificationCode.trim())}`)); setAuditEvents(await api<AuditEvent[]>("/api/certification/audit")); }
    catch (err: any) { setVerificationError(err.message || "Certificado não encontrado."); }
  };

  const revoke = async (certificate: Certificate) => {
    if (!admin || !window.confirm(`Revogar o certificado ${certificate.verificationCode}?`)) return;
    try { await api(`/api/certification/certificates/${encodeURIComponent(certificate.id)}/revoke`, { method: "POST" }); addToast("Certificado revogado e evento de auditoria persistido.", "info"); await load(); }
    catch (err: any) { addToast(err.message || "Não foi possível revogar o certificado.", "error"); }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [{ id: "history", label: "Certificados", icon: Award }, { id: "verify", label: "Verificar", icon: ShieldCheck }, { id: "audit", label: "Auditoria", icon: History }, { id: "analytics", label: "Métricas", icon: BarChart3 }];
  return <div className="min-h-screen bg-slate-50 p-3 text-slate-800 md:p-6" id="certification-platform-main">
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h1 className="text-2xl font-bold text-slate-950 md:text-3xl">Certificação LingoLIVE</h1><p className="mt-1 text-sm text-slate-500">Dados emitidos, documentos e auditorias provenientes exclusivamente do backend persistido.</p></div><button onClick={() => void load()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar</button></div>
    {error && <div className="mb-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="h-5 w-5 shrink-0" /><div><strong>Dados indisponíveis</strong><p>{error}</p><p className="mt-1 text-xs">Nenhum registro local ou demonstrativo foi exibido.</p></div></div>}
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">{[["Total", metrics.total], ["Válidos", metrics.issued], ["Revogados", metrics.revoked], ["PDFs prontos", metrics.readyDocuments], ["PDFs pendentes", metrics.pendingDocuments]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><span className="text-xs font-semibold uppercase text-slate-400">{label}</span><strong className="mt-1 block text-2xl text-slate-900">{value}</strong></div>)}</div>
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === id ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}><Icon className="h-4 w-4" />{label}</button>)}</div>

    {activeTab === "history" && <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-5"><div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar aluno, exame ou código" className="w-full bg-transparent py-2.5 text-sm outline-none" /></div>{loading ? <p className="py-10 text-center text-sm text-slate-400">Consultando registros persistidos…</p> : filtered.length === 0 ? <p className="py-10 text-center text-sm text-slate-400">Nenhum certificado real encontrado.</p> : <div className="space-y-3">{filtered.map((cert) => <article key={cert.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 p-4 lg:flex-row lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{cert.examTitle}</h3><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cert.status === "revoked" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{cert.status === "revoked" ? "Revogado" : "Válido"}</span></div><p className="text-sm text-slate-600">{cert.studentName} · {cert.language} · {cert.scorePercent}%</p><p className="mt-1 font-mono text-xs text-slate-400">{cert.verificationCode} · {new Date(cert.issueDate).toLocaleDateString()}</p></div><div className="flex flex-wrap gap-2">{cert.documentStatus === "ready" && cert.documentUrl ? <a href={cert.documentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700"><Download className="h-3.5 w-3.5" />PDF oficial</a> : <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Documento pendente</span>}{admin && cert.status !== "revoked" && <button onClick={() => void revoke(cert)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Revogar</button>}</div></article>)}</div>}</section>}
    {activeTab === "verify" && <section className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="mb-1 text-lg font-bold">Verificação persistida</h2><p className="mb-4 text-sm text-slate-500">A consulta usa o código gravado no backend e registra o resultado na auditoria.</p><form onSubmit={verify} className="flex flex-col gap-2 sm:flex-row"><input value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="Ex.: LL-VAL-ABC123" className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" /><button className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white">Verificar</button></form>{verificationError && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"><XCircle className="h-5 w-5" />{verificationError}</div>}{verificationResult && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center gap-2 font-bold text-emerald-800"><CheckCircle className="h-5 w-5" />Registro encontrado</div><p className="mt-2 text-sm text-emerald-900">{verificationResult.studentName} — {verificationResult.examTitle}</p><p className="text-xs text-emerald-700">Estado: {verificationResult.status === "revoked" ? "revogado" : "válido"}</p></div>}</section>}
    {activeTab === "audit" && <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">Eventos reais de auditoria</h2>{auditEvents.length === 0 ? <p className="py-10 text-center text-sm text-slate-400">Nenhum evento persistido.</p> : <div className="space-y-2">{auditEvents.map((event) => <div key={event.id} className="rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-300"><div className="flex flex-wrap justify-between gap-2"><strong className="text-indigo-300">{event.action}</strong><span>{new Date(event.createdAt).toLocaleString()}</span></div><p className="mt-2">Certificado: {event.certificateId || "não localizado"}</p><p>Resultado: {event.result} · Operador: {event.actorId}</p></div>)}</div>}</section>}
    {activeTab === "analytics" && <section className="grid gap-5 lg:grid-cols-3"><div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><span className="text-xs font-semibold uppercase text-slate-400">Pontuação média real</span><strong className="mt-2 block text-3xl text-indigo-600">{metrics.averageScorePercent === null ? "—" : `${metrics.averageScorePercent}%`}</strong></div><div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2"><h2 className="mb-4 font-bold">Emissões por mês</h2>{metrics.emissionsByMonth.length === 0 ? <p className="py-20 text-center text-sm text-slate-400">Sem emissões persistidas para representar.</p> : <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={metrics.emissionsByMonth}><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Area type="monotone" dataKey="count" stroke="#4f46e5" fill="#c7d2fe" /></AreaChart></ResponsiveContainer></div>}</div></section>}
  </div>;
};
