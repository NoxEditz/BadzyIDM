import { createFileRoute } from "@tanstack/react-router";
import DesignSystem from "@/badzy/screens/DesignSystem";

export const Route = createFileRoute("/_stage/design-system")({
  head: () => ({
    meta: [
      { title: "Badzy — Design system" },
      { name: "description", content: "Badzy design system reference: tokens, type, icons, controls in every state and motion specs." },
      { property: "og:title", content: "Badzy — Design system" },
      { property: "og:description", content: "Design system reference of the Badzy prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DesignSystem,
});
