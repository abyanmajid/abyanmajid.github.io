import type { ReactNode } from "react";

function Center({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen text-center">
      <div>{children}</div>
    </div>
  );
}

export default Center;
