import { createFileRoute } from "@tanstack/react-router";
import AddDownload from "@/badzy/screens/AddDownload";

export const Route = createFileRoute("/_stage/add-download")({
  head: () => ({
    meta: [
      { title: "Badzy — Add download dialog" },
      { name: "description", content: "Badzy add download dialog: URL check, file card, queue, connections and authorization." },
      { property: "og:title", content: "Badzy — Add download dialog" },
      { property: "og:description", content: "Add download dialog of the Badzy design prototype, with Arabic RTL variant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddDownload,
});
