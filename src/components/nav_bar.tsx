"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth_client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavBarProps {
  userName: string;
  role: "TEACHER" | "STUDENT";
}

export function NavBar({ userName, role }: NavBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const teacherLinks = [
    { href: "/teacher/quizzes", label: "My Quizzes" },
    { href: "/teacher/create", label: "Create Quiz" },
  ];
  const studentLinks = [
    { href: "/student", label: "Available Quizzes" },
    { href: "/student/practice/create", label: "Practice from notes" },
    { href: "/student/attempts", label: "My attempts" },
  ];
  const links = role === "TEACHER" ? teacherLinks : studentLinks;

  async function handleSignOut() {
    await authClient.signOut();
    toast.success("Signed out");
    router.push("/");
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href={role === "TEACHER" ? "/teacher/quizzes" : "/student"} className="font-semibold tracking-tight">
            QuizGen
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {links.map((l) => (
              <Button
                key={l.href}
                variant={pathname === l.href ? "secondary" : "ghost"}
                size="sm"
                render={<Link href={l.href} />}
              >
                {l.label}
              </Button>
            ))}
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-sm">
              <p className="font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground capitalize">{role.toLowerCase()}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
