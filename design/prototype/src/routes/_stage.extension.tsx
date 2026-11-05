import { createFileRoute } from "@tanstack/react-router";
import Extension from "@/badzy/screens/Extension";

export const Route = createFileRoute("/_stage/extension")({
  head: () => ({
    meta: [
      { title: "Badzy — Browser extension" },
      { name: "description", content: "Badzy browser extension: 360px popup and options page on the same design tokens." },
      { property: "og:title", content: "Badzy — Browser extension" },
      { property: "og:description", content: "Browser extension screens of the Badzy design prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Extension,
});
