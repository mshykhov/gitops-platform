import React from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import { registerSW } from "virtual:pwa-register";

import { App } from "./App";
import { AUTH0_CONFIG } from "@/config/constants";

// Periodic SW updates - official Vite PWA approach
// https://vite-pwa-org.netlify.app/guide/periodic-sw-updates.html
const intervalMS = 10 * 60 * 1000; // Check every 10 minutes

registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      setInterval(async () => {
        if (registration.installing || !navigator) return;

        if ("connection" in navigator && !navigator.onLine) return;

        const resp = await fetch(swUrl, {
          cache: "no-store",
          headers: {
            cache: "no-store",
            "cache-control": "no-cache",
          },
        });

        if (resp?.status === 200) await registration.update();
      }, intervalMS);
    }
  },
});

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={AUTH0_CONFIG.domain}
      clientId={AUTH0_CONFIG.clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: AUTH0_CONFIG.audience || undefined,
        scope: "openid profile email offline_access",
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
