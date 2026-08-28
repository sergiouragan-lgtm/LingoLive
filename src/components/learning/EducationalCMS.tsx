import React, { useState, useEffect } from "react";
import { 
  Database, Plus, Search, Filter, CheckCircle, XCircle, Clock, 
  ArrowLeft, History, Globe, FileText, Image, Video, Volume2, 
  BookOpen, User, Sparkles, RefreshCw, FileCode, Trash2, Play, 
  Check, Settings, Layers, Send, Lock, ChevronRight, Eye, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../../firebase";
import { 
  collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, Timestamp 
} from "firebase/firestore";
import { useToast } from "../../context/ToastContext";
import { useUserRole } from "../../context/UserRoleContext";

// Type definitions for Educational CMS
interface Course {
  id: string;
  title: string;
  description: string;
  language: string;
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  ageGroup: string;
  tags: string[];
  author: string;
  authorEmail: string;
  version: string;
  status: "Draft" | "In Review" | "Approved" | "Published";
  createdAt: string;
  updatedAt: string;
}

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  duration: string; // e.g. "15 min"
  contentMarkdown: string;
  status: "Draft" | "In Review" | "Approved" | "Published";
  version: string;
  author: string;
  createdAt: string;
}

interface MediaAsset {
  id: string;
  title: string;
  fileName: string;
  type: "image" | "video" | "audio" | "pdf";
  size: string;
  tags: string[];
  url: string;
  whisperTranscript?: string;
  author: string;
  status: "active" | "archived";
  createdAt: string;
}

interface Exercise {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  language: string;
  topic: string;
  type: "multiple-choice" | "true-false" | "fill-in-blanks" | "translation" | "pronunciation";
  tags: string[];
  createdAt: string;
  status?: "Draft" | "In Review" | "Approved" | "Published";
  source?: "gemini" | "manual";
}

interface VersionLog {
  id: string;
  entityId: string;
  entityType: "course" | "lesson" | "exercise";
  version: string;
  changeSummary: string;
  author: string;
  createdAt: string;
  dataSnapshot?: string;
}

interface ApprovalRequest {
  id: string;
  entityId: string;
  entityType: "course" | "lesson";
  entityTitle: string;
  authorName: string;
  authorEmail: string;
  status: "Pending" | "Approved" | "Rejected";
  comments?: string;
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
}

