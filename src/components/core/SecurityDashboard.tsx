import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Lock, 
  RefreshCw, 
  AlertTriangle, 
  Activity, 
  Terminal, 
  FileText, 
  Cpu, 
  UserX, 
  CheckCircle, 
  Check, 
  UserCheck, 
  Clock, 
  Eye, 
  Smartphone, 
  TrendingUp,
  Sliders,
  Globe,
  Settings,
  Heart,
  UserMinus,
  ShieldCheck
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, addDoc, getDocs, limit, query, orderBy } from 'firebase/firestore';
import { auditLogger, AuditActionType, AuditSeverity } from '../../services/compliance/AuditLogger';
import { hipaaCompliance, StudentPHIMetadata } from '../../services/compliance/HIPAACompliance';
import { dataGovernanceAudit, DataSensitivity, GovernanceAuditRecord } from '../../services/compliance/DataGovernanceAudit';
import { Database, Search, FileSignature } from 'lucide-react';

interface SecurityLog {
  id?: string;
  timestamp: string;
  action: string;
  userEmail: string;
  ipAddress: string;
  location: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
}

export default function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'rbac' | 'secrets' | 'threats' | 'compliance'>('overview');
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // Zero Trust and Risk Engine state
  const [zeroTrustEnabled, setZeroTrustEnabled] = useState(true);
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState('187.45.10.*, 200.120.*.*');
  const [maxSessions, setMaxSessions] = useState(3);
  const [anomalyDetectionEnabled, setAnomalyDetectionEnabled] = useState(true);
  
  // Key rotation simulation state
  const [keys, setKeys] = useState([
    { name: 'GEMINI_API_KEY', status: 'ACTIVE', lastRotated: '2026-06-15', provider: 'GCP Secret Manager' },
    { name: 'STRIPE_SECRET_KEY', status: 'ACTIVE', lastRotated: '2026-05-20', provider: 'GCP Secret Manager' },
    { name: 'FIREBASE_ADMIN_CREDENTIALS', status: 'ACTIVE', lastRotated: '2026-04-12', provider: 'GCP Secret Manager' },
    { name: 'JWT_SIGNING_SECRET', status: 'ACTIVE', lastRotated: '2026-07-01', provider: 'GCP KMS' }
  ]);
  const [isRotating, setIsRotating] = useState<string | null>(null);

  // ABAC Rules state
  const [abacRules, setAbacRules] = useState([
    { attribute: 'userType', value: 'Educator', resource: 'Classroom', action: 'CREATE', condition: 'Only within scheduled school hours (07:00 - 18:00)', enabled: true },
    { attribute: 'age', value: '< 13', resource: 'VoiceRecording', action: 'UPLOAD', condition: 'Requires verified parental consent (VPC) hash active', enabled: true },
    { attribute: 'ipRange', value: 'In-School', resource: 'ExamAnswers', action: 'EDIT', condition: 'Allowed only when school IP is matching class geolocation', enabled: true },
    { attribute: 'deviceTrust', value: 'Trusted', resource: 'AdminPanel', action: 'ACCESS', condition: 'Device must have security certificate validation', enabled: true }
  ]);

  // Simulated live threats
  const [threats, setThreats] = useState([
    { id: '1', type: 'Brute Force Attempt', source: '45.138.99.12', target: 'Auth /login', severity: 'HIGH', status: 'BLOCKED', time: 'Há 5 min' },
    { id: '2', type: 'SQL Injection Blocked', source: '190.44.20.104', target: 'School Registration', severity: 'CRITICAL', status: 'BLOCKED', time: 'Há 15 min' },
    { id: '3', type: 'BOLA Access Attempt', source: '88.22.109.1', target: '/api/classes/class_9238', severity: 'MEDIUM', status: 'BLOCKED', time: 'Há 45 min' }
  ]);

  // HIPAA Diagnostics state
  const [hipaaStudentId, setHipaaStudentId] = useState('stu_5521');
  const [hipaaStudentName, setHipaaStudentName] = useState('Lucas Oliveira');
  const [hipaaDob, setHipaaDob] = useState('2015-08-23');
  const [hipaaConditions, setHipaaConditions] = useState('TDAH leve, Dislexia, Gaguez de desenvolvimento');
  const [hipaaNotes, setHipaaNotes] = useState('Apresenta dificuldade na pronúncia de fonemas fricativos como /s/ e /z/. Recomendado áudio-treino lento.');
  const [hipaaCodes, setHipaaCodes] = useState('F80.0, R47.01');
  const [hipaaAssessor, setHipaaAssessor] = useState('Dr. Helena Vasconcelos (Terapeuta da Fala)');
  const [hipaaSimRole, setHipaaSimRole] = useState('therapist');
  const [hipaaSimEmail, setHipaaSimEmail] = useState('analista.clinico@lingolive.ai');
  
  const [hipaaResult, setHipaaResult] = useState<{
    original: any;
    authorized: boolean;
    authReason?: string;
    deIdentifiedPayload: any;
    firestoreEntry: any;
  } | null>(null);
  const [hipaaLogging, setHipaaLogging] = useState(false);

  // Data Governance GDPR & LGPD states
  const [govLogs, setGovLogs] = useState<GovernanceAuditRecord[]>([]);
  const [govLoading, setGovLoading] = useState(false);
  const [simulatedGovCollection, setSimulatedGovCollection] = useState('student_phi');
  const [simulatedGovOperation, setSimulatedGovOperation] = useState<'READ' | 'WRITE' | 'UPDATE' | 'DELETE'>('READ');
  const [simulatedGovDocId, setSimulatedGovDocId] = useState('phi_928381');
  const [simulatedSubjectEmail, setSimulatedSubjectEmail] = useState('aluno.lucas@escola.pt');
  const [simulatedSubjectId, setSimulatedSubjectId] = useState('stu_9321');
  const [dsarStudentId, setDsarStudentId] = useState('stu_9321');
  const [dsarResult, setDsarResult] = useState<any | null>(null);
  const [erasureStudentId, setErasureStudentId] = useState('stu_4432');
  const [erasureStudentEmail, setErasureStudentEmail] = useState('lucas.erased@escola.pt');
  const [erasureResult, setErasureResult] = useState<any | null>(null);
  const [govLogMessage, setGovLogMessage] = useState('');

  const loadGovLogs = async () => {
    setGovLoading(true);
    try {
      const logs = await dataGovernanceAudit.fetchGovernanceLogs();
      setGovLogs(logs);
    } catch (e) {
      console.error('Error loading governance logs:', e);
    } finally {
      setGovLoading(false);
    }
  };

  const handleSimulateDataAccess = async () => {
    setGovLoading(true);
    try {
      const logId = await dataGovernanceAudit.logDataAccess({
        operation: simulatedGovOperation,
        collectionName: simulatedGovCollection,
        documentId: simulatedGovDocId,
        dataSubject: {
          uid: simulatedSubjectId,
          email: simulatedSubjectEmail,
          role: 'student'
        }
      });
      setGovLogMessage(`Sucesso! Registo de governança gravado (ID: ${logId})`);
      await loadGovLogs();
      setTimeout(() => setGovLogMessage(''), 5000);
    } catch (e) {
      console.error(e);
      setGovLogMessage('Erro ao simular acesso de dados.');
    } finally {
      setGovLoading(false);
    }
  };

  const handleGenerateDSAR = async () => {
    try {
      const result = await dataGovernanceAudit.generateDSARReport(dsarStudentId);
      setDsarResult(result);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExecuteErasure = async () => {
    try {
      const result = await dataGovernanceAudit.executeErasureAudit(erasureStudentId, erasureStudentEmail);
      setErasureResult(result);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunHipaaSafeguard = async () => {
    setHipaaLogging(true);
    try {
      const studentPHI: StudentPHIMetadata = {
        studentId: hipaaStudentId,
        studentName: hipaaStudentName,
        dateOfBirth: hipaaDob,
        medicalConditions: hipaaConditions.split(',').map(s => s.trim()).filter(Boolean),
        speechTherapyNotes: hipaaNotes,
        accommodationsNeeded: ['Tempo estendido em quizzes', 'Apoio de sintetizador de fala'],
        diagnosesCodes: hipaaCodes.split(',').map(s => s.trim()).filter(Boolean),
        clinicalAssessor: hipaaAssessor
      };

      // 1. Attribute-based verification check
      const authResult = hipaaCompliance.verifyPHIAccess({
        email: hipaaSimEmail,
        role: hipaaSimRole
      });

      // 2. Safe harbor de-identification
      const deIdentified = hipaaCompliance.deIdentifyPHI(studentPHI);

      // 3. Centralized Firestore logging payload simulation / actual logging
      const status = authResult.authorized ? 'SUCCESS' : 'FAILURE';
      const severity = authResult.authorized ? AuditSeverity.MEDIUM : AuditSeverity.HIGH;
      const description = `Operação de PHI: Diagnóstico HIPAA [Ator: ${hipaaSimEmail}] [Role: ${hipaaSimRole}]`;
      
      const logId = await auditLogger.log({
        action: AuditActionType.SENSITIVE_READ,
        description: `${description} [Acesso: ${status}] [DeIdentificado: ${deIdentified.deIdentified}]`,
        resource: {
          type: 'student_phi',
          id: deIdentified.hashId
        },
        severity,
        status,
        failureReason: authResult.authorized ? undefined : authResult.reason,
        payloadSnippet: authResult.authorized ? deIdentified : { blocked: true, reason: authResult.reason },
        isoControls: ['A.9.4.1', 'A.18.1.3', 'HIPAA_164.312', 'HIPAA_164.514']
      });

      setHipaaResult({
        original: studentPHI,
        authorized: authResult.authorized,
        authReason: authResult.reason,
        deIdentifiedPayload: deIdentified,
        firestoreEntry: {
          logId: logId || 'local_simulation_success',
          adminEmail: hipaaSimEmail,
          action: `SENSITIVE_READ: ${description} [Status: ${status}]`,
          timestamp: new Date().toISOString(),
          compliance: {
            actor: { uid: 'simulated_uid', email: hipaaSimEmail, role: hipaaSimRole },
            action: AuditActionType.SENSITIVE_READ,
            severity,
            status,
            payloadSnippet: authResult.authorized ? deIdentified : { blocked: true, reason: authResult.reason },
            metadata: { isoControls: ['A.9.4.1', 'A.18.1.3', 'HIPAA_164.312', 'HIPAA_164.514'] }
          }
        }
      });

      // Reload standard logs
      await loadLogs();
    } catch (err) {
      console.error('Error running HIPAA safeguard simulation:', err);
    } finally {
      setHipaaLogging(false);
    }
  };

  // Load logs from firestore and add default simulation if none exist
  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const q = query(collection(db, 'security_logs'), orderBy('timestamp', 'desc'), limit(15));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SecurityLog));
      
      if (list.length === 0) {
        // Seed some demo logs to Firestore for real-time visualization
        const demoLogs: SecurityLog[] = [
          { timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), action: 'KEY_ROTATION', userEmail: 'system@lingolive.ai', ipAddress: '127.0.0.1', location: 'Server-Side Task', riskLevel: 'LOW', details: 'Rotated JWT_SIGNING_SECRET successfully' },
          { timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), action: 'ABUSE_PREVENTION', userEmail: 'anonymous', ipAddress: '190.44.20.104', location: 'Santiago, CL', riskLevel: 'CRITICAL', details: 'WAF Blocked SQL Injection attack vector in school registration parameters' },
          { timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(), action: 'ACCESS_DENIED', userEmail: 'hacker@malicious.com', ipAddress: '45.138.99.12', location: 'St. Petersburg, RU', riskLevel: 'HIGH', details: 'Zero-Trust Policy Blocked: Unauthorized access attempt to Admin API endpoints' },
          { timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(), action: 'VPC_VERIFIED', userEmail: 'parent@gmail.com', ipAddress: '187.45.10.20', location: 'Lisboa, PT', riskLevel: 'LOW', details: 'Verifiable Parental Consent (VPC) completed successfully for Student (ID: stu_884)' }
        ];

        for (const log of demoLogs) {
          await addDoc(collection(db, 'security_logs'), log);
        }
        setSecurityLogs(demoLogs);
      } else {
        setSecurityLogs(list);
      }
    } catch (err) {
      console.error('Error fetching security logs:', err);
      // Fallback
      setSecurityLogs([
        { timestamp: new Date().toISOString(), action: 'OFFLINE_FALLBACK', userEmail: 'system@lingolive.ai', ipAddress: '127.0.0.1', location: 'Local Cache', riskLevel: 'LOW', details: 'Loaded offline security logs from internal client state.' }
      ]);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
    loadGovLogs();
  }, []);

  const triggerKeyRotation = async (keyName: string) => {
    setIsRotating(keyName);
    try {
      // Simulate KMS action and wait
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update key rotated timestamp
      setKeys(prev => prev.map(k => k.name === keyName ? { ...k, lastRotated: new Date().toISOString().split('T')[0] } : k));
      
      // Add secure audit log to Firestore
      const newLog: SecurityLog = {
        timestamp: new Date().toISOString(),
        action: 'KEY_ROTATION',
        userEmail: 'admin@lingolive.ai',
        ipAddress: '187.45.10.55',
        location: 'Porto, PT',
        riskLevel: 'LOW',
        details: `Chave criptográfica '${keyName}' rotacionada manualmente via GCP Secrets Manager KMS.`
      };
      await addDoc(collection(db, 'security_logs'), newLog);
      await loadLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRotating(null);
    }
  };

  const handleToggleZeroTrust = async () => {
    const nextVal = !zeroTrustEnabled;
    setZeroTrustEnabled(nextVal);
    
    const newLog: SecurityLog = {
      timestamp: new Date().toISOString(),
      action: 'ZERO_TRUST_CONFIG',
      userEmail: 'admin@lingolive.ai',
      ipAddress: '187.45.10.55',
      location: 'Porto, PT',
      riskLevel: 'MEDIUM',
      details: `Estratégia Zero Trust global ${nextVal ? 'Ativada' : 'Desativada'}. Configuração de Context-Aware Access sincronizada.`
    };
    await addDoc(collection(db, 'security_logs'), newLog);
    await loadLogs();
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 flex-wrap gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-rose-600 to-rose-500 rounded-2xl shadow-lg shadow-rose-900/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Security Center</h2>
            <p className="text-xs text-rose-400 font-mono font-medium">LingoLIVE Cybersecurity Audit, Access Control & Privacy Framework</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono font-extrabold text-emerald-400 uppercase tracking-widest bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
            Zero-Trust Ativo
          </span>
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Score de Ameaças</p>
            <p className="text-xl font-extrabold text-white">02 / 100</p>
            <p className="text-[10px] text-emerald-400 font-medium">Nível Crítico Estável</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Autenticação MFA</p>
            <p className="text-xl font-extrabold text-white">Obrigatório</p>
            <p className="text-[10px] text-indigo-400 font-medium">100% de usuários admin</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Dispositivos Confiáveis</p>
            <p className="text-xl font-extrabold text-white">99.2%</p>
            <p className="text-[10px] text-yellow-400 font-medium">Certificação DeviceTrust</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Ataques Bloqueados</p>
            <p className="text-xl font-extrabold text-white">2,840</p>
            <p className="text-[10px] text-emerald-400 font-medium">WAF mitigando 24/7</p>
          </div>
        </div>
      </div>

      {/* Internal Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto relative z-10 scrollbar-none">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'overview' 
              ? 'border-rose-500 text-rose-400 bg-rose-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Monitoramento Global</span>
        </button>
        <button 
          onClick={() => setActiveTab('rbac')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'rbac' 
              ? 'border-rose-500 text-rose-400 bg-rose-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Controle RBAC & ABAC</span>
        </button>
        <button 
          onClick={() => setActiveTab('secrets')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'secrets' 
              ? 'border-rose-500 text-rose-400 bg-rose-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Secrets KMS & Rotação</span>
        </button>
        <button 
          onClick={() => setActiveTab('threats')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'threats' 
              ? 'border-rose-500 text-rose-400 bg-rose-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>WAF & Detecção de Ameaças</span>
        </button>
        <button 
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 tracking-wide uppercase transition-all cursor-pointer ${
            activeTab === 'compliance' 
              ? 'border-rose-500 text-rose-400 bg-rose-500/5' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Conformidade (COPPA / GDPR)</span>
        </button>
      </div>

      {/* Tab: Overview (Zero Trust, Risk Engine & Realtime Audit Logs) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Settings Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <Sliders className="w-4 h-4 text-rose-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Zero-Trust Policies</h4>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Acesso Contextual</p>
                    <p className="text-[10px] text-slate-500">Restringe por IP e Geo-regras</p>
                  </div>
                  <button 
                    onClick={handleToggleZeroTrust}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${zeroTrustEnabled ? 'bg-rose-500' : 'bg-slate-800'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${zeroTrustEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">MFA Mandatório</p>
                    <p className="text-[10px] text-slate-500">Obrigar segundo fator p/ Staff</p>
                  </div>
                  <button 
                    onClick={() => setMfaEnforced(!mfaEnforced)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${mfaEnforced ? 'bg-rose-500' : 'bg-slate-800'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${mfaEnforced ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Motor de Anomalias</p>
                    <p className="text-[10px] text-slate-500">Bloquear IPs abusivos auto</p>
                  </div>
                  <button 
                    onClick={() => setAnomalyDetectionEnabled(!anomalyDetectionEnabled)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${anomalyDetectionEnabled ? 'bg-rose-500' : 'bg-slate-800'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${anomalyDetectionEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">IP Whitelists Admins</label>
                  <input 
                    type="text" 
                    value={ipWhitelist}
                    onChange={(e) => setIpWhitelist(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono py-1.5 px-3 text-slate-200 focus:outline-none focus:border-rose-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Sessões Máximas Simultâneas</label>
                  <select 
                    value={maxSessions} 
                    onChange={(e) => setMaxSessions(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs py-1.5 px-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value={1}>1 Sessão (Estrita)</option>
                    <option value={3}>3 Sessões (Recomendado)</option>
                    <option value={5}>5 Sessões (Flexível)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Realtime Logs Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Logs de Auditoria Forense</h4>
                </div>
                <button 
                  onClick={loadLogs} 
                  disabled={loadingLogs}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Atualizar Logs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {loadingLogs ? (
                  <div className="text-center py-10 text-slate-500 text-xs font-mono">
                    Carregando trilha de auditoria do Firestore...
                  </div>
                ) : securityLogs.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs font-mono">
                    Nenhum log registrado.
                  </div>
                ) : (
                  securityLogs.map((log) => (
                    <div key={log.id || log.timestamp} className="p-3 bg-slate-900 rounded-xl border border-slate-800/60 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border ${
                            log.riskLevel === 'CRITICAL' 
                              ? 'bg-rose-950 text-rose-400 border-rose-900' 
                              : log.riskLevel === 'HIGH'
                              ? 'bg-orange-950 text-orange-400 border-orange-900'
                              : log.riskLevel === 'MEDIUM'
                              ? 'bg-yellow-950 text-yellow-400 border-yellow-900'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                        <p className="font-bold text-slate-200">{log.details}</p>
                        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                          <span>Email: <b className="text-slate-400">{log.userEmail}</b></span>
                          <span>IP: <b className="text-slate-400">{log.ipAddress}</b></span>
                          <span>Origem: <b className="text-slate-400">{log.location}</b></span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: RBAC / ABAC Policies */}
      {activeTab === 'rbac' && (
        <div className="space-y-6 relative z-10">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-500" />
                Matriz de Controle de Acessos Dinâmicos (ABAC)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Políticas baseadas em atributos dão maior granularidade ao RBAC tradicional, barrando violações de BOLA/BFLA com verificações em tempo real de metadados do utilizador.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-extrabold uppercase tracking-widest text-[9px]">
                    <th className="py-2.5 px-3">Atributo Alvo</th>
                    <th className="py-2.5 px-3">Valor de Entrada</th>
                    <th className="py-2.5 px-3">Recurso</th>
                    <th className="py-2.5 px-3">Ação Protegida</th>
                    <th className="py-2.5 px-3">Condição Adicional de Segurança</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono text-slate-300">
                  {abacRules.map((rule, idx) => (
                    <tr key={idx} className="hover:bg-slate-900 transition-colors">
                      <td className="py-3 px-3 text-rose-400 font-bold">{rule.attribute}</td>
                      <td className="py-3 px-3"><span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-200">{rule.value}</span></td>
                      <td className="py-3 px-3 font-bold text-white">{rule.resource}</td>
                      <td className="py-3 px-3"><span className="text-indigo-400 font-extrabold">{rule.action}</span></td>
                      <td className="py-3 px-3 text-slate-400 font-sans">{rule.condition}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="bg-emerald-950 border border-emerald-900 text-emerald-400 text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                          Habilitado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Secrets Manager & Key Rotation */}
      {activeTab === 'secrets' && (
        <div className="space-y-6 relative z-10">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-rose-500" />
                  GCP Secret Manager & KMS Key Rotation
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Chaves criptográficas e variáveis de ambiente confidenciais integradas de maneira segura. Simule ou execute rotação criptográfica imediata de ponta a ponta.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {keys.map((k) => (
                <div key={k.name} className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-white font-mono">{k.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">Fornecedor: {k.provider}</p>
                    </div>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                      {k.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                    <span className="text-[10px] font-mono text-slate-400">Última Rotação: <b>{k.lastRotated}</b></span>
                    <button
                      onClick={() => triggerKeyRotation(k.name)}
                      disabled={isRotating !== null}
                      className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-[10px] tracking-wide uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRotating === k.name ? 'animate-spin' : ''}`} />
                      <span>{isRotating === k.name ? 'Rotacionando...' : 'Rotacionar KMS'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Threats & WAF */}
      {activeTab === 'threats' && (
        <div className="space-y-6 relative z-10">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-500" />
                Defesa ativa do WAF & Detecção de Ameaças (Threat Prevention)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Varredura dinâmica de requisições de rede. Tentativas de injeção SQL, Brute Force e ataques do tipo BOLA são analisadas pelo motor heurístico e bloqueados na camada CDN.
              </p>
            </div>

            <div className="space-y-3">
              {threats.map((t) => (
                <div key={t.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800/80 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-950 border border-rose-900 rounded-lg text-rose-500">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white font-mono">{t.type}</p>
                      <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono mt-1">
                        <span>IP de Origem: <b className="text-slate-400">{t.source}</b></span>
                        <span>Endpoint Alvo: <b className="text-indigo-400">{t.target}</b></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-500">{t.time}</span>
                    <span className="bg-rose-950/40 text-rose-400 border border-rose-900/40 text-[9px] px-2.5 py-0.5 rounded font-extrabold uppercase">
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Compliance & Parental Consent */}
      {activeTab === 'compliance' && (
        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Matriz de Conformidade LingoLIVE
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Auditoria atualizada de acordo com leis globais de proteção.</p>
              </div>

              <div className="space-y-3 font-sans">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/60">
                  <div className="p-1 bg-emerald-950 border border-emerald-900 text-emerald-400 rounded-md mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">COPPA Compliance (Menores de 13 anos)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Consentimento parental verificável (VPC) habilitado antes da gravação de logs ou áudios.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/60">
                  <div className="p-1 bg-emerald-950 border border-emerald-900 text-emerald-400 rounded-md mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">GDPR & LGPD (Direito ao Esquecimento)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Mapeamento de dados de utilizadores para eliminação física completa sob requisição legal.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/60">
                  <div className="p-1 bg-emerald-950 border border-emerald-900 text-emerald-400 rounded-md mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">ISO/IEC 27001 (Padrão de SGSI)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Trilhas de auditoria criptografadas e integridade do repositório monitoradas ativamente.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/60">
                  <div className="p-1 bg-emerald-950 border border-emerald-900 text-emerald-400 rounded-md mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">HIPAA Compliance (Proteção de PHI)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Salvaguardas técnicas (45 CFR § 164.312) aplicadas a metadados de saúde de estudantes. Desidentificação Safe Harbor obrigatória.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-rose-400" />
                  Consentimento Parental Verificado (VPC)
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Controle técnico estrito para salvaguardar a privacidade de crianças.</p>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800/80 space-y-3">
                <p className="text-xs text-slate-300">
                  A gravação de áudio em testes de pronúncia de menores é legalmente protegida. Nenhuma sessão de gravação é enviada à nuvem sem a verificação do e-mail do encarregado de educação (pai/mãe).
                </p>
                
                <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-[10px] font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between"><span>VPC Status:</span><span className="text-emerald-400 font-bold">100% COMPLIANT</span></div>
                  <div className="flex justify-between"><span>Total menor cadastrado:</span><span>45 alunos</span></div>
                  <div className="flex justify-between"><span>VPCs Pendentes:</span><span className="text-yellow-400">0</span></div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[10px] font-mono bg-slate-950 border border-slate-800/60 px-3 py-1.5 rounded-full text-slate-400">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Criptografia Ativa</span>
                  </div>
                  <span>SHA-256 VPC Hash</span>
                </div>
              </div>
            </div>
          </div>

          {/* HIPAA Technical Safeguards Diagnostic Section */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Simulador de Salvaguarda de Saúde HIPAA (45 CFR § 164.312)</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Teste o fluxo de autorização de atributos (ABAC) e desidentificação automática (Safe Harbor) de metadados PHI.</p>
                </div>
              </div>
              <span className="text-[9px] font-mono font-extrabold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                U.S. Healthcare Standard
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form inputs */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-rose-500" />
                    Entrada de Dados Clínicos (ePHI)
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">ID Estudante</label>
                      <input 
                        type="text" 
                        value={hipaaStudentId} 
                        onChange={(e) => setHipaaStudentId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-rose-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Nome Completo</label>
                      <input 
                        type="text" 
                        value={hipaaStudentName} 
                        onChange={(e) => setHipaaStudentName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Nascimento</label>
                      <input 
                        type="date" 
                        value={hipaaDob} 
                        onChange={(e) => setHipaaDob(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-rose-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">CID-10 / Diagnósticos</label>
                      <input 
                        type="text" 
                        value={hipaaCodes} 
                        onChange={(e) => setHipaaCodes(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-rose-500 font-mono"
                        placeholder="ex: F80.0, R47.01"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Necessidades / Condições de Saúde</label>
                    <input 
                      type="text" 
                      value={hipaaConditions} 
                      onChange={(e) => setHipaaConditions(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2.5 text-slate-300 focus:outline-none focus:border-rose-500"
                      placeholder="ex: Dislexia, fenda palatina"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Notas de Sessão de Fala (Speech Notes)</label>
                    <textarea 
                      rows={2}
                      value={hipaaNotes} 
                      onChange={(e) => setHipaaNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2.5 text-slate-300 focus:outline-none focus:border-rose-500 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Profissional de Saúde</label>
                    <input 
                      type="text" 
                      value={hipaaAssessor} 
                      onChange={(e) => setHipaaAssessor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2.5 text-slate-300 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Simulated actor credentials */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Atributos do Utilizador Requisitante (Ator)
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Simular Perfil / Role</label>
                      <select 
                        value={hipaaSimRole} 
                        onChange={(e) => setHipaaSimRole(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-rose-500"
                      >
                        <option value="admin">Administrador (admin)</option>
                        <option value="therapist">Terapeuta de Fala (therapist)</option>
                        <option value="special-educator">Educador Especial</option>
                        <option value="coordenador">Coordenador Pedagógico</option>
                        <option value="educator">Professor Comum (educator)</option>
                        <option value="student">Aluno / Estudante (student)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">E-mail do Ator</label>
                      <input 
                        type="email" 
                        value={hipaaSimEmail} 
                        onChange={(e) => setHipaaSimEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-rose-500 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleRunHipaaSafeguard}
                    disabled={hipaaLogging}
                    className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{hipaaLogging ? 'Validando Salvaguardas...' : 'Processar e Gravar no AuditLogger'}</span>
                  </button>
                </div>
              </div>

              {/* Outputs side-by-side or results */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                {!hipaaResult ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                    <Heart className="w-10 h-10 text-slate-700 mb-2 animate-pulse" />
                    <p className="text-xs font-bold text-slate-400">Pronto para Teste HIPAA</p>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Preencha os dados e clique no botão para visualizar em tempo real a validação de acesso e a ofuscação dos dados confidenciais (Safe Harbor).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Access Verification Alert */}
                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                      hipaaResult.authorized 
                        ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400' 
                        : 'bg-rose-950/40 border-rose-900/60 text-rose-400'
                    }`}>
                      {hipaaResult.authorized ? (
                        <ShieldCheck className="w-5 h-5 shrink-0" />
                      ) : (
                        <UserMinus className="w-5 h-5 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">
                          {hipaaResult.authorized ? 'Controle de Acesso Concedido' : 'Controle de Acesso Negado'} (45 CFR § 164.312)
                        </p>
                        <p className="text-[10px] opacity-90 mt-0.5 leading-relaxed">
                          {hipaaResult.authorized 
                            ? `O perfil '${hipaaSimRole}' é uma atribuição autorizada de saúde. Metadados ePHI foram processados com segurança.`
                            : `Acesso bloqueado: ${hipaaResult.authReason}`}
                        </p>
                      </div>
                    </div>

                    {/* Compare payloads */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Original ePHI */}
                      <div className="bg-rose-950/15 border border-rose-900/30 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-extrabold uppercase text-rose-400 tracking-wider bg-rose-950/50 px-2 py-0.5 rounded border border-rose-900/40">Dados Brutos (ePHI)</span>
                          <span className="text-[10px] font-mono text-rose-500 font-bold">EXPOSTO</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg text-[9px] font-mono text-slate-300 max-h-[140px] overflow-y-auto space-y-1">
                          <div><span className="text-rose-400">"studentId":</span> "{hipaaResult.original.studentId}"</div>
                          <div><span className="text-rose-400">"studentName":</span> "{hipaaResult.original.studentName}"</div>
                          <div><span className="text-rose-400">"dateOfBirth":</span> "{hipaaResult.original.dateOfBirth}"</div>
                          <div><span className="text-rose-400">"medicalConditions":</span> {JSON.stringify(hipaaResult.original.medicalConditions)}</div>
                          <div><span className="text-rose-400">"speechTherapyNotes":</span> "{hipaaResult.original.speechTherapyNotes.substring(0, 35)}..."</div>
                          <div><span className="text-rose-400">"diagnosesCodes":</span> {JSON.stringify(hipaaResult.original.diagnosesCodes)}</div>
                          <div><span className="text-rose-400">"clinicalAssessor":</span> "{hipaaResult.original.clinicalAssessor}"</div>
                        </div>
                      </div>

                      {/* De-identified PHI */}
                      <div className="bg-emerald-950/15 border border-emerald-900/30 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-extrabold uppercase text-emerald-400 tracking-wider bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/40">Ofuscado (Safe Harbor)</span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">DE-IDENTIFIED</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg text-[9px] font-mono text-slate-300 max-h-[140px] overflow-y-auto space-y-1">
                          <div><span className="text-emerald-400">"studentId":</span> <span className="text-amber-400">"{hipaaResult.deIdentifiedPayload.studentId}"</span></div>
                          <div><span className="text-emerald-400">"studentName":</span> <span className="text-slate-500">"{hipaaResult.deIdentifiedPayload.studentName}"</span></div>
                          <div><span className="text-emerald-400">"dateOfBirth":</span> <span className="text-slate-500">"{hipaaResult.deIdentifiedPayload.dateOfBirth}"</span></div>
                          <div><span className="text-emerald-400">"medicalConditions":</span> <span className="text-slate-500">{JSON.stringify(hipaaResult.deIdentifiedPayload.medicalConditions)}</span></div>
                          <div><span className="text-emerald-400">"speechTherapyNotes":</span> <span className="text-slate-500">"{hipaaResult.deIdentifiedPayload.speechTherapyNotes}"</span></div>
                          <div><span className="text-emerald-400">"diagnosesCodes":</span> <span className="text-slate-500">{JSON.stringify(hipaaResult.deIdentifiedPayload.diagnosesCodes)}</span></div>
                          <div><span className="text-emerald-400">"clinicalAssessor":</span> <span className="text-slate-500">"{hipaaResult.deIdentifiedPayload.clinicalAssessor}"</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Centralized Firestore audit trail payload entry */}
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 space-y-2 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-extrabold uppercase text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/40">AuditLogger Centralizado (Firestore)</span>
                        <span className="text-[9px] text-slate-500">Write-Once Compliant</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded text-[9.5px] text-indigo-300 max-h-[110px] overflow-y-auto leading-relaxed">
                        <div><span className="text-slate-500">// Registo ID: {hipaaResult.firestoreEntry.logId}</span></div>
                        <div><span className="text-indigo-400">"action":</span> "{hipaaResult.firestoreEntry.action}"</div>
                        <div><span className="text-indigo-400">"timestamp":</span> "{hipaaResult.firestoreEntry.timestamp}"</div>
                        <div><span className="text-indigo-400">"compliance":</span> &#123;</div>
                        <div className="pl-3"><span className="text-indigo-400">"actor":</span> {JSON.stringify(hipaaResult.firestoreEntry.compliance.actor)},</div>
                        <div className="pl-3"><span className="text-indigo-400">"status":</span> <span className={hipaaResult.authorized ? "text-emerald-400" : "text-rose-400"}>"{hipaaResult.firestoreEntry.compliance.status}"</span>,</div>
                        <div className="pl-3"><span className="text-indigo-400">"controls":</span> {JSON.stringify(hipaaResult.firestoreEntry.compliance.metadata.isoControls)}</div>
                        <div>&#125;</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* GDPR & LGPD Governance Dashboard Section */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Governança de Dados GDPR & LGPD (Art. 30 / Art. 37)</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Tratamento de dados pessoais em Firestore, rastreamento de leitura/escrita e controle de conformidade legal.</p>
                </div>
              </div>
              <span className="text-[9px] font-mono font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                EU GDPR & BR LGPD Standards
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Controls and Actions Column */}
              <div className="xl:col-span-5 space-y-6">
                
                {/* Simulator Form */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-indigo-400" />
                    Simular Operação de Dados (Tratamento)
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Operação</label>
                      <select 
                        value={simulatedGovOperation} 
                        onChange={(e: any) => setSimulatedGovOperation(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="READ">CONSULTA (READ)</option>
                        <option value="WRITE">CRIAÇÃO (WRITE)</option>
                        <option value="UPDATE">ALTERAÇÃO (UPDATE)</option>
                        <option value="DELETE">EXCLUSÃO (DELETE)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Tabela / Coleção</label>
                      <select 
                        value={simulatedGovCollection} 
                        onChange={(e) => setSimulatedGovCollection(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="users">users (Dados Gerais)</option>
                        <option value="student_phi">student_phi (Saúde HIPAA)</option>
                        <option value="speech_sessions">speech_sessions (Áudios IA)</option>
                        <option value="billing">billing (Faturamento/Assinatura)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Documento ID</label>
                      <input 
                        type="text" 
                        value={simulatedGovDocId} 
                        onChange={(e) => setSimulatedGovDocId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Estudante ID (Sujeito)</label>
                      <input 
                        type="text" 
                        value={simulatedSubjectId} 
                        onChange={(e) => setSimulatedSubjectId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Email do Sujeito de Dados</label>
                    <input 
                      type="email" 
                      value={simulatedSubjectEmail} 
                      onChange={(e) => setSimulatedSubjectEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2.5 text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <button
                    onClick={handleSimulateDataAccess}
                    disabled={govLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <Database className="w-4 h-4" />
                    <span>{govLoading ? 'Gravando Log de Governança...' : 'Executar e Gravar Registro (ROPA)'}</span>
                  </button>

                  {govLogMessage && (
                    <div className="text-[10px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 p-2 rounded-lg text-center font-mono">
                      {govLogMessage}
                    </div>
                  )}
                </div>

                {/* DSAR Right of Access Tool */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-indigo-400" />
                    Solicitação de Acesso (DSAR - GDPR Art. 15 / LGPD Art. 9)
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                    Compila todas as atividades de tratamento de dados, bases legais e categorias processadas relativas ao estudante solicitado.
                  </p>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={dsarStudentId} 
                      onChange={(e) => setDsarStudentId(e.target.value)}
                      placeholder="ID do Estudante"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-3 text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      onClick={handleGenerateDSAR}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-sans"
                    >
                      Compilar
                    </button>
                  </div>

                  {dsarResult && (
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-2 font-mono text-[9px]">
                      <div className="flex justify-between text-[10px] text-indigo-400 font-bold border-b border-slate-800 pb-1.5 mb-1.5">
                        <span>DSAR REPORT</span>
                        <span>{dsarResult.metadata.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Emitido em:</span>
                        <span className="text-slate-300">{new Date(dsarResult.metadata.generatedAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sujeito Alvo:</span>
                        <span className="text-slate-300 font-bold">{dsarResult.metadata.targetUser}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Requisitante:</span>
                        <span className="text-slate-300">{dsarResult.metadata.requestedBy}</span>
                      </div>
                      <div className="text-[10px] text-amber-400 font-bold mt-2 font-sans">Bases Legais Mapeadas:</div>
                      <ul className="list-disc pl-3.5 text-slate-400 space-y-0.5 font-sans">
                        {dsarResult.legalBasisCovered.map((basis: string, i: number) => (
                          <li key={i}>{basis}</li>
                        ))}
                      </ul>
                      <div className="text-[10px] text-emerald-400 font-bold mt-2 font-sans">Registros de Tratamento Encontrados: ({dsarResult.records.length})</div>
                      <div className="max-h-[100px] overflow-y-auto space-y-1 bg-slate-900/60 p-1.5 rounded border border-slate-800">
                        {dsarResult.records.map((rec: any, idx: number) => (
                          <div key={idx} className="border-b border-slate-800 pb-1 mb-1 last:border-none last:pb-0 last:mb-0 text-slate-300">
                            [{rec.operation}] /{rec.collectionName}/{rec.documentId} <br />
                            <span className="text-slate-500">Legal: {rec.legalBasis?.substring(0, 45)}...</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right to be Forgotten (GDPR Art. 17 / LGPD Art. 16) */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <FileSignature className="w-3.5 h-3.5 text-rose-500" />
                    Direito ao Esquecimento (Eliminação de Dados GDPR/LGPD)
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                    Executa a eliminação física irrevogável ou a anonimização estrita (Safe Harbor) de todos os registros de dados de identificação pessoal (PII).
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      value={erasureStudentId} 
                      onChange={(e) => setErasureStudentId(e.target.value)}
                      placeholder="ID Estudante"
                      className="bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-rose-500 font-mono"
                    />
                    <input 
                      type="email" 
                      value={erasureStudentEmail} 
                      onChange={(e) => setErasureStudentEmail(e.target.value)}
                      placeholder="Email do Estudante"
                      className="bg-slate-950 border border-slate-800 rounded-lg text-xs py-1.5 px-2 text-slate-300 focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  <button
                    onClick={handleExecuteErasure}
                    className="w-full bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 hover:border-rose-700/80 text-rose-300 font-bold text-xs py-2 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 font-sans"
                  >
                    <UserX className="w-4 h-4 text-rose-400" />
                    <span>Eliminar e Anonimizar Dados Pessoais</span>
                  </button>

                  {erasureResult && (
                    <div className="bg-rose-950/10 border border-rose-900/30 p-3 rounded-lg space-y-2 font-mono text-[9px] text-rose-300">
                      <div className="flex justify-between text-[10px] text-rose-400 font-bold border-b border-rose-900/30 pb-1.5 mb-1.5">
                        <span>CERTIFICADO DE EXCLUSÃO</span>
                        <span className="text-emerald-400 font-bold font-mono">REALIZADO</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recibo ID:</span>
                        <span className="text-slate-400">{erasureResult.trackingId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Timestamp:</span>
                        <span className="text-slate-400">{new Date(erasureResult.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-rose-400 font-bold mt-1 font-sans">Categorias Removidas:</div>
                      <div className="flex flex-wrap gap-1">
                        {erasureResult.erasedCategories.map((cat: string, i: number) => (
                          <span key={i} className="bg-rose-950 border border-rose-900 text-rose-300 text-[8px] px-1.5 py-0.5 rounded">{cat}</span>
                        ))}
                      </div>
                      <p className="text-[8px] text-slate-500 leading-normal mt-1 pt-1.5 border-t border-rose-900/20">
                        {erasureResult.regulatoryStatement}
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* ROPA Activity Log column */}
              <div className="xl:col-span-7 space-y-4">
                <div className="flex items-center justify-between font-sans">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Registo de Atividades de Tratamento (ROPA - GDPR Art. 30 / LGPD Art. 37)
                  </h4>
                  <button 
                    onClick={loadGovLogs}
                    disabled={govLoading}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${govLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="max-h-[620px] overflow-y-auto font-sans text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-800">
                          <th className="py-2.5 px-3">Timestamp / Ator</th>
                          <th className="py-2.5 px-3">Recurso / Sujeito</th>
                          <th className="py-2.5 px-3">Sensibilidade</th>
                          <th className="py-2.5 px-3">Artigos / Regulamentações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {govLogs.map((log) => {
                          const sens = log.sensitivity;
                          const sensBadge = 
                            sens === DataSensitivity.PHI 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : sens === DataSensitivity.SENSITIVE
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : sens === DataSensitivity.PERSONAL
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20';

                          return (
                            <tr key={log.id} className="hover:bg-slate-900/30 transition-all">
                              <td className="py-3 px-3">
                                <div className="text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                <div className="font-bold text-white mt-0.5">{log.actor.email?.split('@')[0]}</div>
                                <div className="text-[9px] text-indigo-400 font-mono">[{log.actor.role}]</div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-mono text-[10px] text-amber-400">
                                  {log.operation} <span className="text-slate-400">/{log.collectionName}/{log.documentId.substring(0,8)}...</span>
                                </div>
                                <div className="text-[10px] text-slate-300 mt-0.5">Sujeito: <span className="text-slate-400">{log.dataSubject.email}</span></div>
                                <div className="text-[9px] text-slate-500 italic mt-0.5 leading-relaxed">Motivo: {log.legalBasis}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`text-[8.5px] font-mono font-extrabold px-2 py-0.5 rounded-full ${sensBadge}`}>
                                  {log.sensitivity}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-[9.5px] space-y-1">
                                <div className="text-slate-400">
                                  <span className="text-[8px] font-extrabold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-900/40 px-1 py-0.2 rounded mr-1">GDPR</span> 
                                  {log.compliance?.gdprArticles.map((art: string) => art.split(' ')[0]).join(', ') || 'N/A'}
                                </div>
                                <div className="text-slate-400">
                                  <span className="text-[8px] font-extrabold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-900/40 px-1 py-0.2 rounded mr-1">LGPD</span> 
                                  {log.compliance?.lgpdArticles.map((art: string) => art.split(' ')[0]).join(', ') || 'N/A'}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {govLogs.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-500 text-[10px]">
                              Nenhum registro de governança de dados encontrado. Clique acima para simular tratamentos.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
