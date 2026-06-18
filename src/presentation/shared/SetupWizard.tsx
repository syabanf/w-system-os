"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Lock,
  Rocket,
  Sparkles,
  Wand2,
} from "lucide-react";
import { APP_MODULES, type AppModule, type AppModuleId } from "@/constants/appModules";
import {
  COMPANY_SIZES,
  INDUSTRIES,
  industryById,
  recommendedFor,
} from "@/constants/industries";
import {
  REQUIRED_MODULES,
  normalizeEnabled,
  useSetupStore,
} from "@/state/setup.store";
import { WitLogoMark } from "@/presentation/shared/WitLogoMark";
import { cn } from "@/lib/cn";

const GROUP_LABEL: Record<AppModule["group"], string> = {
  executive: "Executive",
  growth: "Growth",
  delivery: "Delivery",
  operations: "Operations",
  finance: "Finance",
  system: "System",
};

const GROUP_ORDER: AppModule["group"][] = [
  "executive",
  "growth",
  "delivery",
  "operations",
  "finance",
  "system",
];

const REQUIRED = new Set<AppModuleId>(REQUIRED_MODULES);
const STEPS = ["Welcome", "Company", "Features", "Confirm"] as const;

/** First-run setup. Collects the company's industry first, suggests a tailored
 *  module set from it (rule-based "AI" recommendation), then lets the user
 *  fine-tune which modules the shell surfaces. Rendered in place of the shell
 *  by AdaptiveShell while setup.isComplete is false. Always dark (a boot
 *  screen), using white/opacity text so the light-mode remap can't invert it. */
