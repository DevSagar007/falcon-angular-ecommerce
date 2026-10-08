import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, type ValidatorFn } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import type { ZodType } from "zod";
import { CircleCheck } from "lucide";
import { cartTotals } from "../../../lib/pricing";
import { taka } from "../../../lib/utils";
import { checkoutSchema, type CheckoutValues } from "../../../schemas/checkout.schema";
import { DemoNotice, OrderTotals } from "../../cart/order-totals";
import { CartStore } from "../../core/cart.store";
import { CatalogApi } from "../../core/catalog-api";
import { SeoService } from "../../core/seo.service";
import { Breadcrumb } from "../../shared/ui/breadcrumb";
import { Button } from "../../shared/ui/button";
import { Icon } from "../../shared/ui/icon";
import { Input } from "../../shared/ui/input";
import { Skeleton } from "../../shared/ui/skeleton";

type FieldName = keyof CheckoutValues;

type Field = {
  name: FieldName;
  label: string;
  type?: string;
  autocomplete: string;
  inputmode?: "tel" | "numeric" | "email";
  placeholder: string;
  wide?: boolean;
};

const FIELDS: Field[] = [
  { name: "fullName", label: "Full name", autocomplete: "name", placeholder: "Nadia Rahman" },
  { name: "email", label: "Email", type: "email", autocomplete: "email", inputmode: "email", placeholder: "you@example.com" },
  { name: "phone", label: "Mobile number", type: "tel", autocomplete: "tel", inputmode: "tel", placeholder: "01712-345678" },
  { name: "address", label: "Address", autocomplete: "street-address", placeholder: "House, road, area", wide: true },
  { name: "city", label: "City", autocomplete: "address-level2", placeholder: "Dhaka" },
  { name: "postalCode", label: "Postal code", autocomplete: "postal-code", inputmode: "numeric", placeholder: "1230" },
];

/** Validates a control with the shared Zod field schema, reporting its first message (as zodResolver did). */
function zodValidator(schema: ZodType): ValidatorFn {
  return (control) => {
    const result = schema.safeParse(control.value);
    return result.success ? null : { zod: result.error.issues[0]?.message ?? "Invalid value" };
  };
}

const field = (name: FieldName) =>
  new FormControl("", { nonNullable: true, validators: zodValidator(checkoutSchema.shape[name]) });

type Confirmation = { orderId: string; total: number; count: number };

