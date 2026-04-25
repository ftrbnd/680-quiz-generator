import { NextRequest, NextResponse } from "next/server";
import { parseExportQuizId } from "@/lib/api/request_validation";
import { auth } from "@/lib/auth/auth";
import { getQuizWithQuestions } from "@/services/quiz_service";
import { exportQuizPdf } from "@/services/export_service";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: true, code: "UNAUTHORIZED", message: "Sign in required" }, { status: 401 });
    }

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
    if (quiz.visibility === "PRIVATE" && quiz.ownerId !== session.user.id) {
      return NextResponse.json({ error: true, code: "FORBIDDEN", message: "You do not have access to this quiz" }, { status: 403 });
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
