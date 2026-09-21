import * as Icons from "lucide-react";
import type { ComponentType } from "react";

export function LucideIcon({ name, size = 18, className, style }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) {
  const Comp = (Icons as any)[name] as ComponentType<any>;
  if (!Comp) return null;
  return <Comp size={size} className={className} style={style} />;
}

// Kuder icon color is handled by parent; this helper keeps API simple
export const KUDER_ICON_NAMES = {
  EXT: "Trees",
  MEC: "Wrench",
  CAL: "Calculator",
  CIE: "FlaskConical",
  PER: "Handshake",
  ART: "Palette",
  LIT: "BookOpen",
  MUS: "Music",
  SOC: "HeartHandshake",
  OFI: "Building2",
} as const;
