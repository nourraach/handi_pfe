import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="page-shell">{children}</div>;
}