import { ScraperConsole } from "@/features/scraper/components/scraper-console";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
        <ScraperConsole />
      </main>
    </div>
  );
}
