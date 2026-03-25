import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Theme {
  id: string;
  name: string;
  bgType: "gradient" | "solid";
  bgColor1: string;
  bgColor2: string;
  ticketBg: string;
  ticketBorder: string;
}

const STORAGE_KEY = "tambola_themes";
const ACTIVE_KEY = "tambola_active_theme";

const PRESET_THEMES: Theme[] = [
  {
    id: "preset-classic-yellow",
    name: "Classic Yellow",
    bgType: "gradient",
    bgColor1: "#1a1a2e",
    bgColor2: "#16213e",
    ticketBg: "#FFE135",
    ticketBorder: "#000000",
  },
  {
    id: "preset-neon-dark",
    name: "Neon Dark (Default)",
    bgType: "gradient",
    bgColor1: "#0a0a1a",
    bgColor2: "#1a0a2e",
    ticketBg: "#FFE135",
    ticketBorder: "rgba(139,92,246,0.4)",
  },
  {
    id: "preset-ocean-blue",
    name: "Ocean Blue",
    bgType: "gradient",
    bgColor1: "#020c1b",
    bgColor2: "#0a2744",
    ticketBg: "rgba(5,30,70,0.75)",
    ticketBorder: "rgba(0,200,255,0.4)",
  },
  {
    id: "preset-fire-red",
    name: "Fire Red",
    bgType: "gradient",
    bgColor1: "#1a0505",
    bgColor2: "#2e0a0a",
    ticketBg: "rgba(60,10,10,0.75)",
    ticketBorder: "rgba(239,68,68,0.5)",
  },
  {
    id: "preset-forest-green",
    name: "Forest Green",
    bgType: "gradient",
    bgColor1: "#051a0a",
    bgColor2: "#0a2e14",
    ticketBg: "rgba(5,50,20,0.75)",
    ticketBorder: "rgba(34,197,94,0.4)",
  },
  {
    id: "preset-royal-gold",
    name: "Royal Gold",
    bgType: "gradient",
    bgColor1: "#1a1400",
    bgColor2: "#2e2000",
    ticketBg: "rgba(50,35,0,0.75)",
    ticketBorder: "rgba(234,179,8,0.5)",
  },
];

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.style.setProperty(
    "--theme-bg",
    theme.bgType === "gradient"
      ? `linear-gradient(135deg, ${theme.bgColor1}, ${theme.bgColor2})`
      : theme.bgColor1,
  );
  root.style.setProperty("--theme-ticket-bg", theme.ticketBg);
  root.style.setProperty("--theme-ticket-border", theme.ticketBorder);
}

