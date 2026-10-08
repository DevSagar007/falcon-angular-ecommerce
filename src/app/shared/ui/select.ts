import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { CdkConnectedOverlay, CdkOverlayOrigin, type ConnectedPosition } from "@angular/cdk/overlay";
import { CdkListbox, CdkOption, type ListboxValueChangeEvent } from "@angular/cdk/listbox";
import { Check, ChevronDown } from "lucide";
import type { ClassValue } from "clsx";
import { cn } from "../../../lib/utils";
import { Icon } from "./icon";

export type SelectOption = { value: string; label: string };

let nextId = 0;

const POSITIONS: ConnectedPosition[] = [
  { originX: "start", originY: "bottom", overlayX: "start", overlayY: "top", offsetY: 4 },
  { originX: "start", originY: "top", overlayX: "start", overlayY: "bottom", offsetY: -4 },
];

/**
 * Single-value select with a styled popup listbox (replaces Radix Select).
 * The trigger is a button with role="combobox"; the popup is a CDK listbox, which provides
 * arrow-key navigation, typeahead and aria-selected. Escape, Tab and outside clicks close it,
 * and focus returns to the trigger after a choice.
 */
@Component({
  selector: "app-select",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkOverlayOrigin, CdkConnectedOverlay, CdkListbox, CdkOption, Icon],
  host: { class: "contents" },
  template: `
    <button
      #trigger
      type="button"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      role="combobox"
      aria-haspopup="listbox"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? listboxId : null"
      [attr.aria-label]="ariaLabel()"
      data-slot="select-trigger"
      [class]="triggerClasses()"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
    >
      <span data-slot="select-value" class="pointer-events-none">{{ selectedLabel() }}</span>
      <svg [appIcon]="icons.ChevronDown" [size]="16" class="shrink-0 text-(--muted)"></svg>
    </button>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayMinWidth]="minWidth()"
      (overlayOutsideClick)="onOutsideClick($event)"
      (detach)="open.set(false)"
    >
      <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -- cdkListbox sets tabindex and manages focus -->
      <ul
        cdkListbox
        [id]="listboxId"
        [cdkListboxValue]="[value()]"
        (cdkListboxValueChange)="choose($event)"
        (keydown)="onListKeydown($event)"
        [attr.aria-label]="ariaLabel()"
        data-slot="select-content"
        class="z-60 m-0 max-h-80 list-none overflow-y-auto rounded border border-(--line) bg-white p-1 shadow-[0_10px_30px_rgba(15,23,42,.12)] outline-none"
      >
        @for (option of options(); track option.value) {
          <li
            [cdkOption]="option.value"
            data-slot="select-item"
            class="relative flex cursor-pointer items-center justify-between gap-2 rounded px-2.5 py-2 text-sm outline-none aria-selected:font-semibold aria-selected:text-(--teal) [&.cdk-option-active]:bg-slate-100 hover:bg-slate-100"
          >
            <span>{{ option.label }}</span>
            @if (option.value === value()) {
              <svg [appIcon]="icons.Check" [size]="14" class="inline-flex"></svg>
            }
          </li>
        }
      </ul>
    </ng-template>
  `,
})
export class Select {
  readonly value = input.required<string>();
  readonly options = input.required<SelectOption[]>();
  /** Text shown in the trigger; defaults to the selected option's label. */
  readonly display = input<string>();
  readonly ariaLabel = input<string | undefined>(undefined, { alias: "aria-label" });
  readonly triggerClass = input<ClassValue>("");
  readonly valueChange = output<string>();

  protected readonly icons = { Check, ChevronDown };
  protected readonly positions = POSITIONS;
  protected readonly listboxId = `select-listbox-${nextId++}`;
  protected readonly open = signal(false);
  protected readonly minWidth = signal(0);

  private readonly injector = inject(Injector);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>("trigger");
  private readonly listbox = viewChild(CdkListbox);

  protected readonly selectedLabel = computed(
    () => this.display() ?? this.options().find((option) => option.value === this.value())?.label ?? "",
  );
  protected readonly triggerClasses = computed(() =>
    cn(
      "inline-flex h-10 w-full items-center justify-between gap-2 rounded border border-(--line) bg-white px-2.25 text-(--text) outline-none focus:ring-2 focus:ring-(--teal)",
      this.triggerClass(),
    ),
  );

  protected toggle() {
    if (this.open()) this.close();
    else this.show();
  }

  protected onTriggerKeydown(event: KeyboardEvent) {
    if (!this.open() && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      this.show();
    }
  }

  protected onListKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
    } else if (event.key === "Tab") {
      this.open.set(false);
    }
  }

  protected onOutsideClick(event: MouseEvent) {
    // A click on the trigger toggles it closed by itself.
    if (!this.trigger().nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  protected choose(event: ListboxValueChangeEvent<string>) {
    // Clicking the selected option deselects it in a CDK listbox; treat that as keeping the value.
    const next = event.value[0];
    if (next !== undefined && next !== this.value()) this.valueChange.emit(next);
    this.close();
  }

  private show() {
    this.minWidth.set(this.trigger().nativeElement.offsetWidth);
    this.open.set(true);
    afterNextRender(() => this.listbox()?.focus(), { injector: this.injector });
  }

  private close() {
    this.open.set(false);
    this.trigger().nativeElement.focus();
  }
}
