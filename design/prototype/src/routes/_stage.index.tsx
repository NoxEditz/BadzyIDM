import { createFileRoute } from "@tanstack/react-router";
import MainWindow from "@/badzy/screens/MainWindow";

export const Route = createFileRoute("/_stage/")({
  head: () => ({
    meta: [
      { title: "Badzy — Main window" },
      { name: "description", content: "Badzy download manager prototype: main window with live download table, nav, drawer and right panel." },
      { property: "og:title", content: "Badzy — Main window" },
      { property: "og:description", content: "Main window of the Badzy download manager design prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MainWindow,
});
