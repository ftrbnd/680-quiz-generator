import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Quiz } from "@/types/quiz";

export function exportQuizPdf({ quiz }: { quiz: Quiz }): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(quiz.title, pageWidth / 2, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Type: ${quiz.quizType.replace(/_/g, " ")}  |  Difficulty: ${quiz.difficulty}`, pageWidth / 2, 30, {
    align: "center",
  });

  if (quiz.timeLimitMinutes) {
    doc.text(`Time Limit: ${quiz.timeLimitMinutes} minutes`, pageWidth / 2, 38, { align: "center" });
  }

  // Questions section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Questions", 14, 50);

  let yOffset = 58;
  quiz.questions.forEach((q, i) => {
    const questionText = `${i + 1}. ${q.body}`;
    const lines = doc.splitTextToSize(questionText, pageWidth - 28);

    if (yOffset + lines.length * 7 > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yOffset = 20;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(lines, 14, yOffset);
    yOffset += lines.length * 7 + 3;

    if (q.options) {
      q.options.forEach((opt) => {
        const optLine = `   ${opt.label}. ${opt.text}`;
        doc.text(optLine, 14, yOffset);
        yOffset += 6;
      });
    }
    yOffset += 4;
  });

  // Answer key section
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Answer Key", 14, 20);

  autoTable(doc, {
    startY: 28,
    head: [["#", "Correct Answer"]],
    body: quiz.questions.map((q, i) => [`${i + 1}`, q.correctAnswer]),
    styles: { font: "helvetica", fontSize: 10 },
    headStyles: { fillColor: [31, 78, 121] },
  });

  return Buffer.from(doc.output("arraybuffer"));
}
