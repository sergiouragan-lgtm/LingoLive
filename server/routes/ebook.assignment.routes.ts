import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  createAssignment,
  getAssignment,
  getAssignmentWithProgress,
  listTeacherAssignments,
  listStudentAssignments,
  updateAssignment,
} from "../services/ebook/EbookAssignmentService";

const router = Router();

// ── Teacher: create assignment ─────────────────────────────────────────────────
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const teacherId = req.user.uid;
    const { ebookId, title, description, dueDate, studentIds } = req.body;
    if (!ebookId || !title || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: "ebookId, title e studentIds são obrigatórios." });
    }
    const assignment = await createAssignment(teacherId, {
      ebookId,
      title,
      description,
      dueDate: dueDate ?? null,
      studentIds,
    });
    res.status(201).json(assignment);
  } catch {
    res.status(500).json({ error: "Erro ao criar tarefa." });
  }
});

// ── Teacher: list my assignments ───────────────────────────────────────────────
router.get("/teacher", requireAuth, async (req: any, res) => {
  try {
    const teacherId = req.user.uid;
    const assignments = await listTeacherAssignments(teacherId);
    res.json({ assignments });
  } catch {
    res.status(500).json({ error: "Erro ao listar tarefas." });
  }
});

// ── Teacher: assignment detail with progress ───────────────────────────────────
router.get("/:assignmentId/progress", requireAuth, async (req, res) => {
  try {
    const data = await getAssignmentWithProgress(req.params.assignmentId);
    if (!data) return res.status(404).json({ error: "Tarefa não encontrada." });
    res.json(data);
  } catch {
    res.status(500).json({ error: "Erro ao obter progresso." });
  }
});

// ── Teacher: update assignment ─────────────────────────────────────────────────
router.patch("/:assignmentId", requireAuth, async (req: any, res) => {
  try {
    const updated = await updateAssignment(req.params.assignmentId, req.body);
    if (!updated) return res.status(404).json({ error: "Tarefa não encontrada." });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Erro ao atualizar tarefa." });
  }
});

// ── Student: my assignments ────────────────────────────────────────────────────
router.get("/student/me", requireAuth, async (req: any, res) => {
  try {
    const studentId = req.user.uid;
    const assignments = await listStudentAssignments(studentId);
    res.json({ assignments });
  } catch {
    res.status(500).json({ error: "Erro ao obter tarefas." });
  }
});

// ── Generic get ────────────────────────────────────────────────────────────────
router.get("/:assignmentId", requireAuth, async (req, res) => {
  try {
    const assignment = await getAssignment(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ error: "Tarefa não encontrada." });
    res.json(assignment);
  } catch {
    res.status(500).json({ error: "Erro ao obter tarefa." });
  }
});

export default router;
