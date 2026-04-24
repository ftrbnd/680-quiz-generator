import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { NavBar } from "@/components/nav_bar";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const user = session.user as { name: string; role?: string };
  if (user.role !== "TEACHER") redirect("/student");

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar userName={user.name ?? "Teacher"} role="TEACHER" />
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">{children}</main>
    </div>
  );
}
