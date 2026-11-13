import { createFileRoute } from "@tanstack/react-router";
import Arabic from "@/badzy/screens/Arabic";

export const Route = createFileRoute("/_stage/ar")({
  head: () => ({
    meta: [
      { title: "Badzy — Arabic (RTL)" },
      { name: "description", content: "Badzy Arabic RTL screens: mirrored main window and add dialog with real Arabic text." },
      { property: "og:title", content: "Badzy — Arabic (RTL)" },
      { property: "og:description", content: "Arabic RTL variant of the Badzy design prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Arabic,
});
