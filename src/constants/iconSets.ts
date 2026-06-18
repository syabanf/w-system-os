import type { LucideIcon } from "lucide-react";
import {
  // Minimal
  Gauge,
  LayoutGrid,
  TrendingUp,
  BarChart3,
  Zap,
  Building,
  Boxes,
  Headphones,
  Users,
  Star,
  CircleUser,
  Clock,
  Wallet,
  ArrowRightLeft,
  BookOpen,
  Shield,
  // Rounded
  PieChart,
  LayoutPanelLeft,
  Goal,
  FileText,
  Megaphone,
  Store,
  FolderKanban,
  Headset,
  UsersRound,
  Award,
  CircleUserRound,
  Timer,
  PiggyBank,
  RefreshCw,
  BookMarked,
  UserCog,
} from "lucide-react";
import { APP_MODULES, type AppModuleId } from "./appModules";

/** A selectable icon set. "Classic" leaves modules on their default glyphs;
 *  other sets remap each module to a different lucide glyph for a fresh look.
 *  (lucide is the only icon library here, so "sets" are alternate glyphs in
 *  the same line style rather than separate icon packs.) */
export interface IconSet {
  id: string;
  name: string;
  icons: Partial<Record<AppModuleId, LucideIcon>>;
}

export const DEFAULT_ICON_SET_ID = "classic";

export const ICON_SETS: IconSet[] = [
  { id: "classic", name: "Classic", icons: {} },
  {
    id: "minimal",
    name: "Minimal",
    icons: {
      dashboard: Gauge,
      integration: LayoutGrid,
      kpis: TrendingUp,
      reports: BarChart3,
      leads: Zap,
      clients: Building,
      projects: Boxes,
      support: Headphones,
      hr: Users,
      performance: Star,
      portal: CircleUser,
      timesheet: Clock,
      finance: Wallet,
      transaction: ArrowRightLeft,
      knowledge: BookOpen,
      admin: Shield,
    },
  },
  {
    id: "rounded",
    name: "Rounded",
    icons: {
      dashboard: PieChart,
      integration: LayoutPanelLeft,
      kpis: Goal,
      reports: FileText,
      leads: Megaphone,
      clients: Store,
      projects: FolderKanban,
      support: Headset,
      hr: UsersRound,
      performance: Award,
      portal: CircleUserRound,
      timesheet: Timer,
      finance: PiggyBank,
      transaction: RefreshCw,
      knowledge: BookMarked,
      admin: UserCog,
    },
  },
];

const DEFAULT_GLYPH = new Map<AppModuleId, LucideIcon>(
  APP_MODULES.map((m) => [m.id, m.icon]),
);

/** Resolve the glyph for a module under the given set, falling back to the
 *  module's default (so a set only needs to override what it wants to change). */
export function resolveModuleIcon(setId: string, moduleId: AppModuleId): LucideIcon {
  const set = ICON_SETS.find((s) => s.id === setId);
  return set?.icons[moduleId] ?? DEFAULT_GLYPH.get(moduleId) ?? DEFAULT_GLYPH.values().next().value!;
}

/** A few representative glyphs for previewing a set in the picker. */
export function previewIcons(setId: string): LucideIcon[] {
  return (["dashboard", "clients", "finance", "knowledge"] as AppModuleId[]).map((id) =>
    resolveModuleIcon(setId, id),
  );
}