@Component({
  selector: "app-checkout-page",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, DemoNotice, OrderTotals, Breadcrumb, Button, Icon, Input, Skeleton],
  host: { class: "contents" },
  template: `
    @if (confirmation(); as order) {
      <main class="mx-auto mt-17.5 max-w-150 px-5 py-20 text-center">
        <svg [appIcon]="icons.CircleCheck" [size]="48" class="mx-auto mb-4 text-(--teal)"></svg>
        <h1 class="mb-3 text-4xl">Order confirmed</h1>
        <p class="mb-2 text-(--muted)" role="status">
          Demo order <b class="text-(--text)">{{ order.orderId }}</b> · {{ order.count }} {{ order.count === 1 ? "item" : "items" }} · {{ taka(order.total) }}
        </p>
        <p class="mb-6 text-sm text-(--muted)">This is a simulated checkout: nothing was charged, shipped or stored.</p>
        <a appButton routerLink="/products">Continue shopping</a>
      </main>
    } @else {
      <main class="mx-auto mt-17.5 w-[calc(100%-32px)] max-w-317.5">
        <nav appBreadcrumb [items]="breadcrumb"></nav>
        <h1 class="mb-7.5 text-4xl -tracking-px">Checkout</h1>
        @if (!cart.hydrated()) {
          <div class="grid gap-8.75 min-[801px]:grid-cols-[1.5fr_1fr]" aria-busy="true">
            <p class="sr-only" role="status">Loading your cart…</p>
            <div appSkeleton class="h-96 rounded-lg"></div>
            <div appSkeleton class="h-60 rounded-lg"></div>
          </div>
        } @else if (cart.items().length === 0) {
          <div class="rounded-lg bg-white px-5 py-20 text-center">
            <h2 class="mb-3 text-2xl">Your cart is empty</h2>
            <p class="mb-6 text-(--muted)">Add a few products before checking out.</p>
            <a appButton routerLink="/products">Browse products</a>
          </div>
        } @else {
          <div class="grid items-start gap-8.75 min-[801px]:grid-cols-[1.5fr_1fr]">
            <form
              class="grid gap-4.5 rounded-lg bg-white p-7 max-[600px]:p-5 min-[801px]:grid-cols-2"
              novalidate
              [formGroup]="form"
              (ngSubmit)="submit()"
              aria-labelledby="delivery-heading"
            >
              <h2 id="delivery-heading" class="text-[1.375rem] min-[801px]:col-span-2">Delivery information</h2>
              <p class="-mt-2 text-xs text-(--muted) min-[801px]:col-span-2">All fields are required.</p>
              @for (f of fields; track f.name) {
                @let error = errorFor(f.name);
                <div [class]="f.wide ? 'min-[801px]:col-span-2' : ''">
                  <label [for]="f.name" class="block text-xs text-[#475569]">{{ f.label }}</label>
                  <input
                    appInput
                    [id]="f.name"
                    [type]="f.type ?? 'text'"
                    [attr.autocomplete]="f.autocomplete"
                    [attr.inputmode]="f.inputmode ?? null"
                    [placeholder]="f.placeholder"
                    class="mt-2"
                    aria-required="true"
                    [attr.aria-invalid]="error ? true : null"
                    [attr.aria-describedby]="error ? f.name + '-error' : null"
                    [formControlName]="f.name"
                  />
                  @if (error) {
                    <small [id]="f.name + '-error'" class="mt-1 block text-red-600">{{ error }}</small>
                  }
                </div>
              }
              @if (submitError(); as message) {
                <p class="rounded-md bg-red-50 p-3 text-sm text-red-700 min-[801px]:col-span-2" role="alert">{{ message }}</p>
              }
              <button appButton class="min-[801px]:col-span-2" type="submit" [disabled]="submitting()" [attr.aria-disabled]="submitting()">
                {{ submitting() ? "Placing order…" : "Place order · " + taka(totals().total) }}
              </button>
            </form>
            <aside class="h-max rounded-lg bg-white p-6.25" aria-labelledby="checkout-summary">
              <h2 id="checkout-summary" class="text-[1.375rem]">Order summary</h2>
              <ul class="my-4 grid list-none gap-3 p-0">
                @for (item of cart.items(); track item.id) {
                  <li class="flex items-center justify-between gap-4 text-sm">
                    <span class="min-w-0 wrap-break-word">{{ item.name }} × {{ item.quantity }}</span>
                    <b class="whitespace-nowrap">{{ taka(item.price * item.quantity) }}</b>
                  </li>
                }
              </ul>
              <dl appOrderTotals [totals]="totals()"></dl>
              <app-demo-notice />
            </aside>
          </div>
        }
      </main>
    }
  `,
})
export class CheckoutPage {
  protected readonly cart = inject(CartStore);
  private readonly api = inject(CatalogApi);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly icons = { CircleCheck };
  protected readonly taka = taka;
  protected readonly fields = FIELDS;
  protected readonly breadcrumb = [{ label: "Home", href: "/" }, { label: "My Cart", href: "/cart" }, { label: "Checkout" }];

  /** Validated on blur first, then on every change (like react-hook-form's "onTouched" mode). */
  protected readonly form = new FormGroup({
    fullName: field("fullName"),
    email: field("email"),
    phone: field("phone"),
    address: field("address"),
    city: field("city"),
    postalCode: field("postalCode"),
  });

  protected readonly totals = computed(() => cartTotals(this.cart.items()));
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly confirmation = signal<Confirmation | null>(null);

  constructor() {
    inject(SeoService).set({ title: "Checkout", robots: { index: false } });
  }

  protected errorFor(name: FieldName): string | null {
    const control = this.form.controls[name];
    return control.touched && control.errors ? (control.errors["zod"] as string) : null;
  }

  protected async submit() {
    // The button is disabled while submitting and re-entry is ignored, so one click = one order.
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);
    // Parsed values are trimmed, exactly as the server validates them.
    const customer = checkoutSchema.parse(this.form.getRawValue());
    const lines = this.cart.items().map(({ id, quantity, price }) => ({ id, quantity, price }));
    try {
      const result = await firstValueFrom(this.api.placeOrder({ customer, lines }));
      if (result.ok) {
        // Only clear the cart once the (simulated) order has been accepted.
        this.cart.clear();
        this.confirmation.set({ orderId: result.orderId, total: result.total, count: result.count });
        window.scrollTo({ top: 0 });
        return;
      }
      if (result.catalog) this.cart.syncCatalog(result.catalog);
      this.submitError.set(result.error);
    } catch {
      this.submitError.set("We couldn't reach the server. Check your connection and try again — your cart is unchanged.");
    } finally {
      this.submitting.set(false);
    }
  }

  private focusFirstInvalid() {
    const first = FIELDS.find((f) => this.form.controls[f.name].invalid);
    if (first) this.host.nativeElement.querySelector<HTMLInputElement>(`#${first.name}`)?.focus();
  }
}
