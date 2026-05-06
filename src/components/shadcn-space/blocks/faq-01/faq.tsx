import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { MARKETING_PRICING_FAQ } from "@/components/shadcn-space/blocks/pricing-content";
import { IconPlus } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export default function Faq() {
  return (
    <section className="bg-background py-14 font-openrunde sm:py-16">
      <div className="mx-auto flex max-w-xl flex-col gap-10 px-5">
        <div className="flex flex-col items-center gap-5 text-center animate-in fade-in slide-in-from-top-10 duration-1000 delay-100 ease-in-out fill-mode-both">
          <Badge
            variant="outline"
            className="h-auto rounded-sm border-0 bg-bg-a1 px-3 py-1.5 text-caption font-semibold uppercase leading-none text-fg-1 outline-0"
          >
            FAQs
          </Badge>
          <h2 className="max-w-md text-4xl font-semibold leading-[1.1] tracking-tight text-fg-4 sm:text-[44px]">
            Questions before you start tracking?
          </h2>
        </div>
        <div>
          <Accordion className="flex w-full flex-col gap-1">
            {MARKETING_PRICING_FAQ.map((faq, index) => (
              <AccordionItem
                key={`item-${index}`}
                value={`item-${index}`}
                className={cn(
                  "group/item flex flex-col gap-3 rounded-lg border border-transparent bg-bg-a1 p-4 transition-colors data-[open]:bg-bg-a2 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both",
                  index === 0 && "delay-100",
                  index === 1 && "delay-200",
                  index === 2 && "delay-300",
                  index === 3 && "delay-400",
                  index === 4 && "delay-500",
                )}
              >
                <AccordionTrigger className="cursor-pointer p-0 text-left text-body font-semibold leading-body text-fg-4 hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden">
                  {faq.question}
                  <IconPlus className="h-5 w-5 shrink-0 text-electric-blue transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-45" stroke={1.5} />
                </AccordionTrigger>
                <AccordionContent className="p-0 text-body leading-body text-fg-3">
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