function loadThemes(): Theme[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveThemes(themes: Theme[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
}

export default function ThemeManager() {
  const [themes, setThemes] = useState<Theme[]>(() => loadThemes());
  const [activeId, setActiveId] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_KEY),
  );

  const [form, setForm] = useState<Omit<Theme, "id">>({
    name: "",
    bgType: "gradient",
    bgColor1: "#0a0a1a",
    bgColor2: "#1a0a2e",
    ticketBg: "#FFE135",
    ticketBorder: "#8b5cf6",
  });

  // Re-apply active theme on mount
  useEffect(() => {
    const id = localStorage.getItem(ACTIVE_KEY);
    if (!id) {
      // Apply Classic Yellow by default
      applyTheme(PRESET_THEMES[0]);
      return;
    }
    const allThemes = [...PRESET_THEMES, ...loadThemes()];
    const theme = allThemes.find((t) => t.id === id);
    if (theme) applyTheme(theme);
  }, []);

  const handleApply = (theme: Theme) => {
    applyTheme(theme);
    setActiveId(theme.id);
    localStorage.setItem(ACTIVE_KEY, theme.id);
  };

  const handleDelete = (id: string) => {
    const updated = themes.filter((t) => t.id !== id);
    setThemes(updated);
    saveThemes(updated);
    if (activeId === id) {
      localStorage.removeItem(ACTIVE_KEY);
      setActiveId(null);
    }
  };

  const handleCreate = () => {
    if (!form.name.trim()) return;
    const newTheme: Theme = {
      ...form,
      id: `custom-${Date.now()}`,
    };
    const updated = [...themes, newTheme];
    setThemes(updated);
    saveThemes(updated);
    setForm({
      name: "",
      bgType: "gradient",
      bgColor1: "#0a0a1a",
      bgColor2: "#1a0a2e",
      ticketBg: "#FFE135",
      ticketBorder: "#8b5cf6",
    });
  };

  const allThemes = [...PRESET_THEMES, ...themes];

  return (
    <div className="space-y-6">
      {/* Preset & saved themes */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-heading font-bold text-muted-foreground uppercase tracking-widest mb-4">
          ✦ Available Themes
        </h3>
        <div className="grid gap-3">
          {allThemes.map((theme) => (
            <div
              key={theme.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                activeId === theme.id
                  ? "border-primary/60 bg-primary/10"
                  : "border-border/40 glass"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Color preview */}
                <div
                  className="w-8 h-8 rounded-lg border border-white/10 flex-shrink-0"
                  style={{
                    background:
                      theme.bgType === "gradient"
                        ? `linear-gradient(135deg, ${theme.bgColor1}, ${theme.bgColor2})`
                        : theme.bgColor1,
                  }}
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {theme.name}
                  </p>
                  {activeId === theme.id && (
                    <p className="text-xs text-primary">● Active</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApply(theme)}
                  className="text-xs bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30"
                  data-ocid="theme.primary_button"
                >
                  Apply
                </Button>
                {!theme.id.startsWith("preset-") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(theme.id)}
                    className="text-destructive hover:bg-destructive/10 w-8 h-8 p-0"
                    data-ocid="theme.delete_button"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create custom theme */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-heading font-bold text-muted-foreground uppercase tracking-widest mb-4">
          ✦ Create Custom Theme
        </h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Theme Name
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="My Custom Theme"
              className="glass border-border"
              data-ocid="theme.input"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Background Type
            </Label>
            <div className="flex gap-3">
              {(["gradient", "solid"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, bgType: t }))}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    form.bgType === t
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "glass text-muted-foreground border border-border/40"
                  }`}
                  data-ocid="theme.toggle"
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                {form.bgType === "gradient" ? "Color 1" : "Background Color"}
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.bgColor1}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bgColor1: e.target.value }))
                  }
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                />
                <Input
                  value={form.bgColor1}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bgColor1: e.target.value }))
                  }
                  className="glass border-border font-mono text-xs"
                  placeholder="#0a0a1a"
                />
              </div>
            </div>
            {form.bgType === "gradient" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Color 2
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.bgColor2}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bgColor2: e.target.value }))
                    }
                    className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <Input
                    value={form.bgColor2}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bgColor2: e.target.value }))
                    }
                    className="glass border-border font-mono text-xs"
                    placeholder="#1a0a2e"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Ticket Background
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.ticketBg}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ticketBg: e.target.value }))
                  }
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                />
                <Input
                  value={form.ticketBg}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ticketBg: e.target.value }))
                  }
                  className="glass border-border font-mono text-xs"
                  placeholder="#FFE135"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Ticket Border
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.ticketBorder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ticketBorder: e.target.value }))
                  }
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                />
                <Input
                  value={form.ticketBorder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ticketBorder: e.target.value }))
                  }
                  className="glass border-border font-mono text-xs"
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div
            className="h-16 rounded-xl border border-white/10 flex items-center justify-center"
            style={{
              background:
                form.bgType === "gradient"
                  ? `linear-gradient(135deg, ${form.bgColor1}, ${form.bgColor2})`
                  : form.bgColor1,
            }}
          >
            <div
              className="px-4 py-2 rounded-lg text-xs font-semibold"
              style={{
                background: form.ticketBg,
                border: `1px solid ${form.ticketBorder}`,
                color: "#111",
              }}
            >
              Ticket Preview
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!form.name.trim()}
            className="w-full bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30"
            data-ocid="theme.submit_button"
          >
            Save Theme
          </Button>
        </div>
      </div>
    </div>
  );
}
