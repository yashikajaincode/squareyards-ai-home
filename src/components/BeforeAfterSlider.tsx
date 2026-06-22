import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function BeforeAfterSlider({
  before,
  after,
  className,
}: {
  before: string;
  after: string;
  className?: string;
}) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);

  function onMove(clientX: number) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, x)));
  }

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden rounded-2xl select-none cursor-ew-resize bg-muted", className)}
      onMouseMove={(e) => e.buttons === 1 && onMove(e.clientX)}
      onMouseDown={(e) => onMove(e.clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
    >
      <img src={after} alt="After" className="block h-full w-full object-cover" draggable={false} />
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <img
          src={before}
          alt="Before"
          className="h-full w-full object-cover"
          style={{ width: `${ref.current?.clientWidth ?? 1000}px`, maxWidth: "none" }}
          draggable={false}
        />
      </div>
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 w-px bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,.15)]" />
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white text-walnut shadow-lg">
          <span className="text-xs">⇄</span>
        </div>
      </div>
      <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white">Before</div>
      <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-accent px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-accent-foreground">After</div>
    </div>
  );
}
