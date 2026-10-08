import { ChangeDetectionStrategy, Component, computed, input, output } from "@angular/core";
import { Input } from "../../shared/ui/input";

const PRICE_PATTERN = /^\d+(\.\d+)?$/;
export const isValidPrice = (value: string) => value === "" || PRICE_PATTERN.test(value.trim());

@Component({
  selector: "label[appPriceInput]",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Input],
  host: {
    "[attr.for]": "inputId()",
    class: "mt-5.5 block text-[12px] text-[#475569]",
  },
  template: `
    {{ label() }}
    <input
      appInput
      class="mt-1.75"
      [id]="inputId()"
      type="number"
      inputmode="decimal"
      min="0"
      [value]="value()"
      (input)="valueChange.emit($any($event.target).value)"
      [placeholder]="placeholder()"
      [attr.aria-invalid]="invalid() || null"
      [attr.aria-describedby]="invalid() ? inputId() + '-error' : null"
    />
    @if (invalid()) {
      <small [id]="inputId() + '-error'" class="mt-1 block text-red-600">Enter a positive amount.</small>
    }
  `,
})
export class PriceInput {
  readonly label = input.required<string>();
  readonly inputId = input.required<string>();
  readonly value = input.required<string>();
  readonly placeholder = input("");
  readonly valueChange = output<string>();

  protected readonly invalid = computed(() => !isValidPrice(this.value()));
}
