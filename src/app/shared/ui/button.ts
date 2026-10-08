import { Directive, computed, input } from "@angular/core";
import { cva, type VariantProps } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { cn } from "../../../lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "rounded-[5px] border-0 bg-(--teal) px-5 py-3 text-[16px] font-medium text-white hover:bg-[#009c80]",
        outline: "border border-(--line) bg-white text-(--text) hover:bg-[#f8fafc]",
        ghost: "bg-transparent",
        link: "text-(--teal) underline-offset-4 hover:underline",
      },
      size: {
        default: "",
        sm: "",
        lg: "",
        icon: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

/**
 * Button styles for `<button>` and `<a>` elements alike (replaces the `asChild` pattern).
 * The element's own `class` is merged last, so it can override variant classes.
 */
@Directive({
  selector: "button[appButton], a[appButton]",
  host: {
    "data-slot": "button",
    "[class]": "classes()",
  },
})
export class Button {
  readonly variant = input<ButtonVariants["variant"]>("default");
  readonly size = input<ButtonVariants["size"]>("default");
  readonly userClass = input<ClassValue>("", { alias: "class" });

  protected readonly classes = computed(() =>
    cn(buttonVariants({ variant: this.variant(), size: this.size() }), this.userClass()),
  );
}
