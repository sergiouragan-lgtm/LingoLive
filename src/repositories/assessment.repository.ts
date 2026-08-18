import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Exam, ScheduledExam, ExamAttempt, Certificate } from '../types/assessment';

export class AssessmentRepository {
  private examsCollection = 'assessment_exams';
  private scheduledCollection = 'assessment_scheduled';
  private attemptsCollection = 'assessment_attempts';
  private certificatesCollection = 'assessment_certificates';

  private getLocalKey(col: string, userId: string): string {
    return `lingolive_${col}_${userId}`;
  }

  // --- EXAMS / QUESTION BANK ---
  async getExams(): Promise<Exam[]> {
    try {
      const q = query(collection(db, this.examsCollection));
      const snap = await getDocs(q);
      const exams: Exam[] = [];
      snap.forEach(d => {
        exams.push(d.data() as Exam);
      });
      localStorage.setItem('lingolive_all_exams', JSON.stringify(exams));
      return exams;
    } catch (err) {
      console.warn('[AssessmentRepository] Firestore getExams error, loading cache:', err);
    }
    const cached = localStorage.getItem('lingolive_all_exams');
    return cached ? JSON.parse(cached) : [];
  }

  async saveExam(exam: Exam): Promise<void> {
    try {
      const docRef = doc(db, this.examsCollection, exam.id);
      await setDoc(docRef, exam, { merge: true });
    } catch (err) {
      console.warn('[AssessmentRepository] Firestore saveExam error:', err);
    }
  }

  // --- SCHEDULED EXAMS ---
  async getScheduledExams(userId: string): Promise<ScheduledExam[]> {
    try {
      const q = query(collection(db, this.scheduledCollection));
      const snap = await getDocs(q);
      const list: ScheduledExam[] = [];
      snap.forEach(d => {
        list.push(d.data() as ScheduledExam);
      });
      localStorage.setItem(this.getLocalKey(this.scheduledCollection, userId), JSON.stringify(list));
      return list;
    } catch (err) {
      console.warn('[AssessmentRepository] Firestore getScheduledExams error:', err);
    }
    const cached = localStorage.getItem(this.getLocalKey(this.scheduledCollection, userId));
    return cached ? JSON.parse(cached) : [];
  }

  async saveScheduledExam(sched: ScheduledExam): Promise<void> {
    try {
      const docRef = doc(db, this.scheduledCollection, sched.id);
      await setDoc(docRef, sched, { merge: true });
    } catch (err) {
      console.warn('[AssessmentRepository] Firestore saveScheduledExam error:', err);
    }
  }

  // --- ATTEMPTS / RESULT LOGS ---
  async getAttempts(userId: string): Promise<ExamAttempt[]> {
    try {
      const q = query(collection(db, this.attemptsCollection), where('userId', '==', userId));
      const snap = await getDocs(q);
      const list: ExamAttempt[] = [];
      snap.forEach(d => {
        list.push(d.data() as ExamAttempt);
      });
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      localStorage.setItem(this.getLocalKey(this.attemptsCollection, userId), JSON.stringify(list));
      return list;
    } catch (err) {
      console.warn('[AssessmentRepository] Firestore getAttempts error:', err);
    }
    const cached = localStorage.getItem(this.getLocalKey(this.attemptsCollection, userId));
    return cached ? JSON.parse(cached) : [];
  }

  async saveAttempt(attempt: ExamAttempt): Promise<void> {
    const userId = attempt.userId;
    const attempts = await this.getAttempts(userId);
    const updated = [attempt, ...attempts.filter(a => a.id !== attempt.id)];
    localStorage.setItem(this.getLocalKey(this.attemptsCollection, userId), JSON.stringify(updated));

    try {
      const docRef = doc(db, this.attemptsCollection, attempt.id);
      await setDoc(docRef, attempt, { merge: true });
    } catch (err) {
      console.warn('[AssessmentRepository] Firestore saveAttempt error:', err);
    }
  }

  // --- CERTIFICATES ---
  async getCertificates(userId: string): Promise<Certificate[]> {
    try {
      const q = query(collection(db, this.certificatesCollection), where('userId', '==', userId));
      const snap = await getDocs(q);
      const list: Certificate[] = [];
      snap.forEach(d => {
        list.push(d.data() as Certificate);
      });
      localStorage.setItem(this.getLocalKey(this.certificatesCollection, userId), JSON.stringify(list));
      return list;
    } catch (err) {
      console.warn('[AssessmentRepository] Firestore getCertificates error:', err);
    }
    const cached = localStorage.getItem(this.getLocalKey(this.certificatesCollection, userId));
    return cached ? JSON.parse(cached) : [];
  }

  async saveCertificate(cert: Certificate): Promise<void> {
    try {
      const docRef = doc(db, this.certificatesCollection, cert.id);
      await setDoc(docRef, cert, { merge: true });
    } catch (err) {
      console.warn('[AssessmentRepository] Firestore saveCertificate error:', err);
    }
  }
}
