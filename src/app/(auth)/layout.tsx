import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 px-4">
      <Link href="/" className="mb-8 font-semibold text-xl tracking-tight">
        QuizGen
      </Link>
      {children}
    </div>
  );
}
