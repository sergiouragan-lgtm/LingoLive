import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  Plus,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  X,
} from "lucide-react";
import { auth } from "../../../firebase";

interface EbookAssignment {
  id: string;
  teacherId: string;
  ebookId: string;
  ebookTitle: string;
  title: string;
  description: string;
  dueDate: string | null;
  studentIds: string[];
  createdAt: string;
}

interface AssignmentProgress {
  studentId: string;
  completionPercent: number;
  status: "not_started" | "in_progress" | "completed";
  lastReadAt: string | null;
}

interface AssignmentWithProgress extends EbookAssignment {
  progress: AssignmentProgress[];
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
}

interface StudentAssignment {
  assignment: EbookAssignment;
  completionPercent: number;
  status: "not_started" | "in_progress" | "completed";
  overdue: boolean;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`/api/ebook/assignments${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function StatusPill({ status, overdue }: { status: string; overdue?: boolean }) {
  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
        <AlertTriangle className="w-3 h-3" /> Em atraso
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
        <CheckCircle className="w-3 h-3" /> Concluído
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
        <Clock className="w-3 h-3" /> Em progresso
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
      Não iniciado
    </span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${
          pct >= 100 ? "bg-green-500" : pct > 0 ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
        }`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

// ── Teacher view ───────────────────────────────────────────────────────────────

function CreateAssignmentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [ebookId, setEbookId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [studentIdsRaw, setStudentIdsRaw] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const studentIds = studentIdsRaw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ebookId || !title || studentIds.length === 0) {
      setError("ID do e-book, título e pelo menos um aluno são obrigatórios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/", {
        method: "POST",
        body: JSON.stringify({ ebookId, title, description, dueDate: dueDate || null, studentIds }),
      });
      onCreated();
      onClose();
    } catch {
      setError("Erro ao criar tarefa. Verifique os dados e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white">Nova Tarefa</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              ID do E-book
            </label>
            <input
              value={ebookId}
              onChange={(e) => setEbookId(e.target.value)}
              placeholder="ex: abc123"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Título da tarefa
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Leitura obrigatória — Semana 3"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Data limite (opcional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              IDs dos alunos (um por linha ou separados por vírgula)
            </label>
            <textarea
              value={studentIdsRaw}
              onChange={(e) => setStudentIdsRaw(e.target.value)}
              rows={3}
              placeholder={"uid_aluno_1\nuid_aluno_2"}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm font-mono bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "A criar..." : "Criar Tarefa"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AssignmentDetailPanel({
  assignmentId,
  onBack,
}: {
  assignmentId: string;
  onBack: () => void;
}) {
  const [data, setData] = useState<AssignmentWithProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AssignmentWithProgress>(`/${assignmentId}/progress`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [assignmentId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }
  if (!data) return <p className="text-sm text-gray-400">Tarefa não encontrada.</p>;

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
      >
        ← Voltar
      </button>

      <div>
        <h4 className="font-semibold text-gray-800 dark:text-white">{data.title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{data.ebookTitle}</p>
        {data.dueDate && (
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Prazo: {new Date(data.dueDate).toLocaleDateString("pt-PT")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
          <p className="text-lg font-bold text-green-700 dark:text-green-300">{data.completedCount}</p>
          <p className="text-xs text-green-600 dark:text-green-400">Concluídos</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{data.inProgressCount}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">Em progresso</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{data.notStartedCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Não iniciados</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {data.progress.map((p) => (
            <div key={p.studentId} className="px-4 py-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-gray-600 dark:text-gray-300 truncate max-w-[60%]">
                  {p.studentId.slice(0, 12)}…
                </p>
                <StatusPill status={p.status} />
              </div>
              <div className="flex items-center gap-2">
                <ProgressBar pct={p.completionPercent} />
                <span className="text-xs text-gray-400 tabular-nums flex-shrink-0 w-8 text-right">
                  {p.completionPercent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeacherView() {
  const [assignments, setAssignments] = useState<EbookAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ assignments: EbookAssignment[] }>("/teacher");
      setAssignments(data.assignments);
    } catch {
      setError("Erro ao carregar tarefas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (selectedId) {
    return <AssignmentDetailPanel assignmentId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-indigo-500" />
          As Minhas Tarefas
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && assignments.length === 0 && !error && (
        <div className="text-center py-10 text-gray-400 text-sm">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
          Ainda não criou nenhuma tarefa.
          <br />
          Clique em "Nova" para atribuir um e-book aos seus alunos.
        </div>
      )}

      {!loading && assignments.length > 0 && (
        <div className="space-y-3">
          {assignments.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-3 text-left hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-white text-sm truncate">{a.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{a.ebookTitle}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Users className="w-3 h-3" />
                    {a.studentIds.length}
                  </span>
                  {a.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(a.dueDate).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateAssignmentModal
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}

// ── Student view ───────────────────────────────────────────────────────────────

function StudentView({ onOpenEbook }: { onOpenEbook?: (ebookId: string) => void }) {
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ assignments: StudentAssignment[] }>("/student/me")
      .then((d) => setAssignments(d.assignments))
      .catch(() => setError("Erro ao carregar tarefas."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-indigo-500" />
        As Minhas Tarefas
      </h3>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && assignments.length === 0 && !error && (
        <div className="text-center py-10 text-gray-400 text-sm">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
          Não tem tarefas atribuídas de momento.
        </div>
      )}

      {!loading && assignments.length > 0 && (
        <div className="space-y-3">
          {assignments.map(({ assignment, completionPercent, status, overdue }) => (
            <div
              key={assignment.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-white text-sm truncate">
                    {assignment.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {assignment.ebookTitle}
                  </p>
                </div>
                <StatusPill status={status} overdue={overdue} />
              </div>

              <div className="flex items-center gap-2">
                <ProgressBar pct={completionPercent} />
                <span className="text-xs text-gray-400 tabular-nums flex-shrink-0 w-8 text-right">
                  {completionPercent}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                {assignment.dueDate ? (
                  <p className={`text-xs flex items-center gap-1 ${overdue ? "text-red-500" : "text-gray-400"}`}>
                    <Calendar className="w-3 h-3" />
                    Prazo: {new Date(assignment.dueDate).toLocaleDateString("pt-PT")}
                  </p>
                ) : (
                  <span />
                )}
                {status !== "completed" && (
                  <button
                    onClick={() => onOpenEbook?.(assignment.ebookId)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    {status === "not_started" ? "Começar →" : "Continuar →"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Public export ──────────────────────────────────────────────────────────────

export function EbookAssignmentManager({
  mode = "student",
  onOpenEbook,
}: {
  mode?: "teacher" | "student";
  onOpenEbook?: (ebookId: string) => void;
}) {
  return mode === "teacher" ? <TeacherView /> : <StudentView onOpenEbook={onOpenEbook} />;
}
