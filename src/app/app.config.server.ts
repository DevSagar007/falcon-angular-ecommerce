import { ApplicationConfig, TransferState, inject, mergeApplicationConfig, provideAppInitializer } from "@angular/core";
import { HttpBackend } from "@angular/common/http";
import { provideServerRendering, withRoutes } from "@angular/ssr";
import { SITE_URL as SERVER_SITE_URL } from "../server/site";
import { appConfig } from "./app.config";
import { serverRoutes } from "./app.routes.server";
import { InProcessApiBackend } from "./core/in-process-api.backend";
import { SITE_URL, SITE_URL_STATE_KEY } from "./core/site-url";

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Answer /api/* in-process while rendering (also works at build time, when no server is running).
    { provide: HttpBackend, useClass: InProcessApiBackend },
    InProcessApiBackend,
    { provide: SITE_URL, useValue: SERVER_SITE_URL },
    // Hand the configured origin to the browser so client-side navigations build the same canonical URLs.
    provideAppInitializer(() => inject(TransferState).set(SITE_URL_STATE_KEY, SERVER_SITE_URL)),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
