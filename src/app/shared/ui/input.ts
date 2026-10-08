import { Directive, computed, input } from "@angular/core";
import type { ClassValue } from "clsx";
import { cn } from "../../../lib/utils";

@Directive({
  selector: "input[appInput]",
  host: {
    "data-slot": "input",
    "[class]": "classes()",
  },
})
export class Input {
  readonly userClass = input<ClassValue>("", { alias: "class" });

  protected readonly classes = computed(() =>
    cn(
      "h-10 w-full rounded-md border border-slate-300 bg-white px-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100",
      this.userClass(),
    ),
  );
}
