import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { WORKFLOW_STEPS } from "@/lib/intents";

export function WorkflowTimeline({ active }: { active: number }) {
  return (
    <ol className="space-y-2">
      {WORKFLOW_STEPS.map((label, i) => {
        const done = i < active;
        const live = i === active;
        return (
          <motion.li
            key={label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3"
          >
            <span
              className={
                "grid h-7 w-7 shrink-0 place-items-center rounded-full " +
                (done
                  ? "bg-accent text-accent-foreground"
                  : live
                  ? "bg-walnut text-background"
                  : "bg-muted text-muted-foreground")
              }
            >
              {done ? <Check className="h-4 w-4" /> : live ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-xs">{i + 1}</span>}
            </span>
            <span className={"text-sm " + (done ? "text-foreground" : live ? "text-foreground font-medium" : "text-muted-foreground")}>{label}</span>
            {live && (
              <motion.span
                className="ml-auto h-1 w-24 overflow-hidden rounded-full bg-muted"
                aria-hidden
              >
                <motion.span
                  className="block h-full bg-accent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                />
              </motion.span>
            )}
          </motion.li>
        );
      })}
    </ol>
  );
}
