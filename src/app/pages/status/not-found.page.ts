import { ChangeDetectionStrategy, Component, RESPONSE_INIT, inject, input, type OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { SeoService } from "../../core/seo.service";
import { Button } from "../../shared/ui/button";
import { StatusMessage } from "./status-message";

/** Generic 404 page, also used for unknown product slugs (`variant="product"`). */
@Component({
  selector: "app-not-found-page",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, StatusMessage],
  host: { class: "contents" },
  template: `
    @if (variant() === "product") {
      <app-status-message kicker="404" heading="Product not found">
        <span message>The product you are looking for does not exist or is no longer available.</span>
        <a appButton routerLink="/products">Browse products</a>
      </app-status-message>
    } @else {
      <app-status-message kicker="404" heading="Page not found">
        <span message>The page you are looking for does not exist.</span>
        <a appButton routerLink="/products">Browse products</a>
      </app-status-message>
    }
  `,
})
export class NotFoundPage implements OnInit {
  readonly variant = input<"page" | "product">("page");
  private readonly seo = inject(SeoService);

  constructor() {
    // Real 404 status for server-rendered responses (null in the browser).
    const response = inject(RESPONSE_INIT, { optional: true });
    if (response) response.status = 404;
  }

  ngOnInit() {
    this.seo.set({
      title: this.variant() === "product" ? "Product not found" : undefined,
      robots: { index: false },
    });
  }
}