export function SetupWizard() {
  const storedEnabled = useSetupStore((s) => s.enabled);
  const storedIndustry = useSetupStore((s) => s.industry);
  const storedCompanySize = useSetupStore((s) => s.companySize);
  const complete = useSetupStore((s) => s.complete);

  const [step, setStep] = useState(0);
  const [industry, setIndustry] = useState(storedIndustry);
  const [companySize, setCompanySize] = useState(storedCompanySize);
  const [selected, setSelected] = useState<Set<AppModuleId>>(
    () => new Set(storedEnabled),
  );

  const groups = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        group,
        modules: APP_MODULES.filter((m) => m.group === group),
      })).filter((g) => g.modules.length > 0),
    [],
  );
  const chosen = useMemo(
    () => APP_MODULES.filter((m) => selected.has(m.id)),
    [selected],
  );
  const activeIndustry = industryById(industry);

  // Picking an industry applies its recommended module set — the suggestion.
  const pickIndustry = (id: string) => {
    setIndustry(id);
    setSelected(new Set(recommendedFor(id)));
  };

  const toggle = (id: AppModuleId) => {
    if (REQUIRED.has(id)) return; // locked on
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applySuggestion = () => setSelected(new Set(recommendedFor(industry)));
  const selectAll = () => setSelected(new Set(APP_MODULES.map((m) => m.id)));
  const clearOptional = () => setSelected(new Set(REQUIRED_MODULES));

  const finish = (ids: Iterable<AppModuleId> = selected) =>
    complete(normalizeEnabled([...ids]), { industry, companySize });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#070710] text-white">
      {/* Ambient accents so the boot surface isn't flat. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 18% 12%, rgba(56,189,248,0.18), transparent 70%), radial-gradient(55% 45% at 85% 85%, rgba(167,139,250,0.16), transparent 70%)",
        }}
      />

      <div className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col px-5 py-8 sm:py-12">
        {/* Header — brand + step rail */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <WitLogoMark size={26} />
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-white/45">
                Workspace setup
              </div>
              <div className="text-sm font-semibold text-white">WIT ERP OS</div>
            </div>
          </div>
          <ol className="flex items-center gap-2" aria-label="Setup progress">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors",
                    i === step
                      ? "bg-white/15 text-white"
                      : i < step
                        ? "text-white/60"
                        : "text-white/30",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold",
                      i < step
                        ? "bg-emerald-400 text-emerald-950"
                        : i === step
                          ? "bg-white text-zinc-900"
                          : "bg-white/10 text-white/40",
                    )}
                  >
                    {i < step ? <Check className="h-2.5 w-2.5" /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </span>
              </li>
            ))}
          </ol>
        </header>

        <div className="mt-8 flex-1">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.9, 0.25, 1] }}
          >
            {step === 0 ? (
              <div className="flex flex-col items-center text-center">
                <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-sky-400/30 to-violet-400/30 ring-1 ring-white/15">
                  <Rocket className="h-7 w-7 text-white" />
                </span>
                <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Let&apos;s set up your workspace
                </h1>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
                  Tell us your industry and we&apos;ll suggest the right modules
                  from WIT ERP OS&apos;s {APP_MODULES.length}. Adjust anything
                  before you finish — change it later from{" "}
                  <span className="text-white/80">View → Set up workspace</span>.
                </p>
              </div>
            ) : step === 1 ? (
              <>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Tell us about your company
                  </h2>
                  <p className="mt-0.5 text-xs text-white/50">
                    We&apos;ll tailor a module suggestion to your industry — you
                    fine-tune it next.
                  </p>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                    <Building2 className="h-3 w-3" />
                    Industry
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {INDUSTRIES.map((ind) => (
                      <button
                        key={ind.id}
                        type="button"
                        onClick={() => pickIndustry(ind.id)}
                        aria-pressed={industry === ind.id}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-2xl border p-3 text-left text-sm transition-all",
                          industry === ind.id
                            ? "border-white/30 bg-white/[0.08] text-white"
                            : "border-white/8 bg-white/[0.02] text-white/80 hover:border-white/15 hover:bg-white/[0.04]",
                        )}
                      >
                        <span>{ind.label}</span>
                        {industry === ind.id ? (
                          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                    Company size
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COMPANY_SIZES.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setCompanySize(sz)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs transition-colors",
                          companySize === sz
                            ? "border-white/30 bg-white/15 text-white"
                            : "border-white/12 bg-white/5 text-white/70 hover:text-white",
                        )}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : step === 2 ? (
              <>
                {activeIndustry ? (
                  <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-violet-300/20 bg-violet-400/10 p-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                    <div className="text-xs">
                      <span className="font-semibold text-white">
                        Suggested for {activeIndustry.label}
                      </span>
                      <span className="mt-0.5 block text-white/55">
                        {activeIndustry.rationale}
                      </span>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      Choose features
                    </h2>
                    <p className="mt-0.5 text-xs text-white/50">
                      {chosen.length} of {APP_MODULES.length} modules enabled ·
                      tap to toggle
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PresetButton onClick={applySuggestion} icon={Sparkles}>
                      AI pick
                    </PresetButton>
                    <PresetButton onClick={selectAll} icon={Wand2}>
                      Select all
                    </PresetButton>
                    <PresetButton onClick={clearOptional}>Clear</PresetButton>
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  {groups.map(({ group, modules }) => (
                    <section key={group}>
                      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                        {GROUP_LABEL[group]}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {modules.map((m) => (
                          <FeatureTile
                            key={m.id}
                            module={m}
                            selected={selected.has(m.id)}
                            locked={REQUIRED.has(m.id)}
                            onToggle={() => toggle(m.id)}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400/30 to-sky-400/30 ring-1 ring-white/15">
                    <Check className="h-8 w-8 text-white" />
                  </span>
                  <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                    {chosen.length} module{chosen.length === 1 ? "" : "s"} ready
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-white/60">
                    {activeIndustry ? `${activeIndustry.label} workspace. ` : ""}
                    These appear in your dock and app launcher; everything else
                    stays one click away in{" "}
                    <span className="text-white/80">View → Set up workspace</span>.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {chosen.map((m) => {
                    const Icon = m.icon;
                    return (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-xs text-white/85 ring-1 ring-white/10"
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: m.accent }} />
                        {m.shortName}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Footer — navigation */}
        <footer className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
          {step === 0 ? (
            <button
              onClick={() => finish(APP_MODULES.map((m) => m.id))}
              className="text-xs text-white/50 transition-colors hover:text-white/80"
            >
              Enable everything &amp; skip
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs text-white/70 transition-colors hover:bg-white/8 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-900 transition-transform hover:scale-[1.02] active:scale-95"
            >
              {step === 0 ? "Get started" : "Continue"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => finish()}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-emerald-950 transition-transform hover:scale-[1.02] active:scale-95"
            >
              <Rocket className="h-3.5 w-3.5" />
              Enter WIT ERP OS
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function PresetButton({
  children,
  icon: Icon,
  onClick,
}: {
  children: React.ReactNode;
  icon?: typeof Sparkles;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/75 transition-colors hover:border-white/30 hover:text-white"
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {children}
    </button>
  );
}

function FeatureTile({
  module,
  selected,
  locked,
  onToggle,
}: {
  module: AppModule;
  selected: boolean;
  locked: boolean;
  onToggle: () => void;
}) {
  const Icon = module.icon;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      disabled={locked}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border p-3 text-left transition-all",
        selected
          ? "border-white/25 bg-white/[0.07]"
          : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
        locked ? "cursor-default" : "cursor-pointer",
      )}
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-105"
        style={{
          background: selected
            ? `linear-gradient(150deg, ${module.accentLight} 0%, ${module.accentLight}d9 100%)`
            : "rgba(255,255,255,0.05)",
          boxShadow: selected
            ? `0 8px 20px -10px ${module.accentLight}aa, inset 0 1px 0 rgba(255,255,255,0.25)`
            : "none",
        }}
      >
        <Icon
          className="h-5 w-5"
          style={{ color: selected ? "#fff" : module.accent }}
          strokeWidth={2.4}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-white">
          {module.name}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-white/45">
          {module.description}
        </span>
      </span>
      <span
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors",
          selected ? "bg-emerald-400 text-emerald-950" : "bg-white/8 text-white/30",
        )}
      >
        {locked ? (
          <Lock className="h-2.5 w-2.5" />
        ) : selected ? (
          <Check className="h-3 w-3" />
        ) : null}
      </span>
    </button>
  );
}
