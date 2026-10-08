import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/** Centered message used by the 404, product-404 and error pages. */
@Component({
  selector: "app-status-message",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "contents" },
  template: `
    <main class="mx-auto my-30 max-w-150 px-4 text-center">
      <p class="kicker">{{ kicker() }}</p>
      <h1 class="my-2 text-4xl -tracking-px">{{ heading() }}</h1>
      <p class="mb-6 leading-[1.6] text-(--muted)">
        <ng-content select="[message]" />
      </p>
      <ng-content />
    </main>
  `,
})
export class StatusMessage {
  readonly kicker = input.required<string>();
  readonly heading = input.required<string>();
}
