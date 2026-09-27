"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    let refreshing = false;
    let updateShown = false;

    const showUpdate = (registration: ServiceWorkerRegistration) => {
      if (!registration.waiting || updateShown) return;

      updateShown = true;
      toast("Update available", {
        description: "Reload to use the latest version.",
        duration: Infinity,
        action: {
          label: "Reload",
          onClick: () => {
            const waiting = registration.waiting;
            if (!waiting) return;
            refreshing = true;
            waiting.postMessage({ type: "SKIP_WAITING" });
          },
        },
      });
    };

    const onControllerChange = () => {
      if (refreshing) window.location.reload();
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              showUpdate(registration);
            }
          });
        });

        if (registration.waiting) showUpdate(registration);
        await registration.update();
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    void register();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
