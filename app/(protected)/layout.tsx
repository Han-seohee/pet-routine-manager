import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userId: string;

  try {
    const user = await getCurrentUser();
    userId = user.userId;
  } catch {
    redirect("/api/auth/logout");
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
        <p className="truncate text-sm text-muted-foreground">userId: {userId}</p>
        <a
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          href="/api/auth/logout"
        >
          로그아웃
        </a>
      </header>
      {children}
    </div>
  );
}
