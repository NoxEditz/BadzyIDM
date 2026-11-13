import { createFileRoute } from "@tanstack/react-router";
import Settings from "@/badzy/screens/Settings";

export const Route = createFileRoute("/_stage/settings")({
  head: () => ({
    meta: [
      { title: "Badzy — Settings" },
      { name: "description", content: "Badzy settings window: 11 fully filled tabs from General to About." },
      { property: "og:title", content: "Badzy — Settings" },
      { property: "og:description", content: "Settings window of the Badzy design prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});
