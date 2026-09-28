"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}
function subscribeDisplay(callback: () => void) {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function AppInstall() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [error, setError] = useState("");
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const standalone = useSyncExternalStore(subscribeDisplay, isStandalone, () => false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch((error) => {
        console.error("Offline support could not start", error);
      });
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return (
    <aside className="app-install print:hidden" aria-label="App installation and connection">
      {!online ? <p role="status" className="notice notice-error">You’re offline. Reconnect before saving changes or downloading media.</p> : null}
      {!standalone && !installed ? (
        <details>
          <summary>Install Matata Media</summary>
          <div className="mt-3 space-y-2 text-sm">
            {prompt ? <button type="button" className="btn btn-black" onClick={async () => {
              try {
                await prompt.prompt();
                await prompt.userChoice;
                setPrompt(null);
              } catch { setError("Use your browser’s menu to install the app."); }
            }}>Install app</button> : null}
            <p><strong>iPhone / iPad:</strong> Open in Safari, tap Share, then Add to Home Screen.</p>
            <p><strong>Android / Windows:</strong> In Chrome or Edge, choose Install app or Add to Home screen from the browser menu.</p>
            <p><strong>Mac:</strong> In Safari, choose File → Add to Dock, or install using Chrome.</p>
            <p>Internet is needed to manage and collect packages. If installation is unavailable, you can keep using the website.</p>
            {error ? <p role="status">{error}</p> : null}
          </div>
        </details>
      ) : null}
    </aside>
  );
}
