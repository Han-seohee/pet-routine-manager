import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        하루멍냥
      </h1>
      <Link className={cn(buttonVariants())} href="/login">
        로그인
      </Link>
    </main>
  );
}
