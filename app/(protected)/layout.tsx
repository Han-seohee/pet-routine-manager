import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api/auth";
import { LogoutButton } from "@/components/logout-button";

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
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">하루멍냥</p>
          <p className="truncate text-xs text-muted-foreground">
            userId: {userId}
          </p>
        </div>
        <LogoutButton />
      </header>
      {children}
    </div>
  );
}
