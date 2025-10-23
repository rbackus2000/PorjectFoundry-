import { ReactNode } from "react";

export default function CanvasLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full">
      {children}
    </div>
  );
}
