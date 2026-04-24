import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

export interface LegalSection {
  id: string;
  label: string;
  title: string;
  children: ReactNode;
}

interface LegalDocumentProps {
  eyebrow: string;
  title: string;
  description: string;
  effectiveDate: string;
  sections: LegalSection[];
}

export function LegalDocument({
  eyebrow,
  title,
  description,
  effectiveDate,
  sections,
}: LegalDocumentProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:py-16">
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to home
          </Link>
          <nav aria-label={`${title} sections`} className="mt-8 hidden lg:block">
            <ol className="space-y-3 text-sm text-muted-foreground">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="transition-colors hover:text-foreground"
                  >
                    <span className="font-medium text-foreground/80">{section.label}</span>{" "}
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="min-w-0">
          <header className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">{description}</p>
            <p className="mt-6 text-sm font-medium text-foreground">
              Effective date: {effectiveDate}
            </p>
          </header>

          <div className="mt-12 space-y-12">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-10 border-t border-border/70 pt-8"
              >
                <div className="grid gap-5 sm:grid-cols-[4rem_minmax(0,1fr)]">
                  <p className="text-sm font-semibold text-primary">{section.label}</p>
                  <div className="max-w-3xl">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                      {section.title}
                    </h2>
                    <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
                      {section.children}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>;
}
