import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "./common";

export { AddQueueDialog, ExtensionInstallDialog, GrabberRuleDialog, ScheduleRuleDialog, UpdateDialog } from "./app";

export function ConfirmQueueDelete({ name, onConfirm }: { name: string; onConfirm: () => void }) {
  return (
    <ConfirmDialog
      title="Delete queue"
      heading={`Delete ${name}?`}
      message="Its downloads move to the Main queue. Nothing is deleted from disk."
      icon={<Trash2 />}
      tone="error"
      danger
      confirmLabel="Delete queue"
      onConfirm={onConfirm}
      doneToast={{ title: "Queue deleted", message: name, tone: "muted" }}
    />
  );
}
