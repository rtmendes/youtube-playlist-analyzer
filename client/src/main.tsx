import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

// Optional: load Umami analytics only when env vars are set (no malformed URI when missing)
const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
const analyticsWebsiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
if (typeof analyticsEndpoint === "string" && analyticsEndpoint.length > 0 && typeof analyticsWebsiteId === "string" && analyticsWebsiteId.length > 0) {
  const script = document.createElement("script");
  script.defer = true;
  script.src = `${analyticsEndpoint.replace(/\/$/, "")}/umami.js`;
  script.setAttribute("data-website-id", analyticsWebsiteId);
  document.body.appendChild(script);
}

const queryClient = new QueryClient();

// No automatic redirect to login: you can use the app without signing in.
// Pages that need auth show their own "Sign in to view" or "Sign in to save" UI.

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
