export default function WorkspaceShellFallback() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8)_0%,_rgba(244,245,249,1)_45%,_rgba(244,245,249,1)_100%)] p-6 lg:p-8">
      <div className="mx-auto w-full max-w-6xl animate-pulse space-y-5">
        <div className="h-9 w-56 rounded-xl bg-neutral-200" />
        <div className="h-28 rounded-2xl bg-neutral-200" />
        <div className="h-24 rounded-2xl bg-neutral-200" />
        <div className="h-24 rounded-2xl bg-neutral-200" />
      </div>
    </div>
  );
}
