import { NextRequest, NextResponse } from "next/server";
import { parseExportQuizId } from "@/lib/api/request_validation";
import { getQuizWithQuestions } from "@/services/quiz_service";
import { exportQuizPdf } from "@/services/export_service";

export async function GET(req: NextRequest) {
  try {
    const parsed = parseExportQuizId(req.nextUrl.searchParams);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: true, code: parsed.code, message: parsed.message },
        { status: parsed.status }
      );
    }
    const { quizId } = parsed;

    const quiz = await getQuizWithQuestions({ quizId });
    if (!quiz) {
      return NextResponse.json({ error: true, code: "NOT_FOUND", message: "Quiz not found" }, { status: 404 });
    }

    const pdfBuffer = exportQuizPdf({ quiz });
    const filename = quiz.title.replace(/[^a-z0-9]/gi, "_");

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch (err) {
    console.error({ level: "ERROR", component: "api/export", msg: err });
    return NextResponse.json({ error: true, code: "EXPORT_FAILED", message: "Export failed" }, { status: 500 });
  }
}
