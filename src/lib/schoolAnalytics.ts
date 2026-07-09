export interface Student {
  id: string;
  name: string;
  photo: string;
  classId: string;
  year: number;
  course: string;
  languages: string[];
  level: string;
  xp: number;
  attendance: number;
  grade: number;
  aiSessionsCount?: number;
  lastActiveDaysAgo?: number;
}

export interface AtRiskStudentAlert {
  id: string;
  name: string;
  avatar: string;
  classId: string;
  grade: number;
  attendance: number;
  aiSessionsCount: number;
  riskLevel: 'critical' | 'warning';
  reason: string;
}

export interface AnalysisOptions {
  gradeThreshold?: number;      // defaults to 70
  attendanceThreshold?: number; // defaults to 85
  aiSessionsThreshold?: number; // defaults to 5
}

/**
 * Processes list of students to flag students at pedagogical or attendance risk.
 * 
 * Criteria:
 * - Critical: Grade below threshold AND attendance below threshold.
 * - Warning: Either grade below threshold OR attendance below threshold OR very low AI sessions.
 */
export function getAtRiskStudents(
  students: Student[],
  options: AnalysisOptions = {}
): AtRiskStudentAlert[] {
  const gradeLimit = options.gradeThreshold ?? 70;
  const attendanceLimit = options.attendanceThreshold ?? 85;
  const aiLimit = options.aiSessionsThreshold ?? 5;

  return students
    .map(student => {
      const grade = student.grade;
      const attendance = student.attendance;
      const aiSessions = student.aiSessionsCount ?? Math.floor(Math.random() * 15); // Fallback for dynamic demo
      const daysAgo = student.lastActiveDaysAgo ?? Math.floor(Math.random() * 10);

      const isLowGrade = grade < gradeLimit;
      const isLowAttendance = attendance < attendanceLimit;
      const isLowAi = aiSessions < aiLimit;

      let riskLevel: 'critical' | 'warning' | null = null;
      let reason = '';

      if (isLowGrade && isLowAttendance) {
        riskLevel = 'critical';
        reason = `Insuficiência académica crítica (${grade}%) combinada com baixa assiduidade presencial (${attendance}%).`;
      } else if (isLowGrade) {
        riskLevel = 'warning';
        reason = `Desempenho escolar abaixo da meta mínima recomendada (${grade}%). Necessita de reforço personalizado.`;
      } else if (isLowAttendance) {
        riskLevel = 'warning';
        reason = `Frequência escolar reduzida (${attendance}%). Risco potencial de descomprometimento académico.`;
      } else if (isLowAi && daysAgo > 7) {
        riskLevel = 'warning';
        reason = `Inatividade prolongada nas lições autónomas de IA (Último acesso há ${daysAgo} dias).`;
      }

      if (!riskLevel) return null;

      return {
        id: student.id,
        name: student.name,
        avatar: student.photo,
        classId: student.classId,
        grade,
        attendance,
        aiSessionsCount: aiSessions,
        riskLevel,
        reason
      };
    })
    .filter((alert): alert is AtRiskStudentAlert => alert !== null);
}
