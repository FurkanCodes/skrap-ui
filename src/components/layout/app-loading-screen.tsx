interface AppLoadingScreenProps {
  message?: string;
  detail?: string;
}

export default function AppLoadingScreen({
  message = "Loading page...",
  detail = "Preparing your experience",
}: AppLoadingScreenProps) {
  return (
    <div className="app-loading-screen min-h-[100svh] bg-background px-4 py-8 text-fg-4">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md items-center justify-center">
        <div
          className="w-full rounded-[28px] border border-border/60 bg-card/90 p-5 shadow-subtle-2 backdrop-blur-md"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <span className="app-loading-status-mark" aria-hidden="true">
              <span />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fg-4">{message}</p>
              <p className="mt-1 text-xs font-medium text-fg-1">
                {detail}
                <span className="app-loading-ellipsis" aria-hidden="true">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5" aria-hidden="true">
            <div className="app-loading-progress-rail" />
            <div className="mt-5 space-y-3">
              <div className="h-10 rounded-lg bg-bg-2" />
              <div className="grid grid-cols-[1fr_88px] gap-3">
                <div className="h-10 rounded-lg bg-bg-2" />
                <div className="h-10 rounded-full bg-bg-a1" />
              </div>
              <div className="h-20 rounded-lg bg-bg-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
