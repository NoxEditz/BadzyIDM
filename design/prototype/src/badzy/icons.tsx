import {
  AppWindow,
  AudioLines,
  Clapperboard,
  Disc,
  File,
  FileArchive,
  FileText,
  FileType,
  Image as ImageIcon,
  Magnet,
  Presentation,
  Table,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type FileKind =
  | "video"
  | "audio"
  | "archive"
  | "program"
  | "image"
  | "pdf"
  | "doc"
  | "sheet"
  | "slides"
  | "torrent"
  | "disc"
  | "general";

export const kindIcon: Record<FileKind, LucideIcon> = {
  video: Clapperboard,
  audio: AudioLines,
  archive: FileArchive,
  program: AppWindow,
  image: ImageIcon,
  pdf: FileText,
  doc: FileType,
  sheet: Table,
  slides: Presentation,
  torrent: Magnet,
  disc: Disc,
  general: File,
};

const kindTone: Record<FileKind, { bg: string; text: string }> = {
  video: { bg: "bg-t-video/15 border-t-video/35", text: "text-t-video" },
  audio: { bg: "bg-t-audio/15 border-t-audio/35", text: "text-t-audio" },
  archive: { bg: "bg-t-archive/15 border-t-archive/35", text: "text-t-archive" },
  program: { bg: "bg-t-program/15 border-t-program/35", text: "text-t-program" },
  image: { bg: "bg-t-image/15 border-t-image/35", text: "text-t-image" },
  pdf: { bg: "bg-t-pdf/15 border-t-pdf/35", text: "text-t-pdf" },
  doc: { bg: "bg-t-doc/15 border-t-doc/35", text: "text-t-doc" },
  sheet: { bg: "bg-t-sheet/15 border-t-sheet/35", text: "text-t-sheet" },
  slides: { bg: "bg-t-slides/15 border-t-slides/35", text: "text-t-slides" },
  torrent: { bg: "bg-t-torrent/15 border-t-torrent/35", text: "text-t-torrent" },
  disc: { bg: "bg-t-disc/15 border-t-disc/35", text: "text-t-disc" },
  general: { bg: "bg-t-disc/15 border-edge", text: "text-t-disc" },
};

export function FileTypeTile({
  kind,
  size = 38,
  iconSize = 18,
  className,
}: {
  kind: FileKind;
  size?: number;
  iconSize?: number;
  className?: string;
}) {
  const Icon = kindIcon[kind];
  const tone = kindTone[kind];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] border transition-transform duration-150",
        tone.bg,
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Icon className={tone.text} style={{ width: iconSize, height: iconSize }} strokeWidth={1.75} />
    </div>
  );
}

export function KindLabel({ kind }: { kind: FileKind }) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}
