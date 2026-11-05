import { createFileRoute } from "@tanstack/react-router";
import Tools from "@/badzy/screens/Tools";

export const Route = createFileRoute("/_stage/tools")({
  head: () => ({
    meta: [
      { title: "Badzy — Tool dialogs" },
      { name: "description", content: "Badzy tools: torrent, playlist, grabber, scheduler, queue editor, limiter, columns, find, what's new, first run." },
      { property: "og:title", content: "Badzy — Tool dialogs" },
      { property: "og:description", content: "Tool dialogs of the Badzy design prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Tools,
});
