// Desktop wallpaper presets. Each `css` is a full CSS `background` value — a
// stack of gradient layers ending in a base gradient, led by a top/bottom
// darkening layer (CHROME) so the menu bar and dock stay legible on any choice.
//
// "aurora" is the default and renders via the theme-aware `.desktop-bg` class
// (it adapts to light/dark in globals.css); its `css` here is only used for the
// picker thumbnail. Every other preset is applied as an inline background.

export interface Wallpaper {
  id: string;
  name: string;
  css: string;
}

// Top + bottom darkening for chrome legibility, reused by every preset.
const CHROME =
  "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.10) 16%, rgba(0,0,0,0.10) 84%, rgba(0,0,0,0.52) 100%)";

export const DEFAULT_WALLPAPER_ID = "aurora";

export const WALLPAPERS: Wallpaper[] = [
  {
    id: "aurora",
    name: "Aurora",
    css: `${CHROME}, radial-gradient(ellipse 90% 60% at 22% 18%, rgba(56,189,248,0.45) 0%, transparent 60%), radial-gradient(ellipse 70% 55% at 78% 55%, rgba(236,72,153,0.40) 0%, transparent 65%), radial-gradient(ellipse 80% 70% at 45% 95%, rgba(168,85,247,0.35) 0%, transparent 70%), linear-gradient(140deg, #060818 0%, #0b0a1f 35%, #160a26 70%, #1a0a22 100%)`,
  },
  {
    id: "sunset",
    name: "Sunset",
    css: `${CHROME}, radial-gradient(ellipse 90% 60% at 20% 20%, rgba(251,146,60,0.45) 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 80% 40%, rgba(236,72,153,0.42) 0%, transparent 65%), radial-gradient(ellipse 90% 70% at 50% 100%, rgba(124,58,237,0.42) 0%, transparent 72%), linear-gradient(140deg, #2a0a18 0%, #2a0f1f 40%, #1a0f2e 100%)`,
  },
  {
    id: "ocean",
    name: "Ocean",
    css: `${CHROME}, radial-gradient(ellipse 90% 60% at 25% 20%, rgba(34,211,238,0.40) 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 78% 50%, rgba(59,130,246,0.42) 0%, transparent 65%), radial-gradient(ellipse 90% 70% at 50% 100%, rgba(99,102,241,0.40) 0%, transparent 72%), linear-gradient(140deg, #04121f 0%, #061a2b 40%, #0a1430 100%)`,
  },
  {
    id: "forest",
    name: "Forest",
    css: `${CHROME}, radial-gradient(ellipse 90% 60% at 22% 22%, rgba(52,211,153,0.38) 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 80% 50%, rgba(16,185,129,0.36) 0%, transparent 65%), radial-gradient(ellipse 90% 70% at 50% 100%, rgba(20,184,166,0.34) 0%, transparent 72%), linear-gradient(140deg, #04140f 0%, #06190f 45%, #08130c 100%)`,
  },
  {
    id: "nebula",
    name: "Nebula",
    css: `${CHROME}, radial-gradient(ellipse 80% 55% at 28% 25%, rgba(168,85,247,0.45) 0%, transparent 60%), radial-gradient(ellipse 70% 55% at 75% 60%, rgba(217,70,239,0.40) 0%, transparent 65%), radial-gradient(ellipse 80% 70% at 50% 100%, rgba(59,130,246,0.35) 0%, transparent 72%), linear-gradient(150deg, #0a0518 0%, #150826 45%, #1c0a2e 100%)`,
  },
  {
    id: "graphite",
    name: "Graphite",
    css: `${CHROME}, radial-gradient(ellipse 90% 70% at 30% 20%, rgba(120,130,150,0.22) 0%, transparent 65%), radial-gradient(ellipse 80% 60% at 75% 70%, rgba(90,100,120,0.20) 0%, transparent 70%), linear-gradient(145deg, #0c0e12 0%, #14171d 50%, #0e1013 100%)`,
  },
  {
    id: "dawn",
    name: "Dawn",
    css: `${CHROME}, radial-gradient(ellipse 90% 60% at 25% 22%, rgba(251,191,36,0.34) 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 78% 48%, rgba(244,114,182,0.32) 0%, transparent 65%), radial-gradient(ellipse 90% 70% at 50% 100%, rgba(96,165,250,0.34) 0%, transparent 72%), linear-gradient(140deg, #161024 0%, #1d1430 45%, #221733 100%)`,
  },
];