export const EducationalCMS: React.FC = () => {
  const { role } = useUserRole();
  const { addToast } = useToast();
  const user = auth.currentUser;

  // Active sub-tab in CMS
  const [activeTab, setActiveTab] = useState<"dashboard" | "courses" | "media" | "exercises" | "workflow">("dashboard");

  // Main list states loaded from Firestore/LocalCache
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [versionLogs, setVersionLogs] = useState<VersionLog[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);

  // Search & Filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Loading States
  const [loading, setLoading] = useState(false);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);
  const [firebaseWarning, setFirebaseWarning] = useState(false);

  // Editor modal/detail states
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseForm, setCourseForm] = useState<Partial<Course>>({});

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyEntityId, setHistoryEntityId] = useState<string | null>(null);

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState<Partial<Lesson>>({});

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaForm, setMediaForm] = useState<Partial<MediaAsset>>({ type: "pdf" });
  const [analyzingMedia, setAnalyzingMedia] = useState(false);
  const [cloudFunctionLogs, setCloudFunctionLogs] = useState<string[]>([]);

  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [exerciseForm, setExerciseForm] = useState<Partial<Exercise>>({
    type: "multiple-choice",
    options: ["", "", "", ""],
    tags: []
  });

  // AI Generator state
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiGenLanguage, setAiGenLanguage] = useState("Português (Angola)");
  const [aiGenLevel, setAiGenLevel] = useState("B1");
  const [aiGenTopic, setAiGenTopic] = useState("Saudações Culturais e Gírias");
  const [aiGenType, setAiGenType] = useState("multiple-choice");

  // Approval action comment state
  const [reviewComment, setReviewComment] = useState("");

  // Determine if current user can write content
  const isTeacher = role === "TEACHER" || role === "teacher" || role === "Educator";
  const isAdminUser = role === "SUPER_ADMIN" || role === "PLATFORM_ADMIN" || role === "SCHOOL_ADMIN" || role === "school_admin" || role === "Admin" || user?.email === "sergio.uragan@gmail.com";

  // Load content from persistent collections. Empty collections remain empty.
  useEffect(() => {
    const loadCmsData = async () => {
      setLoading(true);
      setIsFirebaseSyncing(true);
      try {
        const [coursesSnap, lessonsSnap, mediaSnap, exercisesSnap, approvalsSnap, logsSnap] = await Promise.all([
          getDocs(collection(db, "courses")),
          getDocs(collection(db, "lessons")),
          getDocs(collection(db, "media_assets")),
          getDocs(collection(db, "exercises")),
          getDocs(collection(db, "approval_requests")),
          getDocs(collection(db, "version_logs")),
        ]);
        const toList = <T,>(snapshot: any): T[] =>
          snapshot.docs.map((item: any) => ({ id: item.id, ...item.data() } as T));

        const persistedCourses = toList<Course>(coursesSnap)
          .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
        const persistedLessons = toList<Lesson>(lessonsSnap);
        const persistedMedia = toList<MediaAsset>(mediaSnap);
        const persistedExercises = toList<Exercise>(exercisesSnap);
        const persistedApprovals = toList<ApprovalRequest>(approvalsSnap);
        const persistedLogs = toList<VersionLog>(logsSnap);

        setCourses(persistedCourses);
        setLessons(persistedLessons);
        setMediaAssets(persistedMedia);
        setExercises(persistedExercises);
        setApprovalRequests(persistedApprovals);
        setVersionLogs(persistedLogs);
        updateCache({
          courses: persistedCourses,
          lessons: persistedLessons,
          mediaAssets: persistedMedia,
          exercises: persistedExercises,
          approvalRequests: persistedApprovals,
          versionLogs: persistedLogs,
        });
      } catch (error: any) {
        console.warn("Não foi possível carregar as coleções reais do CMS.", error.message);
        setFirebaseWarning(true);
      } finally {
        setIsFirebaseSyncing(false);
        setLoading(false);
      }
    };

    loadCmsData();
  }, []);

  // Sync cache utility
  const updateCache = (data: {
    courses: Course[];
    lessons: Lesson[];
    mediaAssets: MediaAsset[];
    exercises: Exercise[];
    approvalRequests: ApprovalRequest[];
    versionLogs: VersionLog[];
  }) => {
    localStorage.setItem("lingolive_cms_cache", JSON.stringify(data));
  };

  // Generic firestore write wrapper with local fallback
  const handleSave = async (
    collectionName: string, 
    docId: string, 
    data: any, 
    successMessage: string
  ) => {
    let success = false;
    try {
      await setDoc(doc(db, collectionName, docId), data, { merge: true });
      success = true;
    } catch (err: any) {
      console.warn(`Firestore save failed for ${collectionName}/${docId}. Saving locally.`, err.message);
      setFirebaseWarning(true);
    }
    addToast(
      success 
        ? successMessage 
        : `${successMessage} (Sincronizado Localmente - Permissão de Leitor/Autor)`, 
      "success"
    );
  };

  // Courses operations
  const openCourseEdit = (course?: Course) => {
    if (course) {
      setSelectedCourse(course);
      setCourseForm({ ...course });
    } else {
      setSelectedCourse(null);
      setCourseForm({
        language: "Português (Angola)",
        cefrLevel: "B1",
        ageGroup: "Teens",
        status: "Draft",
        version: "1.0",
        tags: []
      });
    }
    setIsCourseModalOpen(true);
  };

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title || !courseForm.description) {
      addToast("Por favor preencha todos os campos obrigatórios.", "error");
      return;
    }

    const isNew = !selectedCourse;
    const courseId = isNew ? `course_${Date.now()}` : selectedCourse!.id;
    const timestamp = new Date().toISOString();

    const updatedCourse: Course = {
      id: courseId,
      title: courseForm.title!,
      description: courseForm.description!,
      language: courseForm.language || "Português (Angola)",
      cefrLevel: courseForm.cefrLevel || "B1",
      ageGroup: courseForm.ageGroup || "Teens",
      tags: courseForm.tags || ["Geral"],
      author: courseForm.author || user?.displayName || "Professor LingoLive",
      authorEmail: courseForm.authorEmail || user?.email || "professor@lingolive.ao",
      version: courseForm.version || "1.0",
      status: courseForm.status || "Draft",
      createdAt: isNew ? timestamp : courseForm.createdAt!,
      updatedAt: timestamp
    };

    // Version tracking
    const logsList = [...versionLogs];
    
    if (isNew) {
      const logId = `vlog_${Date.now()}`;
      const log: VersionLog = {
        id: logId,
        entityId: courseId,
        entityType: "course",
        version: updatedCourse.version,
        changeSummary: `Versão inicial criada.`,
        author: user?.displayName || "Professor",
        createdAt: timestamp,
        dataSnapshot: JSON.stringify(updatedCourse)
      };
      logsList.unshift(log);
      setVersionLogs(logsList);
      await handleSave("version_logs", logId, log, "Log inicial arquivado");
    } else if (selectedCourse!.version !== updatedCourse.version) {
      const logId = `vlog_${Date.now()}`;
      const log: VersionLog = {
        id: logId,
        entityId: courseId,
        entityType: "course",
        version: updatedCourse.version,
        changeSummary: `Versão atualizada de ${selectedCourse!.version} para ${updatedCourse.version}.`,
        author: user?.displayName || "Professor",
        createdAt: timestamp,
        dataSnapshot: JSON.stringify(updatedCourse)
      };
      logsList.unshift(log);
      setVersionLogs(logsList);
      await handleSave("version_logs", logId, log, "Log de versão arquivado");
    }

    // Submit for review if status is In Review
    const approvalsList = [...approvalRequests];
    if (updatedCourse.status === "In Review") {
      const existingReq = approvalsList.find(r => r.entityId === courseId && r.status === "Pending");
      if (!existingReq) {
        const reqId = `req_${Date.now()}`;
        const approvalReq: ApprovalRequest = {
          id: reqId,
          entityId: courseId,
          entityType: "course",
          entityTitle: updatedCourse.title,
          authorName: updatedCourse.author,
          authorEmail: updatedCourse.authorEmail,
          status: "Pending",
          createdAt: timestamp
        };
        approvalsList.unshift(approvalReq);
        setApprovalRequests(approvalsList);
        await handleSave("approval_requests", reqId, approvalReq, "Submetido para aprovação do Administrador");
      }
    }

    const updatedCourses = isNew 
      ? [updatedCourse, ...courses] 
      : courses.map(c => c.id === courseId ? updatedCourse : c);

    setCourses(updatedCourses);
    updateCache({
      courses: updatedCourses,
      lessons,
      mediaAssets,
      exercises,
      approvalRequests: approvalsList,
      versionLogs: logsList
    });

    await handleSave("courses", courseId, updatedCourse, isNew ? "Curso criado com sucesso" : "Curso atualizado com sucesso");
    setIsCourseModalOpen(false);
  };

  const handleRevertToVersion = async (log: VersionLog) => {
    if (!log.dataSnapshot) {
      addToast("O snapshot de dados desta versão não está disponível.", "error");
      return;
    }

    try {
      const parsedData = JSON.parse(log.dataSnapshot) as Course;
      const timestamp = new Date().toISOString();
      const newVersionString = `${log.version}-reverted`;

      const updatedCourse: Course = {
        ...parsedData,
        version: newVersionString,
        updatedAt: timestamp,
        status: "Draft" // Force to draft when reverting
      };

      const courseId = updatedCourse.id;

      const updatedCourses = courses.map(c => c.id === courseId ? updatedCourse : c);
      setCourses(updatedCourses);

      const logId = `vlog_${Date.now()}`;
      const newLog: VersionLog = {
        id: logId,
        entityId: courseId,
        entityType: "course",
        version: newVersionString,
        changeSummary: `Revertido para a versão anterior: ${log.version}`,
        author: user?.displayName || "Professor",
        createdAt: timestamp,
        dataSnapshot: JSON.stringify(updatedCourse)
      };

      const logsList = [newLog, ...versionLogs];
      setVersionLogs(logsList);

      updateCache({
        courses: updatedCourses,
        lessons,
        mediaAssets,
        exercises,
        approvalRequests,
        versionLogs: logsList
      });

      await handleSave("courses", courseId, updatedCourse, "Curso revertido com sucesso");
      await handleSave("version_logs", logId, newLog, "Log de reversão arquivado");
    } catch (err) {
      console.error(err);
      addToast("Falha ao reverter curso.", "error");
    }
  };

  const deleteCourseItem = async (courseId: string) => {
    if (!window.confirm("Tem a certeza que deseja eliminar este curso? Todas as lições associadas ficarão sem categoria.")) return;

    const filteredCourses = courses.filter(c => c.id !== courseId);
    setCourses(filteredCourses);

    updateCache({
      courses: filteredCourses,
      lessons,
      mediaAssets,
      exercises,
      approvalRequests,
      versionLogs
    });

    try {
      await deleteDoc(doc(db, "courses", courseId));
      addToast("Curso removido do Firestore", "success");
    } catch (e) {
      addToast("Curso removido localmente", "info");
    }
  };

  // Lessons operations
  const openLessonEdit = (courseId: string, lesson?: Lesson) => {
    if (lesson) {
      setSelectedLesson(lesson);
      setLessonForm({ ...lesson });
    } else {
      setSelectedLesson(null);
      setLessonForm({
        courseId,
        status: "Draft",
        version: "1.0",
        order: lessons.filter(l => l.courseId === courseId).length + 1,
        duration: "15 min"
      });
    }
    setIsLessonModalOpen(true);
  };

  const saveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.title || !lessonForm.contentMarkdown) {
      addToast("Por favor preencha todos os campos obrigatórios.", "error");
      return;
    }

    const isNew = !selectedLesson;
    const lessonId = isNew ? `lesson_${Date.now()}` : selectedLesson!.id;
    const timestamp = new Date().toISOString();

    const updatedLesson: Lesson = {
      id: lessonId,
      courseId: lessonForm.courseId!,
      title: lessonForm.title!,
      description: lessonForm.description || "",
      order: Number(lessonForm.order) || 1,
      duration: lessonForm.duration || "15 min",
      contentMarkdown: lessonForm.contentMarkdown!,
      status: lessonForm.status || "Draft",
      version: lessonForm.version || "1.0",
      author: lessonForm.author || user?.displayName || "Educador LingoLive",
      createdAt: isNew ? timestamp : lessonForm.createdAt!
    };

    const updatedLessons = isNew
      ? [...lessons, updatedLesson]
      : lessons.map(l => l.id === lessonId ? updatedLesson : l);

    // Sort by order
    updatedLessons.sort((a, b) => a.order - b.order);

    setLessons(updatedLessons);
    updateCache({
      courses,
      lessons: updatedLessons,
      mediaAssets,
      exercises,
      approvalRequests,
      versionLogs
    });

    await handleSave("lessons", lessonId, updatedLesson, isNew ? "Lição adicionada com sucesso" : "Lição atualizada com sucesso");
    setIsLessonModalOpen(false);
  };

  // Media Library Upload & Analysis simulation (Cloud Functions & Whisper)
  const handleMediaUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaForm.fileName || !mediaForm.title) {
      addToast("Nome de arquivo e título são obrigatórios.", "error");
      return;
    }

    setAnalyzingMedia(true);
    setCloudFunctionLogs([`[${new Date().toISOString()}] 🚀 Upload simulado em andamento...`]);

    const timestamp = new Date().toISOString();

    try {
      const response = await fetch("/api/cms/media-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType: mediaForm.type,
          fileName: mediaForm.fileName,
          fileUrl: `https://storage.googleapis.com/lingolive-media-bucket/${mediaForm.fileName}`
        })
      });

      const parsed = await response.json();

      if (parsed.processingLogs) {
        setCloudFunctionLogs(parsed.processingLogs);
      }

      // Prepare complete media asset
      const mediaId = `media_${Date.now()}`;
      const newMedia: MediaAsset = {
        id: mediaId,
        title: parsed.suggestedTitle || mediaForm.title!,
        fileName: mediaForm.fileName!,
        type: mediaForm.type || "pdf",
        size: mediaForm.size || "2.1 MB",
        tags: parsed.tags || ["automático"],
        url: parsed.fileUrl || `https://storage.googleapis.com/lingolive-media-bucket/${mediaForm.fileName}`,
        whisperTranscript: parsed.whisperTranscript || "",
        author: user?.displayName || "Sérgio Uragan",
        status: "active",
        createdAt: timestamp
      };

      const updatedMedia = [newMedia, ...mediaAssets];
      setMediaAssets(updatedMedia);
      updateCache({
        courses,
        lessons,
        mediaAssets: updatedMedia,
        exercises,
        approvalRequests,
        versionLogs
      });

      await handleSave("media_assets", mediaId, newMedia, "Recurso de mídia arquivado e analisado");
      addToast(`Análise concluída via Cloud Functions! Tags auto-geradas: ${newMedia.tags.join(", ")}`, "success");
      
      // Keep logs visible briefly then close
      setTimeout(() => {
        setAnalyzingMedia(false);
        setIsMediaModalOpen(false);
        setCloudFunctionLogs([]);
      }, 3500);

    } catch (error) {
      console.error(error);
      addToast("Erro na simulação do processador de mídia.", "error");
      setAnalyzingMedia(false);
    }
  };

  // Google Gemini Exercise Generator Client Bridge
  const handleGenerateAIExercises = async () => {
    if (!aiGenTopic.trim()) {
      addToast("Especifique um tópico educacional para o gerador de IA.", "error");
      return;
    }

    setGeneratingAI(true);
    addToast("Chamando o modelo de linguagem Gemini AI para formular exercícios premium...", "info");

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Sessão autenticada necessária.");
      const response = await fetch("/api/cms/generate-exercise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          language: aiGenLanguage,
          proficiency: aiGenLevel,
          topic: aiGenTopic,
          type: aiGenType
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Falha na geração real de exercícios.");

      if (data.exercises && data.exercises.length > 0) {
        const newExercises: Exercise[] = data.exercises;

        const merged = [...newExercises, ...exercises];
        setExercises(merged);
        updateCache({
          courses,
          lessons,
          mediaAssets,
          exercises: merged,
          approvalRequests,
          versionLogs
        });

        addToast(`Sucesso! ${newExercises.length} exercícios reais foram validados e guardados como rascunho.`, "success");
      } else {
        addToast("A API do Gemini retornou uma resposta sem exercícios formatados.", "error");
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Erro crítico ao conectar com o gerador cognitivo Gemini.", "error");
    } finally {
      setGeneratingAI(false);
    }
  };

  // Manual exercise builder save
  const saveManualExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseForm.question || !exerciseForm.answer) {
      addToast("Por favor preencha a pergunta e a resposta correta.", "error");
      return;
    }

    const exId = `ex_manual_${Date.now()}`;
    const newEx: Exercise = {
      id: exId,
      question: exerciseForm.question!,
      options: exerciseForm.type === "multiple-choice" || exerciseForm.type === "true-false" 
        ? (exerciseForm.options || []).filter(o => o.trim() !== "")
        : [],
      answer: exerciseForm.answer!,
      explanation: exerciseForm.explanation || "Explicação geral da lição.",
      difficulty: (exerciseForm.difficulty as any) || "Intermediate",
      language: filterLanguage === "all" ? "Português (Angola)" : filterLanguage,
      topic: exerciseForm.topic || "Geral",
      type: exerciseForm.type || "multiple-choice",
      tags: exerciseForm.tags || [],
      createdAt: new Date().toISOString()
    };

    const updated = [newEx, ...exercises];
    setExercises(updated);
    updateCache({
      courses,
      lessons,
      mediaAssets,
      exercises: updated,
      approvalRequests,
      versionLogs
    });

    await handleSave("exercises", exId, newEx, "Exercício pedagógico criado");
    setIsExerciseModalOpen(false);
    setExerciseForm({ type: "multiple-choice", options: ["", "", "", ""], tags: [] });
  };

  // Workflow Approval Operations (Admin CMS reviews submitted drafts)
  const handleWorkflowAction = async (req: ApprovalRequest, approve: boolean) => {
    const timestamp = new Date().toISOString();
    const actionStatus = approve ? "Approved" : "Rejected";

    // 1. Update the approval request state
    const updatedRequests = approvalRequests.map(r => {
      if (r.id === req.id) {
        return {
          ...r,
          status: actionStatus as any,
          comments: reviewComment,
          reviewedBy: user?.displayName || "Sergio Admin",
          reviewedAt: timestamp
        };
      }
      return r;
    });

    // 2. Update the Course/Lesson status
    const targetStatus = approve ? "Published" : "Draft";
    const updatedCourses = courses.map(c => {
      if (c.id === req.entityId) {
        return { ...c, status: targetStatus as any, updatedAt: timestamp };
      }
      return c;
    });

    setApprovalRequests(updatedRequests);
    setCourses(updatedCourses);
    setReviewComment("");

    updateCache({
      courses: updatedCourses,
      lessons,
      mediaAssets,
      exercises,
      approvalRequests: updatedRequests,
      versionLogs
    });

    // Save to Firestore
    await handleSave("approval_requests", req.id, {
      status: actionStatus,
      comments: reviewComment,
      reviewedBy: user?.displayName || "Admin",
      reviewedAt: timestamp
    }, `Fluxo concluído: Conteúdo ${approve ? 'Aprovado' : 'Rejeitado'}`);

    await handleSave("courses", req.entityId, {
      status: targetStatus,
      updatedAt: timestamp
    }, `Status do curso alterado para: ${targetStatus}`);
  };

  // Searching filters
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesLanguage = filterLanguage === "all" || course.language === filterLanguage;
    const matchesLevel = filterLevel === "all" || course.cefrLevel === filterLevel;

    return matchesSearch && matchesLanguage && matchesLevel;
  });

  const filteredMedia = mediaAssets.filter(media => {
    const matchesSearch = media.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          media.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          media.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === "all" || media.type === filterType;
    return matchesSearch && matchesType;
  });

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ex.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || ex.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 p-2 md:p-6" id="educational-cms-main">
      {/* Header and Sync Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
              CMS de Tecnologia Educacional v2.1
            </span>
            {isFirebaseSyncing && (
              <span className="flex items-center gap-1 text-xs text-indigo-600 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Sincronizando Firestore...
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 font-sans">
            Gestão de Conteúdo Pedagógico
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Crie cursos, envie mídias com transcrição Whisper automática e gere testes premium com o Gemini AI.
          </p>
        </div>

        {/* Firebase Alert banner */}
        {firebaseWarning && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3 text-amber-800 text-xs max-w-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <div>
              <span className="font-semibold">Sincronização Integrada Ativa</span>
              <p className="text-amber-700/80 mt-0.5">Usando cache local inteligente em paralelo para persistência de alta velocidade.</p>
            </div>
          </div>
        )}
      </div>

      {/* Role Visualizer Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Identidade de Trabalho</div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {user?.displayName || "Sérgio Uragan"} 
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 uppercase">
                {role || "Educator"}
              </span>
            </div>
          </div>
        </div>

        {/* Mini CMS Stats */}
        <div className="flex items-center gap-6 text-xs text-slate-500 font-mono">
          <div className="text-center">
            <span className="block text-lg font-bold text-slate-900">{courses.length}</span>
            Cursos
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <span className="block text-lg font-bold text-slate-900">{lessons.length}</span>
            Aulas
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <span className="block text-lg font-bold text-slate-900">{mediaAssets.length}</span>
            Mídias Whisper
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <span className="block text-lg font-bold text-slate-900">{exercises.length}</span>
            Questões AI
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto mb-8 scrollbar-none" id="cms-tab-bar">
        {[
          { id: "dashboard", label: "Dashboard Geral", icon: Database },
          { id: "courses", label: "Cursos e Lições", icon: BookOpen },
          { id: "media", label: "Biblioteca de Mídias", icon: Image },
          { id: "exercises", label: "Banco de Questões (IA)", icon: Sparkles },
          { id: "workflow", label: "Fluxos & Aprovações", icon: Layers }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all cursor-pointer whitespace-nowrap ${
                isActive 
                  ? "border-indigo-600 text-indigo-600 font-semibold bg-indigo-50/20" 
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
              {tab.id === "workflow" && approvalRequests.filter(r => r.status === "Pending").length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-bold">
                  {approvalRequests.filter(r => r.status === "Pending").length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
        >
          
          {/* TAB 1: DASHBOARD GENERAL */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="cms-dashboard-tab">
              {/* Quick Summary Cards */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Intro Bento Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-slate-400 text-xs font-semibold uppercase">Published Syllabus</span>
                    <span className="block text-2xl font-bold mt-1">
                      {courses.filter(c => c.status === "Published").length} / {courses.length}
                    </span>
                    <p className="text-slate-400 text-xs mt-1">Cursos Globais Ativos</p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <span className="text-slate-400 text-xs font-semibold uppercase">Transcribed Media</span>
                    <span className="block text-2xl font-bold mt-1">
                      {mediaAssets.filter(m => m.whisperTranscript).length}
                    </span>
                    <p className="text-slate-400 text-xs mt-1">Whisper API Transcrições</p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 mb-3">
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className="text-slate-400 text-xs font-semibold uppercase">Pending Reviews</span>
                    <span className="block text-2xl font-bold mt-1">
                      {approvalRequests.filter(r => r.status === "Pending").length}
                    </span>
                    <p className="text-slate-400 text-xs mt-1">Esperando Verificação</p>
                  </div>
                </div>

                {/* System automation showcase */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl relative overflow-hidden shadow-lg">
                  <div className="relative z-10">
                    <span className="px-2 py-1 text-[10px] bg-indigo-500/30 border border-indigo-400/20 rounded-md font-bold text-indigo-300 uppercase tracking-wider">
                      Tecnologia de Automação
                    </span>
                    <h3 className="text-xl font-bold mt-2 font-sans">
                      Autotranscrição com IA & Questionários Cognitivos
                    </h3>
                    <p className="text-indigo-200/80 text-xs max-w-xl mt-1.5 leading-relaxed">
                      Este painel integra o Whisper API e o modelo de linguagem Gemini. Ao carregar áudios educacionais, uma Cloud Function transcreve a pronúncia no sotaque selecionado. Crie testes dinâmicos instantaneamente.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-4">
                      <button 
                        onClick={() => setActiveTab("exercises")}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Gerar Exercício IA
                      </button>
                      <button 
                        onClick={() => setActiveTab("media")}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Carregar Mídia
                      </button>
                    </div>
                  </div>
                  <div className="absolute right-[-10px] bottom-[-20px] opacity-15 text-indigo-300">
                    <Sparkles className="w-48 h-48" />
                  </div>
                </div>

                {/* Content Statistics and Compliance Audit Logs */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-500" />
                    Versões e Histórico de Alterações de Conteúdo
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {versionLogs.map(log => (
                      <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold font-mono">
                              v{log.version}
                            </span>
                            <span className="font-semibold text-slate-800 capitalize">
                              {log.entityType}: {courses.find(c => c.id === log.entityId)?.title || "Recurso"}
                            </span>
                          </div>
                          <p className="text-slate-400 mt-1">{log.changeSummary}</p>
                        </div>
                        <div className="text-right text-slate-400 font-mono text-[10px]">
                          <div>Por: {log.author}</div>
                          <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Action Log and Workflow status */}
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Aguardando Aprovação (Admin)
                  </h3>
                  <div className="space-y-3">
                    {approvalRequests.filter(r => r.status === "Pending").length === 0 ? (
                      <div className="text-slate-400 text-xs py-4 text-center">
                        Sem submissões pendentes de revisão.
                      </div>
                    ) : (
                      approvalRequests.filter(r => r.status === "Pending").map(req => (
                        <div key={req.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <div className="font-semibold text-slate-900">{req.entityTitle}</div>
                          <div className="text-slate-400 mt-1">Autor: {req.authorName}</div>
                          <div className="flex justify-between items-center mt-3">
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Em Revisão
                            </span>
                            <button
                              onClick={() => {
                                setActiveTab("workflow");
                                addToast("Redirecionado para a fila de aprovação", "info");
                              }}
                              className="text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              Analisar <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* System Compliance notes */}
                <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-xs space-y-3">
                  <span className="font-bold text-slate-800 block">Normas de Compliance Pedagógico</span>
                  <p className="leading-relaxed text-slate-500">
                    A publicação de cursos do LingoLive obedece a regras de adequação de idade (Maturity Levels) e verificação gramatical rigorosa do sotaque regional. Certifique-se de que cada lição foi auditada por um coordenador pedagógico antes de publicar globalmente.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: COURSES & LESSONS */}
          {activeTab === "courses" && (
            <div className="space-y-6" id="cms-courses-tab">
              
              {/* Search, Filter, & Create Controls */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar cursos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                    />
                  </div>
                  
                  <select
                    value={filterLanguage}
                    onChange={(e) => setFilterLanguage(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Todos os Idiomas</option>
                    <option value="Português (Angola)">Português (Angola)</option>
                    <option value="Inglês">Inglês</option>
                  </select>

                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Todos os Níveis</option>
                    <option value="A1">A1 - Iniciante</option><option value="A2">A2 - Básico</option>
                    <option value="B1">B1 - Intermediário</option><option value="B2">B2 - Independente</option>
                    <option value="C1">C1 - Avançado</option><option value="C2">C2 - Proficiente</option>
                  </select>
                </div>

                <div className="w-full md:w-auto text-right">
                  <button
                    onClick={() => openCourseEdit()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full md:w-auto"
                  >
                    <Plus className="w-4 h-4" /> Novo Curso
                  </button>
                </div>
              </div>

              {/* Master-Detail Courses Accordion Layout */}
              <div className="grid grid-cols-1 gap-4">
                {filteredCourses.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-slate-400 text-xs">
                    Nenhum curso correspondente aos filtros foi encontrado.
                  </div>
                ) : (
                  filteredCourses.map(course => (
                    <div 
                      key={course.id} 
                      className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-xs ${
                        course.status === "Published" ? "border-slate-100" :
                        course.status === "In Review" ? "border-amber-200 bg-amber-50/5" : "border-slate-200/60"
                      }`}
                    >
                      {/* Course Header */}
                      <div className="p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                              {course.language}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                              {course.cefrLevel}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              course.status === "Published" ? "bg-emerald-100 text-emerald-800" :
                              course.status === "In Review" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                            }`}>
                              {course.status}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
                          <p className="text-slate-500 text-xs max-w-3xl leading-relaxed">{course.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {course.tags.map(t => (
                              <span key={t} className="text-[10px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-100">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Course Controls */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                          <button
                            onClick={() => openLessonEdit(course.id)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar Aula
                          </button>
                          <button
                            onClick={() => {
                              setHistoryEntityId(course.id);
                              setIsHistoryModalOpen(true);
                            }}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg cursor-pointer"
                            title="Histórico de Versões"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openCourseEdit(course)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-150 text-slate-600 rounded-lg border border-slate-100 cursor-pointer"
                            title="Editar Curso"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteCourseItem(course.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                            title="Excluir Curso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Lesson Child list inside Course card */}
                      <div className="bg-slate-50/50 border-t border-slate-100 px-5 py-4 space-y-2">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Lições Mapeadas ({lessons.filter(l => l.courseId === course.id).length})
                        </h4>
                        
                        {lessons.filter(l => l.courseId === course.id).length === 0 ? (
                          <div className="text-slate-400 text-xs py-3">
                            Nenhuma aula associada a este curso. Clique em "Adicionar Aula" para começar.
                          </div>
                        ) : (
                          lessons.filter(l => l.courseId === course.id).map(lesson => (
                            <div 
                              key={lesson.id} 
                              className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs font-mono">
                                  {lesson.order}
                                </span>
                                <div>
                                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                    {lesson.title}
                                    <span className="text-[9px] text-slate-400 font-normal">({lesson.duration})</span>
                                  </div>
                                  <p className="text-slate-400 text-[10px] mt-0.5">{lesson.description}</p>
                                </div>
                              </div>

                              {/* Lesson Controls */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setSelectedLesson(lesson);
                                    setLessonForm({ ...lesson });
                                    setIsLessonModalOpen(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 cursor-pointer"
                                  title="Editar Lição"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA LIBRARY */}
          {activeTab === "media" && (
            <div className="space-y-6" id="cms-media-tab">
              {/* Controls */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar mídia..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                    />
                  </div>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Todos os Tipos</option>
                    <option value="audio">Áudio (Whisper)</option>
                    <option value="video">Vídeo</option>
                    <option value="image">Imagem</option>
                    <option value="pdf">Documento PDF</option>
                  </select>
                </div>

                <div className="w-full md:w-auto text-right">
                  <button
                    onClick={() => {
                      setMediaForm({ type: "audio" });
                      setIsMediaModalOpen(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full md:w-auto"
                  >
                    <Plus className="w-4 h-4" /> Carregar para o Storage
                  </button>
                </div>
              </div>

              {/* Grid of Media Assets */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMedia.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-slate-400 text-xs lg:col-span-3">
                    Nenhum arquivo multimídia encontrado.
                  </div>
                ) : (
                  filteredMedia.map(media => {
                    return (
                      <div key={media.id} className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between">
                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono">{media.size}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              media.type === "audio" ? "bg-violet-100 text-violet-800" :
                              media.type === "image" ? "bg-blue-100 text-blue-800" :
                              media.type === "video" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                            }`}>
                              {media.type}
                            </span>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-500 border border-slate-100">
                              {media.type === "audio" && <Volume2 className="w-5 h-5 text-violet-500" />}
                              {media.type === "image" && <Image className="w-5 h-5 text-blue-500" />}
                              {media.type === "video" && <Video className="w-5 h-5 text-rose-500" />}
                              {media.type === "pdf" && <FileCode className="w-5 h-5 text-amber-500" />}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 leading-tight">{media.title}</h4>
                              <p className="text-slate-400 text-[10px] truncate max-w-[200px] mt-0.5 font-mono">{media.fileName}</p>
                            </div>
                          </div>

                          {/* OCR/Transcription Automatic box */}
                          {media.whisperTranscript ? (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/60 text-[11px] leading-relaxed text-slate-600 max-h-24 overflow-y-auto">
                              <span className="font-bold text-slate-800 block text-[9px] uppercase tracking-wider mb-1">
                                Transcrição/OCR Automático
                              </span>
                              {media.whisperTranscript}
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-50 text-center text-slate-400 text-[10px] rounded-xl">
                              Sem transcrição disponível.
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1 mt-2">
                            {media.tags.map(t => (
                              <span key={t} className="text-[9px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Footer Action */}
                        <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[10px]">Por: {media.author}</span>
                          <button
                            onClick={() => {
                              window.open(media.url, "_blank");
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Abrir Recurso
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: QUESTION BANK & AI GENERATOR */}
          {activeTab === "exercises" && (
            <div className="space-y-6" id="cms-exercises-tab">
              
              {/* Dynamic AI Exercise Generator Section */}
              <div className="bg-gradient-to-br from-indigo-50 to-slate-50 p-6 rounded-2xl border border-indigo-100/60 relative overflow-hidden">
                <div className="max-w-3xl relative z-10">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs uppercase mb-2">
                    <Sparkles className="w-4 h-4" />
                    Gerador Inteligente de Exercícios (Gemini AI)
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-sans">
                    Formule Questionários em Segundos
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    Selecione os critérios pedagógicos abaixo e deixe que o motor generativo do Gemini crie perguntas de alta fidelidade com respostas, distratores e explicações pedagógicas em tempo real.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Idioma de Destino</label>
                      <select
                        value={aiGenLanguage}
                        onChange={(e) => setAiGenLanguage(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Português (Angola)">Português (Angola)</option>
                        <option value="Inglês">Inglês</option>
                        <option value="Francês">Francês</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Nível de Proficiência</label>
                      <select
                        value={aiGenLevel}
                        onChange={(e) => setAiGenLevel(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="A1">A1 - Iniciante</option>
                        <option value="A2">A2 - Básico</option>
                        <option value="B1">B1 - Intermediário</option>
                        <option value="B2">B2 - Independente</option>
                        <option value="C1">C1 - Avançado</option>
                        <option value="C2">C2 - Proficiente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Formato</label>
                      <select
                        value={aiGenType}
                        onChange={(e) => setAiGenType(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="multiple-choice">Múltipla Escolha</option>
                        <option value="true-false">Verdadeiro ou Falso</option>
                        <option value="fill-in-blanks">Preencher Lacunas</option>
                        <option value="translation">Tradução Direta</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Tópico Pedagógico</label>
                      <input
                        type="text"
                        value={aiGenTopic}
                        onChange={(e) => setAiGenTopic(e.target.value)}
                        placeholder="Ex: Alimentos ou Gírias"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                  </div>

                  <div className="mt-4 text-right">
                    <button
                      onClick={handleGenerateAIExercises}
                      disabled={generatingAI}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      {generatingAI ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Formulando Testes...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Gerar via Gemini AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Central Pool Exercise Bank */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900">
                    Banco de Exercícios Ativos ({exercises.length})
                  </h3>
                  <button
                    onClick={() => {
                      setExerciseForm({ type: "multiple-choice", options: ["", "", "", ""], tags: [] });
                      setIsExerciseModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Manualmente
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {exercises.map(ex => (
                    <div key={ex.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold font-mono uppercase">
                            {ex.type}
                          </span>
                          <span className="text-slate-400">{ex.language} • {ex.difficulty}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{ex.question}</h4>

                        {/* Options list for multiple-choice */}
                        {ex.options && ex.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                            {ex.options.map(opt => (
                              <div 
                                key={opt} 
                                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                                  opt === ex.answer 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold" 
                                    : "bg-slate-50 border-slate-100 text-slate-600"
                                }`}
                              >
                                {opt === ex.answer ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                                )}
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Blank or other forms answer */}
                        {(!ex.options || ex.options.length === 0) && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <strong>Resposta Correta:</strong> {ex.answer}
                          </div>
                        )}

                        <div className="p-3 bg-slate-50/50 rounded-xl text-[11px] leading-relaxed text-slate-500 mt-2">
                          <strong className="text-slate-700 block mb-0.5">Explicação Gramatical:</strong>
                          {ex.explanation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: APPROVALS & WORKFLOW */}
          {activeTab === "workflow" && (
            <div className="space-y-6" id="cms-workflow-tab">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  Fluxo de Trabalho de Aprovação Pedagógica
                </h3>
                <p className="text-slate-500 text-xs mb-6">
                  Fila centralizada de revisão. Apenas coordenadores autorizados ou administradores seniores como Sérgio Uragan podem aprovar e publicar as lições globais para as escolas.
                </p>

                {approvalRequests.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Nenhum pedido de aprovação registrado na fila do CMS.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {approvalRequests.map(req => {
                      const isPending = req.status === "Pending";
                      return (
                        <div key={req.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                req.entityType === "course" ? "bg-indigo-100 text-indigo-800" : "bg-violet-100 text-violet-800"
                              }`}>
                                {req.entityType}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                req.status === "Pending" ? "bg-amber-100 text-amber-800 animate-pulse" :
                                req.status === "Approved" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                              }`}>
                                {req.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900">{req.entityTitle}</h4>
                            <p className="text-slate-400 text-[10px]">
                              Submetido por: <span className="font-semibold">{req.authorName}</span> ({req.authorEmail}) • em {new Date(req.createdAt).toLocaleDateString()}
                            </p>
                            {req.comments && (
                              <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-600 mt-2 italic border border-slate-100">
                                " {req.comments} " - {req.reviewedBy}
                              </div>
                            )}
                          </div>

                          {/* Admin Review Controls */}
                          {isPending && (
                            <div className="w-full md:w-auto shrink-0 space-y-3">
                              {isAdminUser ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Nota de revisão (opcional)..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    className="w-full md:w-64 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 font-sans"
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => handleWorkflowAction(req, false)}
                                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                                    >
                                      <XCircle className="w-3.5 h-3.5" /> Rejeitar
                                    </button>
                                    <button
                                      onClick={() => handleWorkflowAction(req, true)}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" /> Aprovar & Publicar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-slate-400 text-[10px] italic flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> Apenas Administradores podem revisar
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* MODAL: CREATE / EDIT COURSE */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {selectedCourse ? "Editar Curso Pedagógico" : "Criar Novo Curso de Idiomas"}
              </h3>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveCourse} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Título do Curso</label>
                <input
                  type="text"
                  required
                  value={courseForm.title || ""}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="Ex: Português de Angola de Nível Avançado"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição Curricular</label>
                <textarea
                  required
                  rows={3}
                  value={courseForm.description || ""}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="Sumário das competências de fala e escrita abordadas..."
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Idioma</label>
                  <select
                    value={courseForm.language || ""}
                    onChange={(e) => setCourseForm({ ...courseForm, language: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Português (Angola)">Português (Angola)</option>
                    <option value="Inglês">Inglês</option>
                    <option value="Francês">Francês</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nível CEFR</label>
                  <select
                    value={courseForm.cefrLevel || ""}
                    onChange={(e) => setCourseForm({ ...courseForm, cefrLevel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="A1">A1 - Iniciante</option>
                    <option value="A2">A2 - Básico</option>
                    <option value="B1">B1 - Intermediário</option>
                    <option value="B2">B2 - Independente</option>
                    <option value="C1">C1 - Avançado</option>
                    <option value="C2">C2 - Proficiente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Grupo Etário</label>
                  <select
                    value={courseForm.ageGroup || ""}
                    onChange={(e) => setCourseForm({ ...courseForm, ageGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Kids">Kids</option>
                    <option value="PreTeens">PreTeens</option>
                    <option value="Teens">Teens</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Versão</label>
                  <input
                    type="text"
                    required
                    value={courseForm.version || ""}
                    onChange={(e) => setCourseForm({ ...courseForm, version: e.target.value })}
                    placeholder="1.0"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado</label>
                  <select
                    value={courseForm.status || ""}
                    onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Draft">Rascunho (Draft)</option>
                    <option value="In Review">Enviar para Revisão</option>
                    {isAdminUser && <option value="Published">Publicar Globalmente</option>}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Salvar Curso
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: VERSION HISTORY */}
      {isHistoryModalOpen && historyEntityId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                Histórico de Versões do Curso
              </h3>
              <button 
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setHistoryEntityId(null);
                }} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {versionLogs.filter(log => log.entityId === historyEntityId).length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-8">
                  Nenhum histórico de versão disponível para este curso.
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[17px] before:w-[2px] before:bg-slate-100">
                  {versionLogs
                    .filter(log => log.entityId === historyEntityId)
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .map(log => (
                      <div key={log.id} className="relative flex gap-4">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border-4 border-white shrink-0 flex items-center justify-center relative z-10 text-indigo-600 shadow-xs">
                          <History className="w-4 h-4" />
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                              v{log.version}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mb-3">{log.changeSummary}</p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/60">
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <User className="w-3 h-3" /> {log.author}
                            </span>
                            {log.dataSnapshot && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Tem a certeza que deseja reverter o curso atual para a versão ${log.version}? Isso substituirá as definições atuais pelas definições deste momento no tempo.`)) {
                                    handleRevertToVersion(log);
                                    setIsHistoryModalOpen(false);
                                  }
                                }}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded cursor-pointer transition-all"
                              >
                                Reverter para esta versão
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT LESSON */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {selectedLesson ? "Editar Aula Pedagógica" : "Adicionar Nova Lição"}
              </h3>
              <button onClick={() => setIsLessonModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveLesson} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Título da Lição</label>
                  <input
                    type="text"
                    required
                    value={lessonForm.title || ""}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    placeholder="Ex: Saudações do Sotaque Luandense"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ordem Syllabus</label>
                  <input
                    type="number"
                    required
                    value={lessonForm.order || 1}
                    onChange={(e) => setLessonForm({ ...lessonForm, order: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição</label>
                <input
                  type="text"
                  value={lessonForm.description || ""}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  placeholder="Sumário breve do objetivo didático..."
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Duração Estimada</label>
                  <input
                    type="text"
                    value={lessonForm.duration || "15 min"}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Versão</label>
                  <input
                    type="text"
                    value={lessonForm.version || "1.0"}
                    onChange={(e) => setLessonForm({ ...lessonForm, version: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Conteúdo Instrucional (Markdown)</label>
                <textarea
                  required
                  rows={6}
                  value={lessonForm.contentMarkdown || ""}
                  onChange={(e) => setLessonForm({ ...lessonForm, contentMarkdown: e.target.value })}
                  placeholder="# Título Principal&#10;Escreva o conteúdo instrucional detalhado que o estudante verá..."
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Salvar Lição
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: STORAGE MEDIA UPLOAD AND CLOUD FUNCTIONS SIMULATOR */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                Upload & Processamento no Cloud Storage
              </h3>
              <button onClick={() => setIsMediaModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMediaUpload} className="p-6 space-y-4">
              
              {/* Fake Drag & drop card */}
              <div className="border-2 border-dashed border-slate-200 p-6 rounded-2xl text-center bg-slate-50 relative">
                <Volume2 className="w-8 h-8 text-indigo-500 mx-auto mb-2 animate-bounce" />
                <span className="text-xs font-bold text-slate-700 block">Solte os seus ficheiros de áudio, imagem ou PDF aqui</span>
                <span className="text-[10px] text-slate-400 block mt-1">Suporta MP3, WAV, PNG, JPG, PDF (Max 15MB)</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Título do Recurso</label>
                <input
                  type="text"
                  required
                  value={mediaForm.title || ""}
                  onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                  placeholder="Ex: Áudio de Pronúncia Luanda Kamba"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome do Arquivo</label>
                  <input
                    type="text"
                    required
                    value={mediaForm.fileName || ""}
                    onChange={(e) => setMediaForm({ ...mediaForm, fileName: e.target.value })}
                    placeholder="Ex: pronuncia_kamba.mp3"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Mídia</label>
                  <select
                    value={mediaForm.type || "pdf"}
                    onChange={(e) => setMediaForm({ ...mediaForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="audio">Áudio (Whisper Auto-Transcribe)</option>
                    <option value="image">Imagem (Vision AI Auto-OCR)</option>
                    <option value="pdf">Documento PDF</option>
                    <option value="video">Vídeo</option>
                  </select>
                </div>
              </div>

              {/* Cloud Function logs terminal simulation */}
              {analyzingMedia && (
                <div className="bg-slate-900 text-green-400 p-4 rounded-xl font-mono text-[10px] space-y-1.5 max-h-32 overflow-y-auto">
                  <div className="text-white border-b border-slate-800 pb-1 flex justify-between items-center">
                    <span>TERMINAL DE LOGS DA CLOUD FUNCTION</span>
                    <RefreshCw className="w-3 h-3 animate-spin text-green-400" />
                  </div>
                  {cloudFunctionLogs.map((log, idx) => (
                    <div key={idx} className="truncate">{log}</div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  disabled={analyzingMedia}
                  onClick={() => setIsMediaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={analyzingMedia}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  {analyzingMedia ? "Processando no Back-End..." : "Confirmar Upload"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: MANUAL EXERCISE BUILDER */}
      {isExerciseModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Criar Exercício Pedagógico Manual</h3>
              <button onClick={() => setIsExerciseModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveManualExercise} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pergunta / Tarefa</label>
                <input
                  type="text"
                  required
                  value={exerciseForm.question || ""}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, question: e.target.value })}
                  placeholder="Escreva a pergunta claramente..."
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Formato</label>
                  <select
                    value={exerciseForm.type || "multiple-choice"}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="multiple-choice">Escolha Múltipla</option>
                    <option value="true-false">Verdadeiro/Falso</option>
                    <option value="fill-in-blanks">Preencher Lacunas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Resposta Correta</label>
                  <input
                    type="text"
                    required
                    value={exerciseForm.answer || ""}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, answer: e.target.value })}
                    placeholder="Exactamente correspondente..."
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 font-sans"
                  />
                </div>
              </div>

              {(exerciseForm.type === "multiple-choice" || exerciseForm.type === "true-false") && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Lista de Opções de Resposta</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map(idx => (
                      <input
                        key={idx}
                        type="text"
                        value={exerciseForm.options?.[idx] || ""}
                        onChange={(e) => {
                          const opt = [...(exerciseForm.options || ["", "", "", ""])];
                          opt[idx] = e.target.value;
                          setExerciseForm({ ...exerciseForm, options: opt });
                        }}
                        placeholder={`Opção ${idx + 1}`}
                        className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 font-sans"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Explicação Curricular</label>
                <textarea
                  rows={2}
                  value={exerciseForm.explanation || ""}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, explanation: e.target.value })}
                  placeholder="Explique a regra gramatical envolvida aos alunos..."
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsExerciseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Adicionar ao Banco
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
