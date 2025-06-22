import type { ReactNode } from "react";
import Center from "../components/Center";

function PageLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href}>
      <button className="outline">{children}</button>
    </a>
  );
}

type IPageLink = {
  href: string;
  label: string;
};

const pageLinks: IPageLink[] = [
  {
    href: "/tasks",
    label: "Tasks",
  },
  {
    href: "/timer",
    label: "Timer",
  },
  {
    href: "/history",
    label: "History",
  },
  {
    href: "/analytics",
    label: "Analytics",
  },
  {
    href: "/settings",
    label: "Settings",
  },
];

function HomePage() {
  return (
    <Center>
      <h1>✨ Lock In ✨</h1>
      <p>Yan&apos;s simple, local tool to help you lock the fuck in 😭😔</p>
      <hr />
      <div className="space-x-2">
        {pageLinks.map((p) => (
          <PageLink key={p.href} href={`/dash${p.href}`}>
            {p.label}
          </PageLink>
        ))}
      </div>
    </Center>
  );
}

export default HomePage;
