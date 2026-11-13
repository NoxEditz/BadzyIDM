import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Stage } from "@/badzy/Stage";

/**
 * Pathless layout for every Badzy prototype screen: dark stage backdrop,
 * fit-to-viewport scaling, screen index overlay and accent theme switching.
 * Screens render through <Outlet /> inside <Stage /> (slide+fade transitions).
 */
export const Route = createFileRoute("/_stage")({
  component: () => (
    <Stage>
      <Outlet />
    </Stage>
  ),
});
