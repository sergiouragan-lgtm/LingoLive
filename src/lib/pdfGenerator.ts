import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { TranscriptItem, SavedWord, FeedbackReport } from "../types";

export const generateCertificate = (
  userName: string,
  transcript: TranscriptItem[],
  savedWords: SavedWord[],
  feedback?: FeedbackReport
) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(`Relatório de Progresso - ${userName}`, 14, 22);

  doc.setFontSize(12);
  doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 30);

  // Feedback Summary
  let currentY = 40;
  if (feedback) {
    doc.setFontSize(14);
    doc.text("Resumo do Feedback da Sessão", 14, currentY + 5);
    doc.setFontSize(10);
    doc.text(`Pontuação Geral: ${feedback.overallScore}/100`, 14, currentY + 12);
    doc.text(`Nível de Fluência: ${feedback.fluencyLevel}`, 14, currentY + 18);
    
    // AutoTable for grammar mistakes
    if (feedback.grammarMistakes && feedback.grammarMistakes.length > 0) {
      autoTable(doc, {
        startY: currentY + 25,
        head: [["Original", "Corrigido", "Explicação"]],
        body: feedback.grammarMistakes.map(m => [m.original, m.corrected, m.explanation]),
      });
      currentY = (doc as any).lastAutoTable.finalY;
    } else {
        currentY += 20;
    }
  }

  // Saved Words
  doc.setFontSize(14);
  doc.text("Vocabulário Salvo", 14, currentY + 10);
  
  autoTable(doc, {
    startY: currentY + 15,
    head: [["Palavra", "Significado", "Exemplo"]],
    body: savedWords.map(w => [w.word, w.meaning, w.exampleOriginal]),
  });

  doc.save(`Relatorio_Progresso_${userName.replace(" ", "_")}.pdf`);
};
