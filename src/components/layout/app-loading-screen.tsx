import Image from "next/image";
import styles from "@/components/layout/app-loading-screen.module.css";

interface AppLoadingScreenProps {
  message?: string;
  detail?: string;
}

export default function AppLoadingScreen({
  message = "Loading page...",
  detail = "Preparing your experience",
}: AppLoadingScreenProps) {
  return (
    <div className={`min-h-[100svh] bg-background px-4 py-8 ${styles.screenEnter}`}>
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-4xl flex-col items-center justify-center gap-5">
        <div className={styles.illustrationWrap}>
          <Image
            src="/illustrations/fast-loading.svg"
            alt="Fast loading illustration"
            width={560}
            height={560}
            className={`h-auto w-full max-w-[560px] ${styles.illustration}`}
            loading="eager"
            priority
          />
        </div>
        <div className="space-y-2 text-center" aria-live="polite">
          <p className="text-base font-medium text-foreground">{message}</p>
          <div className={styles.progressRail} aria-hidden="true" />
          <p className="text-xs text-muted-foreground">
            {detail}
            <span className={styles.ellipsis} aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
