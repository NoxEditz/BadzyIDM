import { createFileRoute } from "@tanstack/react-router";
import Dialogs from "@/badzy/screens/Dialogs";

export const Route = createFileRoute("/_stage/dialogs")({
  head: () => ({
    meta: [
      { title: "Badzy — Dialog suite" },
      { name: "description", content: "Badzy dialogs: add batch, per-download progress, download complete and properties." },
      { property: "og:title", content: "Badzy — Dialog suite" },
      { property: "og:description", content: "Dialog suite of the Badzy design prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dialogs,
});
