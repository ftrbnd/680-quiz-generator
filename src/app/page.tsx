import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-lg tracking-tight">QuizGen</span>
        <div className="flex gap-3">
          <Button variant="ghost" render={<Link href="/login" />}>
            Sign in
          </Button>
          <Button render={<Link href="/register" />}>Get started</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-6">
        <Badge variant="secondary" className="mb-2">Powered by Claude AI</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl leading-tight">
          Turn your notes into a quiz in seconds
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          Upload a PDF, PowerPoint, or text file. QuizGen uses Claude to generate
          multiple-choice, short-answer, fill-in-the-blank, and reading comprehension
          questions — with full LaTeX support for math courses.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Button size="lg" render={<Link href="/register" />}>
            Create free account
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/login" />}>
            Sign in
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/40 px-6 py-16">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
          {[
            { title: "Multiple file types", body: "Upload .pdf, .pptx, or .txt files from any course." },
            { title: "Fully configurable", body: "Set question count, type, difficulty, and time limit." },
            { title: "Export ready", body: "Download a PDF quiz + answer key to use anywhere." },
          ].map((f) => (
            <div key={f.title} className="flex flex-col gap-2">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} QuizGen
      </footer>
    </main>
  );
}
