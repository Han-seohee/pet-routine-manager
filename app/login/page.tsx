import { PawPrint } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getGoogleLoginUrl, getKakaoLoginUrl } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-[oklch(0.985_0.012_80)] px-5 py-12">
      <div className="flex w-full max-w-[22rem] flex-col items-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[oklch(0.94_0.03_75)] text-[oklch(0.48_0.08_55)]"
            aria-hidden="true"
          >
            <PawPrint className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[oklch(0.28_0.025_50)]">
            하루멍냥
          </h1>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-[oklch(0.5_0.03_55)]">
            우리 아이의 하루를 함께 기록해요.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <a
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 w-full rounded-xl border-border/80 bg-white text-[0.9375rem] font-medium text-foreground hover:bg-[oklch(0.97_0.008_80)]",
            )}
            href={getGoogleLoginUrl()}
          >
            Google로 로그인
          </a>
          <a
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 w-full rounded-xl bg-[#FEE500] text-[0.9375rem] font-medium text-[#191919] hover:bg-[#F5DC00]",
            )}
            href={getKakaoLoginUrl()}
          >
            Kakao로 로그인
          </a>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-[oklch(0.58_0.02_60)]">
          가족과 함께 반려동물의 일상을 기록해보세요.
        </p>
      </div>
    </main>
  );
}
