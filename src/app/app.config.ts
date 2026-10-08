import { ApplicationConfig, provideBrowserGlobalErrorListeners } from "@angular/core";
import { IMAGE_LOADER } from "@angular/common";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideClientHydration, withEventReplay } from "@angular/platform-browser";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { routes } from "./app.routes";
import { storeImageLoader } from "./core/image-loader";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Scroll events are emitted, but the App component decides how to scroll (see app.ts).
      withInMemoryScrolling({ scrollPositionRestoration: "disabled", anchorScrolling: "disabled" }),
    ),
    // Includes the HTTP transfer cache: data fetched during server rendering is reused on hydration.
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    { provide: IMAGE_LOADER, useValue: storeImageLoader },
  ],
};
