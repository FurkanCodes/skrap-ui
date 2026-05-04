import Logo from "@/assets/marketing/logo";
import { Separator } from "@/components/ui/separator";
import type { CSSProperties } from "react";

const lightLogoVars = {
  "--brand-logo-accent": "#918df6",
  "--brand-logo-wordmark": "#181925",
  "--brand-logo-cutout": "#ffffff",
} as CSSProperties;

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.791 2.188 8.46 5.996 5.58 2.188H1.408l4.984 6.518-4.723 5.399H3.69l3.646-4.166 3.187 4.166h4.068l-5.196-6.87 4.417-5.047zm-.71 10.707L3.77 3.335h1.2l7.23 9.56z" fill="currentColor" />
  </svg>
);

const LinkedinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#footer01-linkedin-clip)">
      <path d="M13.633 13.633h-2.37V9.92c0-.885-.017-2.025-1.234-2.025-1.235 0-1.424.965-1.424 1.96v3.778h-2.37V5.998H8.51v1.043h.031a2.5 2.5 0 0 1 2.246-1.233c2.403 0 2.846 1.58 2.846 3.637zM3.56 4.954a1.376 1.376 0 1 1 0-2.751 1.376 1.376 0 0 1 0 2.751m1.185 8.679H2.372V5.998h2.373zM14.815.001H1.18A1.17 1.17 0 0 0 0 1.154v13.691A1.17 1.17 0 0 0 1.18 16h13.635A1.17 1.17 0 0 0 16 14.845V1.153A1.17 1.17 0 0 0 14.815 0" fill="currentColor" />
    </g>
    <defs>
      <clipPath id="footer01-linkedin-clip">
        <path d="M0 0h16v16H0z" />
      </clipPath>
    </defs>
  </svg>
);

const TelegramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.14 4.03c.25-.1.53.12.47.39l-2.39 11.25c-.05.23-.3.35-.51.24l-3.29-1.71-1.68 1.61c-.2.2-.55.06-.55-.22v-2.43L14 8.25c.16-.16-.03-.42-.23-.31L7.6 11.7 3.83 10.5c-.24-.08-.25-.41-.01-.5l13.32-5.97Z"
      fill="currentColor"
    />
  </svg>
);

type FooterData = {
  title: string;
  links: {
    title: string;
    href: string;
  }[];
};

const footerSections: FooterData[] = [
  {
    title: "Product",
    links: [
      {
        title: "Features",
        href: "#features",
      },
      {
        title: "Pricing",
        href: "#pricing",
      },
      {
        title: "FAQs",
        href: "#faq",
      },
      {
        title: "Dashboard",
        href: "/dashboard",
      },
    ],
  },
  {
    title: "Company",
    links: [
      {
        title: "Sign in",
        href: "/auth/sign-in?next=/dashboard",
      },
      {
        title: "Create account",
        href: "/auth/sign-up?next=/dashboard",
      },
      {
        title: "Contact",
        href: "mailto:hello@dealvinci.com",
      },
      {
        title: "Support FAQ",
        href: "#faq",
      },
    ],
  },
  {
    title: "Legal",
    links: [
      {
        title: "Terms of Service",
        href: "/terms",
      },
      {
        title: "Privacy Policy",
        href: "/privacy",
      },
      {
        title: "Refund Policy",
        href: "/refund-policy",
      },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="bg-canvas-white py-10 font-openrunde">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:gap-12">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 rounded-3xl bg-[#00000008] px-6 py-10 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12">
            <div className="col-span-full lg:col-span-4">
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                <a href="#home" className="flex items-center">
                  <Logo style={lightLogoVars} />
                </a>

                <p className="max-w-sm text-body font-medium leading-body text-medium-gray">
                  Dealvinci is the credits-and-tiers price tracking platform for
                  operators who need reliable monitoring and instant Telegram alerts.
                </p>

                <div className="flex items-center gap-4">
                  <a
                    href="#pricing"
                    aria-label="Jump to pricing"
                    className="text-muted-gray transition-colors hover:text-slate-ink"
                  >
                    <TwitterIcon />
                  </a>
                  <a
                    href="#faq"
                    aria-label="Jump to FAQ"
                    className="text-muted-gray transition-colors hover:text-slate-ink"
                  >
                    <LinkedinIcon />
                  </a>
                  <a
                    href="mailto:hello@dealvinci.com"
                    aria-label="Email Dealvinci"
                    className="text-muted-gray transition-colors hover:text-slate-ink"
                  >
                    <TelegramIcon />
                  </a>
                </div>
              </div>
            </div>

            {footerSections.map(({ title, links }, index) => (
              <div key={index} className="col-span-2">
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                  <p className="text-body font-semibold leading-body text-slate-ink">
                    {title}
                  </p>
                  <ul className="flex flex-col gap-3">
                    {links.map(({ title, href }) => (
                      <li key={title}>
                        <a
                          href={href}
                          className="text-body font-medium leading-body text-medium-gray transition-colors hover:text-slate-ink"
                        >
                          {title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            <div className="col-span-2">
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                <p className="text-body font-semibold leading-body text-slate-ink">
                  Contact
                </p>
                <ul className="flex flex-col gap-3">
                  <li>
                    <p className="text-body font-medium leading-body text-medium-gray">
                      Built for global ecommerce and sourcing teams
                    </p>
                  </li>
                  <li>
                    <a
                      href="mailto:hello@dealvinci.com"
                      className="text-body font-medium leading-body text-medium-gray transition-colors hover:text-slate-ink"
                    >
                      hello@dealvinci.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <Separator orientation="horizontal" className="bg-light-gray" />
          <p className="text-center text-caption font-medium leading-caption text-muted-gray animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
            ©2026 Dealvinci. All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
