import { Directive, computed, input } from "@angular/core";
import { cva, type VariantProps } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { cn } from "../../../lib/utils";

export const badgeVariants = cva("inline-flex items-center justify-center font-semibold", {
  variants: {
    variant: {
      default: "bg-(--teal) text-white",
      muted: "bg-[#fee2e2] text-[#ef4444]",
      outline: "border border-(--line) text-(--text)",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

@Directive({
  selector: "span[appBadge]",
  host: {
    "data-slot": "badge",
    "[class]": "classes()",
  },
})
export class Badge {
  readonly variant = input<VariantProps<typeof badgeVariants>["variant"]>("default");
  readonly userClass = input<ClassValue>("", { alias: "class" });

  protected readonly classes = computed(() => cn(badgeVariants({ variant: this.variant() }), this.userClass()));
}
