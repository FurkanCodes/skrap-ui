export { default as Link } from "next/link";
export { redirect, usePathname, useRouter } from "next/navigation";

export function getPathname({ href }: { href: string }) {
  return href;
}
