import { jsPDF } from "jspdf";
import { StreakData, Achievement } from "../types";

export const generateWeeklyReportPDF = (
  studentName: string,
  weeklyMinutes: number,
  streakCount: number,
  achievements: Achievement[]
) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(`Relatório Semanal: ${studentName}`, 20, 20);
  
  doc.setFontSize(14);
  doc.text(`Data: ${new Date().toLocaleDateString()}`, 20, 30);
  
  doc.setFontSize(12);
  doc.text(`Total de minutos praticados esta semana: ${weeklyMinutes}`, 20, 45);
  doc.text(`Sequência atual: ${streakCount} dias`, 20, 55);
  
  doc.text("Conquistas Recentes:", 20, 70);
  const unlocked = achievements.filter(a => a.unlockedAt);
  unlocked.forEach((a, i) => {
    doc.text(`- ${a.title}`, 25, 80 + (i * 10));
  });
  
  doc.save(`Relatorio_Semanal_${studentName}.pdf`);
};
