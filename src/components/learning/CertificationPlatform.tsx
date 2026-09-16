import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Award, BarChart3, CheckCircle, Download, Eye, History, RefreshCw, Search, ShieldCheck, X, XCircle } from "lucide-react";
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

function scoreToLevel(score: number): string {
  if (score >= 90) return "C2";
  if (score >= 80) return "C1";
  if (score >= 70) return "B2";
  if (score >= 60) return "B1";
  if (score >= 50) return "A2";
  return "A1";
}

function levelLabel(level: string): string {
  const map: Record<string, string> = { C2: "Mastery · 200h", C1: "Advanced · 160h", B2: "Upper-Intermediate · 120h", B1: "Intermediate · 80h", A2: "Elementary · 60h", A1: "Beginner · 40h" };
  return map[level] ?? "120 study hours";
}

function buildCertHTML(cert: Certificate): string {
  const level = scoreToLevel(cert.scorePercent);
  const dateStr = new Date(cert.issueDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  const name = cert.studentName || "Student Name";
  const pill = `${cert.language} — ${level}`;
  const hours = levelLabel(level);
  const code = cert.verificationCode;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LingoLive Certificate</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500;600;700;800&family=Great+Vibes&display=swap">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{min-height:100vh;background:#eef2ff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 10px;font-family:'Inter',sans-serif;gap:12px}
.controls{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.btn{padding:8px 20px;border-radius:8px;border:1.5px solid #4338ca;background:transparent;color:#4338ca;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;letter-spacing:.5px;cursor:pointer;transition:background .2s,color .2s}
.btn:hover,.btn.primary{background:#4338ca;color:#fff}
.lang-bar{display:flex;gap:5px;align-items:center}
.lang-btn{padding:4px 12px;border-radius:20px;border:1px solid #c7d2fe;background:#fff;color:#4338ca;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif}
.lang-btn.active,.lang-btn:hover{background:#4338ca;color:#fff;border-color:#4338ca}
.cert{width:960px;height:680px;max-width:100%;background:#ffffff;position:relative;overflow:hidden;box-shadow:0 0 0 1px #c7d2fe,0 0 0 5px #fff,0 0 0 6px #818cf8,0 30px 60px rgba(67,56,202,.18);border-radius:3px}
.cert-header{position:absolute;top:0;left:0;right:0;height:185px;background:linear-gradient(135deg,#1e1b4b 0%,#312e81 28%,#4338ca 62%,#6366f1 100%)}
.cert-header::before{content:'';position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,transparent 0%,#fbbf24 20%,#f59e0b 50%,#fbbf24 80%,transparent 100%)}
.cert-footer{position:absolute;bottom:0;left:0;right:0;height:72px;background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%)}
.cert-footer::after{content:'';position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,transparent 0%,#fbbf24 20%,#f59e0b 50%,#fbbf24 80%,transparent 100%)}
.cert-logo{position:absolute;top:20px;left:32px;display:flex;align-items:center;gap:10px}
.cert-logo-box{width:40px;height:40px;background:rgba(255,255,255,.12);border:1.5px solid rgba(251,191,36,.55);border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:22px;font-weight:800;color:#fbbf24}
.cert-logo-name{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#fff}
.cert-logo-sub{font-family:'Inter',sans-serif;font-size:7.5px;font-weight:500;color:rgba(251,191,36,.8);letter-spacing:2.8px;text-transform:uppercase}
.cert-seal{position:absolute;top:16px;right:32px;width:76px;height:76px}
.cert-head-center{position:absolute;top:0;left:120px;right:120px;height:185px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}
.cert-eyebrow{font-family:'Inter',sans-serif;font-size:8px;font-weight:600;letter-spacing:4px;color:rgba(251,191,36,.75);text-transform:uppercase}
.cert-title{font-family:'Playfair Display',serif;font-size:44px;font-weight:800;color:#fff;line-height:1;letter-spacing:4px;text-transform:uppercase;text-shadow:0 2px 24px rgba(99,102,241,.4)}
.cert-subtitle{font-family:'Inter',sans-serif;font-size:9px;font-weight:500;letter-spacing:4px;text-transform:uppercase;color:rgba(199,210,254,.85)}
.cert-lang-strip{display:flex;gap:8px;align-items:center;margin-top:4px}
.cert-lang-dot{font-family:'Inter',sans-serif;font-size:7px;font-weight:600;letter-spacing:1px;color:rgba(251,191,36,.6);text-transform:uppercase}
.cert-lang-sep{color:rgba(255,255,255,.25);font-size:8px}
.cert-body{position:absolute;top:185px;bottom:72px;left:0;right:0}
.cert-text-col{position:absolute;top:0;bottom:0;left:0;right:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 60px;gap:0}
.cert-presented{font-family:'Inter',sans-serif;font-size:9px;font-weight:600;letter-spacing:3px;color:#6366f1;text-transform:uppercase;margin-bottom:8px}
.cert-name{font-family:'Great Vibes',cursive;font-size:52px;font-weight:400;color:#1e1b4b;line-height:1.1;text-align:center}
.cert-divider{width:240px;height:1px;margin:12px auto;background:linear-gradient(90deg,transparent,#818cf8,transparent)}
.cert-body-text{font-family:'Cormorant Garamond',serif;font-size:13px;font-weight:400;font-style:italic;color:#475569;text-align:center;line-height:1.75;max-width:420px}
.cert-body-text strong{color:#4338ca;font-style:normal;font-weight:600}
.cert-pill-row{display:flex;align-items:center;gap:10px;margin-top:14px;padding:8px 18px;background:#f0f4ff;border:1px solid #e0e7ff;border-radius:6px}
.cert-pill{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;color:#fff;background:linear-gradient(135deg,#4338ca,#6366f1);padding:3px 12px;border-radius:999px;text-transform:uppercase}
.cert-pill-text{font-family:'Inter',sans-serif;font-size:11px;font-weight:500;color:#334155}
.cert-footer-content{position:absolute;bottom:0;left:0;right:0;height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 44px}
.cert-sig{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:110px}
.cert-sig-val{font-family:'Cormorant Garamond',serif;font-size:11px;font-style:italic;color:rgba(255,255,255,.9)}
.cert-sig-line{width:90px;height:1px;background:rgba(251,191,36,.35)}
.cert-sig-role{font-family:'Inter',sans-serif;font-size:7px;font-weight:600;letter-spacing:2px;color:rgba(199,210,254,.7);text-transform:uppercase}
.cert-code{display:flex;flex-direction:column;align-items:center;gap:3px}
.cert-code-label{font-family:'Inter',sans-serif;font-size:7px;font-weight:600;letter-spacing:2px;color:rgba(199,210,254,.65);text-transform:uppercase}
.cert-code-val{font-family:'Inter',monospace;font-size:10px;font-weight:700;letter-spacing:2px;color:#fbbf24}
.cert-date-val{font-family:'Cormorant Garamond',serif;font-size:11px;font-style:italic;color:rgba(255,255,255,.9)}
.cert-date-label{font-family:'Inter',sans-serif;font-size:7px;font-weight:600;letter-spacing:2px;color:rgba(199,210,254,.7);text-transform:uppercase}
@media print{body{background:white;padding:0}.controls,.lang-bar{display:none}.cert{box-shadow:none;width:100%;height:auto}}
</style>
</head>
<body>
<div class="lang-bar">
  <span style="font-size:11px;color:#6b7280;font-family:Inter,sans-serif;font-weight:500;">Language:</span>
  <button class="lang-btn active" onclick="setLang('en')">🇬🇧 EN</button>
  <button class="lang-btn" onclick="setLang('pt')">🇵🇹 PT</button>
  <button class="lang-btn" onclick="setLang('es')">🇪🇸 ES</button>
  <button class="lang-btn" onclick="setLang('fr')">🇫🇷 FR</button>
  <button class="lang-btn" onclick="setLang('de')">🇩🇪 DE</button>
</div>
<div class="controls">
  <button class="btn primary" onclick="window.print()">🖨️ Print / Export PDF</button>
</div>
<div class="cert">
  <div class="cert-header"></div>
  <svg style="position:absolute;top:0;left:0;width:100%;height:185px;pointer-events:none;" viewBox="0 0 960 185" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="gH" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#fbbf24" stop-opacity="0"/><stop offset="25%" stop-color="#fbbf24" stop-opacity="0.22"/><stop offset="75%" stop-color="#fbbf24" stop-opacity="0.22"/><stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/></linearGradient></defs>
    <path d="M0,162 Q240,185 480,165 Q720,145 960,168 L960,185 L0,185 Z" fill="rgba(99,102,241,0.28)"/>
    <rect x="0" y="180" width="960" height="1" fill="url(#gH)"/>
    <rect x="20" y="18" width="28" height="1" fill="#fbbf24" opacity="0.38"/><rect x="20" y="18" width="1" height="28" fill="#fbbf24" opacity="0.38"/>
    <rect x="912" y="18" width="28" height="1" fill="#fbbf24" opacity="0.38"/><rect x="939" y="18" width="1" height="28" fill="#fbbf24" opacity="0.38"/>
  </svg>
  <div class="cert-logo">
    <div class="cert-logo-box">L</div>
    <div style="display:flex;flex-direction:column"><span class="cert-logo-name">LingoLive</span><span class="cert-logo-sub">Language Platform</span></div>
  </div>
  <svg class="cert-seal" viewBox="0 0 76 76" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="sG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fde68a"/><stop offset="50%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#b45309"/></linearGradient><path id="sCircle" d="M38,38 m-28,0 a28,28 0 1,1 56,0 a28,28 0 1,1 -56,0"/></defs>
    <circle cx="38" cy="38" r="36" fill="none" stroke="url(#sG)" stroke-width="1.5"/>
    <g transform="translate(38,38)"><circle r="30" fill="rgba(255,255,255,0.12)" stroke="url(#sG)" stroke-width="1.5"/><circle r="24" fill="rgba(255,255,255,0.08)" stroke="rgba(251,191,36,0.5)" stroke-width="0.8"/><text y="5" font-family="Inter,sans-serif" font-size="18" font-weight="800" fill="#fbbf24" text-anchor="middle">⭐</text></g>
    <text font-family="Inter,sans-serif" font-size="5.5" font-weight="700" fill="rgba(251,191,36,0.85)" letter-spacing="1.8"><textPath href="#sCircle" startOffset="10%">· LINGOLIVE · OFFICIAL ·</textPath></text>
  </svg>
  <div class="cert-head-center">
    <span class="cert-eyebrow" id="txt-proudly">Proudly Awarded To</span>
    <h1 class="cert-title" id="txt-cert">Certificate</h1>
    <span class="cert-subtitle" id="txt-completion">of Course Completion</span>
    <div class="cert-lang-strip">
      <span class="cert-lang-dot">EN</span><span class="cert-lang-sep">·</span><span class="cert-lang-dot">PT</span><span class="cert-lang-sep">·</span><span class="cert-lang-dot">ES</span><span class="cert-lang-sep">·</span><span class="cert-lang-dot">FR</span><span class="cert-lang-sep">·</span><span class="cert-lang-dot">DE</span><span class="cert-lang-sep">·</span><span class="cert-lang-dot">ZH</span><span class="cert-lang-sep">·</span><span class="cert-lang-dot">JP</span>
    </div>
  </div>
  <div class="cert-body">
    <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;" viewBox="0 0 960 423" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="dp" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="0.9" fill="#c7d2fe" opacity="0.28"/></pattern></defs>
      <rect x="0" y="0" width="960" height="423" fill="url(#dp)"/>
    </svg>
    <div class="cert-text-col">
      <p class="cert-presented" id="txt-awarded">This Certificate is Awarded to</p>
      <div id="cert-name" class="cert-name">${name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
      <div class="cert-divider"></div>
      <p class="cert-body-text" id="txt-body">for the successful completion of the <strong>LingoLive</strong> language learning programme.<br>This certificate attests to the dedication, commitment and linguistic competence acquired.</p>
      <div class="cert-pill-row">
        <span class="cert-pill" id="txt-lang-pill">${pill.replace(/</g, "&lt;")}</span>
        <span class="cert-pill-text" id="txt-level">${hours.replace(/</g, "&lt;")}</span>
      </div>
    </div>
    <svg style="position:absolute;right:10px;bottom:12px;width:138px;height:138px;pointer-events:none;transform:rotate(-13deg);opacity:0.80;" viewBox="0 0 148 148" xmlns="http://www.w3.org/2000/svg">
      <defs><path id="cTop" d="M74,74 m-52,0 a52,52 0 1,1 104,0"/><path id="cBot" d="M74,74 m-52,0 a52,52 0 0,0 104,0"/></defs>
      <g transform="translate(74,74)">
        <circle r="70" fill="none" stroke="#4338ca" stroke-width="2.5"/>
        <circle id="tooth" cx="0" cy="-70" r="6" fill="none" stroke="#4338ca" stroke-width="2"/>
        <use href="#tooth" transform="rotate(15)"/><use href="#tooth" transform="rotate(30)"/><use href="#tooth" transform="rotate(45)"/><use href="#tooth" transform="rotate(60)"/>
        <use href="#tooth" transform="rotate(75)"/><use href="#tooth" transform="rotate(90)"/><use href="#tooth" transform="rotate(105)"/><use href="#tooth" transform="rotate(120)"/>
        <use href="#tooth" transform="rotate(135)"/><use href="#tooth" transform="rotate(150)"/><use href="#tooth" transform="rotate(165)"/><use href="#tooth" transform="rotate(180)"/>
        <use href="#tooth" transform="rotate(195)"/><use href="#tooth" transform="rotate(210)"/><use href="#tooth" transform="rotate(225)"/><use href="#tooth" transform="rotate(240)"/>
        <use href="#tooth" transform="rotate(255)"/><use href="#tooth" transform="rotate(270)"/><use href="#tooth" transform="rotate(285)"/><use href="#tooth" transform="rotate(300)"/>
        <use href="#tooth" transform="rotate(315)"/><use href="#tooth" transform="rotate(330)"/><use href="#tooth" transform="rotate(345)"/>
        <circle r="62" fill="none" stroke="#4338ca" stroke-width="1.5"/>
        <circle r="56" fill="none" stroke="#4338ca" stroke-width="0.8"/>
      </g>
      <text font-family="Inter,Arial,sans-serif" font-size="8.5" font-weight="800" fill="#4338ca" letter-spacing="2" text-anchor="middle"><textPath href="#cTop" startOffset="50%">★ APPROVED ★ LINGOLIVE ★</textPath></text>
      <text font-family="Inter,Arial,sans-serif" font-size="8" font-weight="700" fill="#4338ca" letter-spacing="2" text-anchor="middle"><textPath href="#cBot" startOffset="50%">★ CERTIFIED OFFICIAL ★</textPath></text>
      <text x="74" y="68" font-family="Inter,Arial Black,sans-serif" font-size="19" font-weight="900" fill="#4338ca" text-anchor="middle" letter-spacing="1.5">APPROVED</text>
      <text x="74" y="87" font-family="Inter,Arial Black,sans-serif" font-size="19" font-weight="900" fill="#4338ca" text-anchor="middle" letter-spacing="1.5">APPROVED</text>
      <text x="74" y="106" font-family="Arial" font-size="10" fill="#6366f1" text-anchor="middle" letter-spacing="5">★ ★ ★</text>
    </svg>
  </div>
  <div class="cert-footer"></div>
  <div class="cert-footer-content">
    <div class="cert-sig"><span class="cert-sig-val" id="txt-director">Director LingoLive</span><div class="cert-sig-line"></div><span class="cert-sig-role" id="txt-academic">Academic Director</span></div>
    <div class="cert-code"><span class="cert-code-label" id="txt-vcode">Verification Code</span><span class="cert-code-val">${code.replace(/</g, "&lt;")}</span></div>
    <div class="cert-sig" style="min-width:110px"><span class="cert-date-val">${dateStr}</span><div class="cert-sig-line"></div><span class="cert-date-label" id="txt-issued">Date of Issue</span></div>
  </div>
</div>
<script>
const T={en:{proudly:'Proudly Awarded To',cert:'Certificate',completion:'of Course Completion',awarded:'This Certificate is Awarded to',body:'for the successful completion of the <strong>LingoLive</strong> language learning programme.<br>This certificate attests to the dedication, commitment and linguistic competence acquired.',director:'Director LingoLive',academic:'Academic Director',vcode:'Verification Code',issued:'Date of Issue'},pt:{proudly:'Orgulhosamente Atribuído a',cert:'Certificado',completion:'de Conclusão de Curso',awarded:'Este Certificado é Atribuído a',body:'pela conclusão com distinção do programa de aprendizagem de línguas <strong>LingoLive</strong>.<br>Este certificado atesta a dedicação, o empenho e a competência linguística adquirida.',director:'Director LingoLive',academic:'Diretor Académico',vcode:'Código de Verificação',issued:'Data de Emissão'},es:{proudly:'Orgullosamente Otorgado a',cert:'Certificado',completion:'de Finalización de Curso',awarded:'Este Certificado es Otorgado a',body:'por la exitosa finalización del programa de aprendizaje de idiomas <strong>LingoLive</strong>.<br>Este certificado acredita la dedicación, el compromiso y la competencia lingüística adquirida.',director:'Director LingoLive',academic:'Director Académico',vcode:'Código de Verificación',issued:'Fecha de Emisión'},fr:{proudly:'Fièrement Décerné À',cert:'Certificat',completion:'de Fin de Formation',awarded:'Ce Certificat est Décerné À',body:"pour avoir complété avec succès le programme d'apprentissage des langues <strong>LingoLive</strong>.<br>Ce certificat atteste du dévouement, de l'engagement et des compétences linguistiques acquises.",director:'Directeur LingoLive',academic:'Directeur Académique',vcode:'Code de Vérification',issued:"Date d'Émission"},de:{proudly:'Mit Stolz Verliehen An',cert:'Zertifikat',completion:'über Kursabschluss',awarded:'Dieses Zertifikat wird Verliehen An',body:'für den erfolgreichen Abschluss des <strong>LingoLive</strong>-Sprachlernprogramms.<br>Dieses Zertifikat bestätigt Engagement, Einsatz und erworbene Sprachkompetenz.',director:'Direktor LingoLive',academic:'Akademischer Direktor',vcode:'Verifizierungscode',issued:'Ausstellungsdatum'}};
function setLang(l){const t=T[l];if(!t)return;document.querySelectorAll('.lang-btn').forEach(b=>b.classList.remove('active'));document.querySelector('.lang-btn[onclick="setLang(\\''+l+'\\')"]').classList.add('active');['proudly','cert','completion','awarded','director','academic','vcode','issued'].forEach(k=>{const el=document.getElementById('txt-'+k);if(el)el.textContent=t[k]});const b=document.getElementById('txt-body');if(b)b.innerHTML=t.body;}
</script>
</body>
</html>`;
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
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
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

    {activeTab === "history" && <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-5"><div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar aluno, exame ou código" className="w-full bg-transparent py-2.5 text-sm outline-none" /></div>{loading ? <p className="py-10 text-center text-sm text-slate-400">Consultando registros persistidos…</p> : filtered.length === 0 ? <p className="py-10 text-center text-sm text-slate-400">Nenhum certificado real encontrado.</p> : <div className="space-y-3">{filtered.map((cert) => <article key={cert.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 p-4 lg:flex-row lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{cert.examTitle}</h3><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cert.status === "revoked" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{cert.status === "revoked" ? "Revogado" : "Válido"}</span></div><p className="text-sm text-slate-600">{cert.studentName} · {cert.language} · {cert.scorePercent}%</p><p className="mt-1 font-mono text-xs text-slate-400">{cert.verificationCode} · {new Date(cert.issueDate).toLocaleDateString()}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setPreviewCert(cert)} className="flex items-center gap-1 rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700"><Eye className="h-3.5 w-3.5" />Preview</button>{cert.documentStatus === "ready" && cert.documentUrl ? <a href={cert.documentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700"><Download className="h-3.5 w-3.5" />PDF oficial</a> : <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Documento pendente</span>}{admin && cert.status !== "revoked" && <button onClick={() => void revoke(cert)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Revogar</button>}</div></article>)}</div>}</section>}
    {activeTab === "verify" && <section className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="mb-1 text-lg font-bold">Verificação persistida</h2><p className="mb-4 text-sm text-slate-500">A consulta usa o código gravado no backend e registra o resultado na auditoria.</p><form onSubmit={verify} className="flex flex-col gap-2 sm:flex-row"><input value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="Ex.: LL-VAL-ABC123" className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" /><button className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white">Verificar</button></form>{verificationError && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"><XCircle className="h-5 w-5" />{verificationError}</div>}{verificationResult && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center gap-2 font-bold text-emerald-800"><CheckCircle className="h-5 w-5" />Registro encontrado</div><p className="mt-2 text-sm text-emerald-900">{verificationResult.studentName} — {verificationResult.examTitle}</p><p className="text-xs text-emerald-700">Estado: {verificationResult.status === "revoked" ? "revogado" : "válido"}</p></div>}</section>}
    {activeTab === "audit" && <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">Eventos reais de auditoria</h2>{auditEvents.length === 0 ? <p className="py-10 text-center text-sm text-slate-400">Nenhum evento persistido.</p> : <div className="space-y-2">{auditEvents.map((event) => <div key={event.id} className="rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-300"><div className="flex flex-wrap justify-between gap-2"><strong className="text-indigo-300">{event.action}</strong><span>{new Date(event.createdAt).toLocaleString()}</span></div><p className="mt-2">Certificado: {event.certificateId || "não localizado"}</p><p>Resultado: {event.result} · Operador: {event.actorId}</p></div>)}</div>}</section>}
    {activeTab === "analytics" && <section className="grid gap-5 lg:grid-cols-3"><div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><span className="text-xs font-semibold uppercase text-slate-400">Pontuação média real</span><strong className="mt-2 block text-3xl text-indigo-600">{metrics.averageScorePercent === null ? "—" : `${metrics.averageScorePercent}%`}</strong></div><div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2"><h2 className="mb-4 font-bold">Emissões por mês</h2>{metrics.emissionsByMonth.length === 0 ? <p className="py-20 text-center text-sm text-slate-400">Sem emissões persistidas para representar.</p> : <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={metrics.emissionsByMonth}><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Area type="monotone" dataKey="count" stroke="#4f46e5" fill="#c7d2fe" /></AreaChart></ResponsiveContainer></div>}</div></section>}

    {previewCert && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "16px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setPreviewCert(null)} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-lg">
            <X className="h-4 w-4" />Fechar
          </button>
        </div>
        <iframe srcDoc={buildCertHTML(previewCert)} style={{ width: "100%", maxWidth: 1000, height: 740, border: "none", borderRadius: 4 }} title="Certificate Preview" />
      </div>
    )}
  </div>;
};
