import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";

// Intrinsic pixel sizes; CSS scales them to 36px tall, so both dimensions change together.
const PAYMENT_LOGOS = [
  { file: "visa", name: "Visa", width: 69 },
  { file: "master", name: "Mastercard", width: 69 },
  { file: "express", name: "American Express", width: 70 },
  { file: "bkash", name: "bKash", width: 69 },
  { file: "nogod", name: "Nagad", width: 69 },
];

// Information pages are outside the assignment scope; listed as plain text rather than links to unrelated pages.
const ABOUT_ITEMS = ["Contact Us", "About us", "Careers", "Press", "Cancellation & Returns", "Terms of Use"];
const HELP_ITEMS = ["Payments", "Shipping", "FAQs", "Terms of Use", "Security", "Privacy"];

@Component({
  selector: "app-store-footer",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: { class: "contents" },
  template: `
    <ng-template #heading let-text>
      <h2 class="mb-4.5 text-sm font-semibold text-[#94a3b8]">{{ text }}</h2>
    </ng-template>
    <ng-template #contactBadge let-type>
      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black">
        @switch (type) {
          @case ("phone") {
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.3 14C11.9111 14 10.5389 13.6973 9.18333 13.092C7.82778 12.4867 6.59444 11.6282 5.48333 10.5167C4.37222 9.40511 3.514 8.17178 2.90867 6.81667C2.30333 5.46156 2.00044 4.08933 2 2.7C2 2.5 2.06667 2.33333 2.2 2.2C2.33333 2.06667 2.5 2 2.7 2H5.4C5.55556 2 5.69444 2.05289 5.81667 2.15867C5.93889 2.26444 6.01111 2.38933 6.03333 2.53333L6.46667 4.86667C6.48889 5.04444 6.48333 5.19444 6.45 5.31667C6.41667 5.43889 6.35556 5.54444 6.26667 5.63333L4.65 7.26667C4.87222 7.67778 5.136 8.07489 5.44133 8.458C5.74667 8.84111 6.08289 9.21067 6.45 9.56667C6.79444 9.91111 7.15556 10.2307 7.53333 10.5253C7.91111 10.82 8.31111 11.0893 8.73333 11.3333L10.3 9.76667C10.4 9.66667 10.5307 9.59178 10.692 9.542C10.8533 9.49222 11.0116 9.47822 11.1667 9.5L13.4667 9.96667C13.6222 10.0111 13.75 10.0918 13.85 10.2087C13.95 10.3256 14 10.456 14 10.6V13.3C14 13.5 13.9333 13.6667 13.8 13.8C13.6667 13.9333 13.5 14 13.3 14Z" fill="black" /></svg>
          }
          @case ("mail") {
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.66667 13.3333C2.30001 13.3333 1.98623 13.2029 1.72534 12.942C1.46445 12.6811 1.33378 12.3671 1.33334 12V4C1.33334 3.63333 1.46401 3.31956 1.72534 3.05867C1.98667 2.79778 2.30045 2.66711 2.66667 2.66667H13.3333C13.7 2.66667 14.014 2.79733 14.2753 3.05867C14.5367 3.32 14.6671 3.63378 14.6667 4V12C14.6667 12.3667 14.5362 12.6807 14.2753 12.942C14.0144 13.2033 13.7004 13.3338 13.3333 13.3333H2.66667ZM8 8.66667L13.3333 5.33333V4L8 7.33333L2.66667 4V5.33333L8 8.66667Z" fill="black" /></svg>
          }
          @default {
            <svg aria-hidden="true" width="12" height="15" viewBox="0 0 12 15" fill="none"><path d="M4.74333 13.874C5.14733 14.2073 5.56867 14.512 6 14.8093C6.43226 14.5159 6.85155 14.2039 7.25667 13.874C7.932 13.3195 8.56756 12.7182 9.15867 12.0747C10.5213 10.5847 12 8.42467 12 6C12 5.21207 11.8448 4.43185 11.5433 3.7039C11.2417 2.97595 10.7998 2.31451 10.2426 1.75736C9.68549 1.20021 9.02405 0.758251 8.2961 0.456723C7.56815 0.155195 6.78793 0 6 0C5.21207 0 4.43185 0.155195 3.7039 0.456723C2.97595 0.758251 2.31451 1.20021 1.75736 1.75736C1.20021 2.31451 0.758251 2.97595 0.456723 3.7039C0.155195 4.43185 -1.17411e-08 5.21207 0 6C0 8.42467 1.47867 10.584 2.84133 12.0747C3.43241 12.7185 4.06798 13.3193 4.74333 13.874ZM6 8.16667C5.42536 8.16667 4.87426 7.93839 4.46794 7.53206C4.06161 7.12574 3.83333 6.57464 3.83333 6C3.83333 5.42536 4.06161 4.87426 4.46794 4.46794C4.87426 4.06161 5.42536 3.83333 6 3.83333C6.57464 3.83333 7.12574 4.06161 7.53206 4.46794C7.93839 4.87426 8.16667 5.42536 8.16667 6C8.16667 6.57464 7.93839 7.12574 7.53206 7.53206C7.12574 7.93839 6.57464 8.16667 6 8.16667Z" fill="black" /></svg>
          }
        }
      </span>
    </ng-template>

    <footer class="mt-12.5 bg-[#0f172a] pt-20 text-white">
      <div class="mx-auto grid w-[min(1270px,calc(100%-32px))] grid-cols-[2fr_1fr_1fr_1fr] gap-10.5 max-[800px]:grid-cols-2 max-[800px]:gap-7.5 max-[280px]:w-[calc(100%-48px)]">
        <div class="max-[280px]:col-span-2">
          <img src="/assets/logo/footer-logo.png" alt="Falcon" width="198" height="38" loading="lazy" class="h-auto" />
          <p class="my-5 text-sm leading-[1.55] text-white">Experience our new platform &amp; Enjoy exciting deals and offers on your day to day.</p>
          <div class="space-y-4">
            <div class="flex items-start gap-x-2 text-sm leading-[1.55] text-white">
              <ng-container *ngTemplateOutlet="contactBadge; context: { $implicit: 'location' }" />
              <span>House #64, Road 13, ASA Center, Uttara, Dhaka-1402</span>
            </div>
            <div class="flex items-start gap-x-2 text-sm leading-[1.55] text-white">
              <ng-container *ngTemplateOutlet="contactBadge; context: { $implicit: 'phone' }" />
              <span><a href="tel:01729149720">01729-149720</a></span>
            </div>
            <div class="flex items-start gap-x-2 text-sm leading-[1.55] text-white">
              <ng-container *ngTemplateOutlet="contactBadge; context: { $implicit: 'mail' }" />
              <span><a href="mailto:falcon&#64;gmail.com">falcon&#64;gmail.com</a></span>
            </div>
          </div>
        </div>
        <div>
          <ng-container *ngTemplateOutlet="heading; context: { $implicit: 'ABOUT' }" />
          <ul class="m-0 list-none p-0">
            @for (item of aboutItems; track $index) {
              <li class="mb-2.25 text-sm text-[#cbd5e1]">{{ item }}</li>
            }
          </ul>
        </div>
        <div>
          <ng-container *ngTemplateOutlet="heading; context: { $implicit: 'HELP' }" />
          <ul class="m-0 list-none p-0">
            @for (item of helpItems; track $index) {
              <li class="mb-2.25 text-sm text-[#cbd5e1]">{{ item }}</li>
            }
          </ul>
          <p class="mt-3 text-xs text-[#94a3b8]">Policy pages coming soon.</p>
        </div>
        <div>
          <ng-container *ngTemplateOutlet="heading; context: { $implicit: 'Need Support?' }" />
          <div class="mb-5.5 flex items-center gap-x-1 rounded-md border border-[#f1f5f9] px-3 py-1.5 text-sm text-white">
            <span class="mb-0">
              <svg aria-hidden="true" width="25" height="25" viewBox="0 0 25 25" fill="none">
                <path d="M17.5 10.9373C17.5 10.5916 17.5 10.4188 17.552 10.2648C17.7032 9.81725 18.1018 9.64357 18.5011 9.4617C18.95 9.25723 19.1744 9.155 19.3968 9.13701C19.6493 9.1166 19.9022 9.17099 20.118 9.2921C20.4041 9.45265 20.6036 9.75774 20.8079 10.0058C21.7513 11.1517 22.2229 11.7246 22.3955 12.3564C22.5348 12.8662 22.5348 13.3994 22.3955 13.9093C22.1438 14.8307 21.3485 15.6032 20.7598 16.3182C20.4587 16.684 20.3081 16.8668 20.118 16.9735C19.9022 17.0946 19.6493 17.149 19.3968 17.1286C19.1744 17.1106 18.95 17.0084 18.5011 16.8039C18.1018 16.6221 17.7032 16.4484 17.552 16.0008C17.5 15.8468 17.5 15.674 17.5 15.3284V10.9373Z" stroke="#00B795" stroke-width="1.5" />
                <path d="M7.5 10.9372C7.5 10.5019 7.48778 10.1108 7.13591 9.80477C7.00793 9.69346 6.83825 9.61618 6.49891 9.46162C6.05001 9.25715 5.82556 9.15492 5.60316 9.13693C4.93591 9.08297 4.57692 9.53837 4.19213 10.0057C3.24875 11.1516 2.77706 11.7245 2.60446 12.3563C2.46518 12.8661 2.46518 13.3993 2.60446 13.9092C2.8562 14.8307 3.65152 15.6031 4.24021 16.3181C4.61129 16.7688 4.96577 17.1801 5.60316 17.1285C5.82556 17.1105 6.05001 17.0083 6.49891 16.8039C6.83825 16.6493 7.00793 16.572 7.13591 16.4607C7.48778 16.1547 7.5 15.7635 7.5 15.3283V10.9372Z" stroke="#00B795" stroke-width="1.5" />
                <path d="M5.5 9.13281C5.5 5.8191 8.63401 3.13281 12.5 3.13281C16.366 3.13281 19.5 5.8191 19.5 9.13281" stroke="#00B795" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="round" />
                <path d="M19.5 17.1328V17.9328C19.5 19.7001 17.7091 21.1328 15.5 21.1328H13.5" stroke="#00B795" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <p class="m-0 font-medium text-white">10724-7814XX</p>
          </div>
          <ng-container *ngTemplateOutlet="heading; context: { $implicit: 'DOWNLOAD APP' }" />
          <img class="my-2.5 block h-auto" src="/assets/icons/Google.png" alt="Google Play" width="180" height="55" loading="lazy" />
          <img class="my-2.5 block h-auto" src="/assets/icons/apple.png" alt="App Store" width="180" height="55" loading="lazy" />
        </div>
      </div>
      <div class="mx-auto mt-8 flex w-[min(1270px,calc(100%-32px))] items-center justify-between gap-5 py-5.5 max-[800px]:flex-col max-[800px]:items-start max-[280px]:w-[calc(100%-48px)]">
        <div class="flex items-center gap-3">
          <span class="text-sm text-white">Follow us on</span>
          <div class="flex items-center gap-3">
            <span role="img" aria-label="Facebook (coming soon)" title="Coming soon">
              <svg aria-hidden="true" class="h-7 w-7" viewBox="0 0 32 33"><path fill="#e2e8f0" d="M32 16.5C32 7.4 24.8 0 16 0S0 7.4 0 16.5c0 8.2 5.9 15 13.5 16.3V21.3H9.4v-4.8h4.1v-3.7c0-4.2 2.4-6.5 6.2-6.5 1.8 0 3.7.3 3.7.3v4.1h-2.1c-2 0-2.6 1.3-2.6 2.6v3.2h4.5l-.7 4.8h-3.8v11.5C26.1 31.5 32 24.7 32 16.5Z" /></svg>
            </span>
            <span role="img" aria-label="Instagram (coming soon)" title="Coming soon">
              <svg aria-hidden="true" class="h-7 w-7" viewBox="0 0 32 33"><rect x="5" y="5.5" width="22" height="22" rx="6" fill="none" stroke="#e2e8f0" stroke-width="2.5" /><circle cx="16" cy="16.5" r="5" fill="none" stroke="#e2e8f0" stroke-width="2.5" /><circle cx="22.5" cy="10.5" r="1.5" fill="#e2e8f0" /></svg>
            </span>
            <span role="img" aria-label="Twitter (coming soon)" title="Coming soon">
              <svg aria-hidden="true" class="h-7 w-7" viewBox="0 0 32 33"><path fill="#e2e8f0" d="M25.4 3.5h4.8l-10.5 12 12.3 14H22.4l-7.1-8.1-7.1 8.1H3.4l10.9-12.5L2.5 3.5h9.9l6.4 7.4 6.6-7.4Zm-1.7 23.5h2.7L10.2 5.8H7.3l16.4 21.2Z" /></svg>
            </span>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="mr-2 text-sm font-semibold text-[#94a3b8]">PAYMENTS ACCEPTED</span>
          @for (logo of paymentLogos; track logo.file) {
            <img [src]="'/assets/payments/' + logo.file + '.png'" [alt]="logo.name" [width]="logo.width" height="45" loading="lazy" class="h-9 w-auto rounded" />
          }
        </div>
      </div>
      <div class="border-t border-[#3d4352] py-6.25 text-center text-sm text-white">© 2026 Falcon. Designed by XYZ.</div>
    </footer>
  `,
})
export class StoreFooter {
  protected readonly paymentLogos = PAYMENT_LOGOS;
  protected readonly aboutItems = ABOUT_ITEMS;
  protected readonly helpItems = HELP_ITEMS;
}
