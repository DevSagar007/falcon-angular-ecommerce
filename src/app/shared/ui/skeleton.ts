import { Directive, computed, input } from "@angular/core";
import type { ClassValue } from "clsx";
import { cn } from "../../../lib/utils";

@Directive({
  selector: "div[appSkeleton]",
  host: {
    "data-slot": "skeleton",
    "[class]": "classes()",
  },
})
export class Skeleton {
  readonly userClass = input<ClassValue>("", { alias: "class" });

  protected readonly classes = computed(() => cn("animate-pulse bg-accent", this.userClass()));
}
