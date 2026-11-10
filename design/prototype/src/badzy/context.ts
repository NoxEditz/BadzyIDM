import { createContext, useContext, type ReactNode } from "react";

/**
 * Window-level context. Every <WindowFrame> reads it:
 *  - top-level screens: reportSize scales the stage to fit the viewport
 *  - windows opened as popups: reportSize sizes the popup, close() dismisses it
 */
export type StageCtx = {
  reportSize: (w: number, h: number) => void;
  close?: () => void;
  inPopup?: boolean;
};
export const StageContext = createContext<StageCtx>({ reportSize: () => {} });
export const useStage = () => useContext(StageContext);

export type ToastTone = "success" | "accent" | "warning" | "error" | "muted";
export type ToastInput = {
  title: string;
  message?: string;
  tone?: ToastTone;
  icon?: ReactNode;
};

/** App-level context: popup stack, toasts and accent theme. Never overridden. */
export type AppCtx = {
  open: (node: ReactNode) => void;
  closeTop: () => void;
  toast: (t: ToastInput | string) => void;
  theme: string;
  setTheme: (t: string) => void;
};
export const AppContext = createContext<AppCtx>({
  open: () => {},
  closeTop: () => {},
  toast: () => {},
  theme: "red",
  setTheme: () => {},
});
export const useApp = () => useContext(AppContext);

/**
 * Close the current window. Inside a popup it dismisses it; on a standalone
 * reference screen it shows a toast so the button still gives feedback.
 */
export function useWindowClose() {
  const { close } = useStage();
  const { toast } = useApp();
  return (message?: ToastInput | string) => {
    if (close) close();
    else if (!message) toast({ title: "Window closed", message: "Preview only — the reference window stays visible.", tone: "muted" });
    if (message) toast(message);
  };
}
