import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { MARKETING_PRICING_FAQ } from "@/components/shadcn-space/blocks/pricing-content";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Faq() {
  return (
    <section className="bg-canvas-white py-16 font-openrunde sm:py-20 lg:py-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-5 text-center animate-in fade-in slide-in-from-top-10 duration-1000 delay-100 ease-in-out fill-mode-both">
          <Badge
            variant="outline"
            className="h-auto border-0 bg-[#00000008] px-3 py-1.5 text-caption font-semibold uppercase leading-none text-muted-gray outline-0"
          >
            FAQs
          </Badge>
          <h2 className="max-w-xl text-4xl font-bold leading-[1.08] text-slate-ink sm:text-5xl">
            Questions before you start tracking?
          </h2>
        </div>
        <div>
          <Accordion className="flex w-full flex-col gap-3">
            {MARKETING_PRICING_FAQ.map((faq, index) => (
              <AccordionItem
                key={`item-${index}`}
                value={`item-${index}`}
                className={cn(
                  "group/item flex flex-col gap-3 rounded-2xl border border-transparent bg-[#00000008] p-5 transition-colors data-[open]:bg-whisper-purple/45 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both",
                  index === 0 && "delay-100",
                  index === 1 && "delay-200",
                  index === 2 && "delay-300",
                  index === 3 && "delay-400",
                  index === 4 && "delay-500",
                )}
              >
                <AccordionTrigger className="cursor-pointer p-0 text-left text-heading-sm font-semibold leading-heading-sm text-slate-ink hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden">
                  {faq.question}
                  <PlusIcon className="h-5 w-5 shrink-0 text-radiant-violet transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-45" />
                </AccordionTrigger>
                <AccordionContent className="p-0 text-body leading-body text-medium-gray">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
