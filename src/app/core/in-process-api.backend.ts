import { FetchBackend, HttpBackend, HttpErrorResponse, HttpHeaders, HttpRequest, HttpResponse, type HttpEvent } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { handleApiRequest } from "../../server/api";

const BASE = "http://localhost";

/**
 * Server-only HTTP backend: answers `/api/*` requests by calling the API handler directly.
 * Rendering (and build-time prerendering, where no server is listening) never makes a network
 * round trip to itself, and Angular's HTTP transfer cache still records the responses for hydration.
 */
@Injectable()
export class InProcessApiBackend implements HttpBackend {
  private readonly fallback = inject(FetchBackend);

  handle(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    const url = new URL(request.urlWithParams, BASE);
    if (url.origin !== BASE || !url.pathname.startsWith("/api/")) return this.fallback.handle(request);

    return new Observable<HttpEvent<unknown>>((subscriber) => {
      handleApiRequest(request.method, url.pathname, url.searchParams, request.body)
        .then((response) => {
          const status = response?.status ?? 404;
          const body = response?.body ?? { error: "Not found" };
          const init = { status, url: request.urlWithParams, headers: new HttpHeaders({ "content-type": "application/json" }) };
          if (status >= 200 && status < 300) {
            subscriber.next(new HttpResponse({ ...init, body }));
            subscriber.complete();
          } else {
            subscriber.error(new HttpErrorResponse({ ...init, error: body }));
          }
        })
        .catch((error: unknown) => subscriber.error(new HttpErrorResponse({ status: 500, url: request.urlWithParams, error })));
    });
  }
}
