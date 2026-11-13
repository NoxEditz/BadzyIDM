import { createFileRoute } from "@tanstack/react-router";
import SystemTray from "@/badzy/screens/SystemTray";

export const Route = createFileRoute("/_stage/system")({
  head: () => ({
    meta: [
      { title: "Badzy — Tray & toast" },
      { name: "description", content: "Badzy system tray menu and download finished toast." },
      { property: "og:title", content: "Badzy — Tray & toast" },
      { property: "og:description", content: "System tray and toast of the Badzy design prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SystemTray,
});
