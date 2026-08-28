import { auth } from '../firebase';
import { AssessmentRepository } from '../repositories/assessment.repository';
import { Exam, ScheduledExam, ExamAttempt, Certificate } from '../types/assessment';

export class AssessmentService {
  private repository = new AssessmentRepository();

  private async getAuthHeaders(): Promise<HeadersInit> {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  isOnline(): boolean {
    return typeof window !== 'undefined' && window.navigator ? window.navigator.onLine : true;
  }

  // --- EXAMS & QUESTION BANKS ---
  async getExams(): Promise<Exam[]> {
    if (this.isOnline()) {
      try {
        const headers = await this.getAuthHeaders();
        const res = await fetch('/api/assessment/exams', { headers });
        if (res.ok) {
          const list = await res.json();
          for (const ex of list) {
            await this.repository.saveExam(ex);
          }
          return list;
        }
      } catch (err) {
        console.warn('[AssessmentService] getExams server failure, loading cache:', err);
      }
    }
    return this.repository.getExams();
  }

  // --- SCHEDULED EXAMS ---
  async getScheduledExams(): Promise<ScheduledExam[]> {
    const user = auth.currentUser;
    if (!user) return [];

    if (this.isOnline()) {
      try {
        const headers = await this.getAuthHeaders();
        const res = await fetch('/api/assessment/scheduled', { headers });
        if (res.ok) {
          const list = await res.json();
          for (const s of list) {
            await this.repository.saveScheduledExam(s);
          }
          return list;
        }
      } catch (err) {
        console.warn('[AssessmentService] getScheduledExams server failure:', err);
      }
    }
    return this.repository.getScheduledExams(user.uid);
  }

  async scheduleExam(examId: string, title: string, className?: string, dueDate?: string): Promise<ScheduledExam> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/assessment/schedule', {
      method: 'POST',
      headers,
      body: JSON.stringify({ examId, title, className, dueDate })
    });

    if (!res.ok) {
      throw new Error("Não foi possível agendar o exame.");
    }

    const scheduled: ScheduledExam = await res.json();
    await this.repository.saveScheduledExam(scheduled);
    return scheduled;
  }

  // --- EXAM SUBMISSION & GRADING ---
  async submitExam(examId: string, submissions: { questionId: string; value: string }[], studentName?: string): Promise<{ attempt: ExamAttempt; certificate?: Certificate }> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    if (!this.isOnline()) {
      throw new Error("A avaliação exige conexão para correção segura. As respostas não foram submetidas.");
    }

    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/assessment/submit', {
      method: 'POST',
      headers,
      body: JSON.stringify({ examId, submissions, studentName })
    });

    if (!res.ok) {
      throw new Error("Erro na submissão de respostas.");
    }

    const result = await res.json();
    await this.repository.saveAttempt(result.attempt);
    if (result.certificate) {
      await this.repository.saveCertificate(result.certificate);
    }
    return result;
  }

  // --- GET RESULT ATTEMPTS ---
  async getAttempts(): Promise<ExamAttempt[]> {
    const user = auth.currentUser;
    if (!user) return [];
    return this.repository.getAttempts(user.uid);
  }

  // --- CERTIFICATES ---
  async getCertificates(): Promise<Certificate[]> {
    const user = auth.currentUser;
    if (!user) return [];

    if (this.isOnline()) {
      try {
        const headers = await this.getAuthHeaders();
        const res = await fetch('/api/assessment/certificates', { headers });
        if (res.ok) {
          const list = await res.json();
          for (const c of list) {
            await this.repository.saveCertificate(c);
          }
          return list;
        }
      } catch (err) {
        console.warn('[AssessmentService] Error fetching certificates from server:', err);
      }
    }
    return this.repository.getCertificates(user.uid);
  }
}
