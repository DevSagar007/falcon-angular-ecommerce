import { ChangeDetectionStrategy, Component, RESPONSE_INIT, inject } from "@angular/core";
import { Router } from "@angular/router";
import { Button } from "../../shared/ui/button";
import { StatusMessage } from "./status-message";

/** Shown in place of a page whose data could not be loaded. "Try again" re-runs the route's resolvers. */
@Component({
  selector: "app-route-error",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, StatusMessage],
  host: { class: "contents" },
  template: `
    <app-status-message kicker="Something went wrong" heading="We couldn't load this page">
      <span message>This is usually temporary. Try again, or come back in a moment.</span>
      <button appButton type="button" (click)="retry()">Try again</button>
    </app-status-message>
  `,
})
export class RouteError {
  private readonly router = inject(Router);

  constructor() {
    const response = inject(RESPONSE_INIT, { optional: true });
    if (response) response.status = 500;
  }

  protected retry() {
    void this.router.navigateByUrl(this.router.url, { onSameUrlNavigation: "reload" });
  }
}
