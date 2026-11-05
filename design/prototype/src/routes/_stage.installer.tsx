import { createFileRoute } from "@tanstack/react-router";
import Installer from "@/badzy/screens/Installer";

export const Route = createFileRoute("/_stage/installer")({
  head: () => ({
    meta: [
      { title: "Badzy — Installer" },
      { name: "description", content: "Badzy installer wizard: welcome, options, install progress and done." },
      { property: "og:title", content: "Badzy — Installer" },
      { property: "og:description", content: "Installer of the Badzy design prototype with marble brand art." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Installer,
});
