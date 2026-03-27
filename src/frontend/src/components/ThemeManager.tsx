import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Theme {
  id: string;
  name: string;
  bgType: "gradient" | "solid" | "photo";
  bgColor1: string;
  bgColor2: string;
  bgPhotoData?: string; // base64 data URL for photo backgrounds
  ticketBg: string;
  ticketBorder: string;
  callBoardBg?: string; // base64 data URL for call board background photo
  callBoardBgType?: "default" | "photo";
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
    callBoardBgType: "default",
  },
  {
    id: "preset-neon-dark",
    name: "Neon Dark (Default)",
    bgType: "gradient",
    bgColor1: "#0a0a1a",
    bgColor2: "#1a0a2e",
    ticketBg: "#FFE135",
    ticketBorder: "rgba(139,92,246,0.4)",
    callBoardBgType: "default",
  },
  {
    id: "preset-ocean-blue",
    name: "Ocean Blue",
    bgType: "gradient",
    bgColor1: "#020c1b",
    bgColor2: "#0a2744",
    ticketBg: "rgba(5,30,70,0.75)",
    ticketBorder: "rgba(0,200,255,0.4)",
    callBoardBgType: "default",
  },
  {
    id: "preset-fire-red",
    name: "Fire Red",
    bgType: "gradient",
    bgColor1: "#1a0505",
    bgColor2: "#2e0a0a",
    ticketBg: "rgba(60,10,10,0.75)",
    ticketBorder: "rgba(239,68,68,0.5)",
    callBoardBgType: "default",
  },
  {
    id: "preset-forest-green",
    name: "Forest Green",
    bgType: "gradient",
    bgColor1: "#051a0a",
    bgColor2: "#0a2e14",
    ticketBg: "rgba(5,50,20,0.75)",
    ticketBorder: "rgba(34,197,94,0.4)",
    callBoardBgType: "default",
  },
  {
    id: "preset-royal-gold",
    name: "Royal Gold",
    bgType: "gradient",
    bgColor1: "#1a1400",
    bgColor2: "#2e2000",
    ticketBg: "rgba(50,35,0,0.75)",
    ticketBorder: "rgba(234,179,8,0.5)",
    callBoardBgType: "default",
  },
];

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  let bg: string;
  if (theme.bgType === "photo" && theme.bgPhotoData) {
    bg = `url(${theme.bgPhotoData}) center/cover no-repeat fixed`;
  } else if (theme.bgType === "gradient") {
    bg = `linear-gradient(135deg, ${theme.bgColor1}, ${theme.bgColor2})`;
  } else {
    bg = theme.bgColor1;
  }
  root.style.setProperty("--theme-bg", bg);
  root.style.setProperty("--theme-ticket-bg", theme.ticketBg);
  root.style.setProperty("--theme-ticket-border", theme.ticketBorder);

  // Call board background
  if (theme.callBoardBgType === "photo" && theme.callBoardBg) {
    root.style.setProperty(
      "--theme-callboard-bg",
      `url(${theme.callBoardBg}) center/cover no-repeat`,
    );
  } else {
    root.style.setProperty("--theme-callboard-bg", "");
  }
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
  const photoInputRef = useRef<HTMLInputElement>(null);
  const callBoardPhotoRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [callBoardPreview, setCallBoardPreview] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<Theme, "id">>({
    name: "",
    bgType: "gradient",
    bgColor1: "#0a0a1a",
    bgColor2: "#1a0a2e",
    bgPhotoData: undefined,
    ticketBg: "#FFE135",
    ticketBorder: "#8b5cf6",
    callBoardBgType: "default",
    callBoardBg: undefined,
  });

  // Re-apply active theme on mount
  useEffect(() => {
    const id = localStorage.getItem(ACTIVE_KEY);
    if (!id) {
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      setPhotoPreview(data);
      setForm((f) => ({ ...f, bgType: "photo", bgPhotoData: data }));
    };
    reader.readAsDataURL(file);
  };

  const handleCallBoardPhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      setCallBoardPreview(data);
      setForm((f) => ({ ...f, callBoardBgType: "photo", callBoardBg: data }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = () => {
    if (!form.name.trim()) return;
    if (form.bgType === "photo" && !form.bgPhotoData) return;
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
      bgPhotoData: undefined,
      ticketBg: "#FFE135",
      ticketBorder: "#8b5cf6",
      callBoardBgType: "default",
      callBoardBg: undefined,
    });
    setPhotoPreview(null);
    setCallBoardPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (callBoardPhotoRef.current) callBoardPhotoRef.current.value = "";
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
                {/* Preview swatch */}
                <div
                  className="w-8 h-8 rounded-lg border border-white/10 flex-shrink-0 overflow-hidden"
                  style={{
                    background:
                      theme.bgType === "photo" && theme.bgPhotoData
                        ? undefined
                        : theme.bgType === "gradient"
                          ? `linear-gradient(135deg, ${theme.bgColor1}, ${theme.bgColor2})`
                          : theme.bgColor1,
                  }}
                >
                  {theme.bgType === "photo" && theme.bgPhotoData && (
                    <img
                      src={theme.bgPhotoData}
                      alt="bg"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {theme.name}
                    {theme.bgType === "photo" && (
                      <span className="ml-2 text-xs text-accent">📷 Photo</span>
                    )}
                    {theme.callBoardBgType === "photo" && (
                      <span className="ml-1 text-xs text-cyan-400">
                        🎯 Board Photo
                      </span>
                    )}
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
            <div className="flex gap-3 flex-wrap">
              {(["gradient", "solid", "photo"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, bgType: t }));
                    if (t !== "photo") setPhotoPreview(null);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    form.bgType === t
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "glass text-muted-foreground border border-border/40"
                  }`}
                  data-ocid="theme.toggle"
                >
                  {t === "photo"
                    ? "📷 Photo"
                    : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Photo upload */}
          {form.bgType === "photo" && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Upload Background Photo
              </Label>
              <button
                type="button"
                className="border-2 border-dashed border-border/60 rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 transition-colors w-full"
                onClick={() => photoInputRef.current?.click()}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-h-32 mx-auto rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload a photo
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      JPG, PNG, WEBP supported
                    </p>
                  </div>
                )}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              {photoPreview && (
                <button
                  type="button"
                  className="text-xs text-destructive hover:underline"
                  onClick={() => {
                    setPhotoPreview(null);
                    setForm((f) => ({ ...f, bgPhotoData: undefined }));
                    if (photoInputRef.current) photoInputRef.current.value = "";
                  }}
                >
                  Remove photo
                </button>
              )}
            </div>
          )}

          {/* Color pickers for gradient/solid */}
          {form.bgType !== "photo" && (
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
          )}

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

          {/* Call Board Background section */}
          <div className="space-y-2 pt-2 border-t border-border/30">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              🎯 Call Board Background
            </Label>
            <div className="flex gap-3">
              {(["default", "photo"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, callBoardBgType: t }));
                    if (t === "default") {
                      setCallBoardPreview(null);
                      setForm((f) => ({
                        ...f,
                        callBoardBgType: "default",
                        callBoardBg: undefined,
                      }));
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    form.callBoardBgType === t
                      ? "bg-accent/20 text-accent border border-accent/40"
                      : "glass text-muted-foreground border border-border/40"
                  }`}
                  data-ocid="theme.toggle"
                >
                  {t === "photo" ? "📷 Photo" : "Default Glass"}
                </button>
              ))}
            </div>

            {form.callBoardBgType === "photo" && (
              <div className="space-y-2">
                <button
                  type="button"
                  className="border-2 border-dashed border-accent/40 rounded-xl p-3 text-center cursor-pointer hover:border-accent/60 transition-colors w-full"
                  onClick={() => callBoardPhotoRef.current?.click()}
                >
                  {callBoardPreview ? (
                    <img
                      src={callBoardPreview}
                      alt="Call board preview"
                      className="max-h-24 mx-auto rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-3">
                      <Upload className="w-6 h-6 text-accent/60" />
                      <p className="text-xs text-muted-foreground">
                        Upload call board background photo
                      </p>
                    </div>
                  )}
                </button>
                <input
                  ref={callBoardPhotoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCallBoardPhotoUpload}
                />
                {callBoardPreview && (
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={() => {
                      setCallBoardPreview(null);
                      setForm((f) => ({
                        ...f,
                        callBoardBg: undefined,
                        callBoardBgType: "default",
                      }));
                      if (callBoardPhotoRef.current)
                        callBoardPhotoRef.current.value = "";
                    }}
                  >
                    Remove call board photo
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          <div
            className="h-16 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden relative"
            style={{
              background:
                form.bgType === "photo" && photoPreview
                  ? undefined
                  : form.bgType === "gradient"
                    ? `linear-gradient(135deg, ${form.bgColor1}, ${form.bgColor2})`
                    : form.bgColor1,
            }}
          >
            {form.bgType === "photo" && photoPreview && (
              <img
                src={photoPreview}
                alt="bg preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div
              className="px-4 py-2 rounded-lg text-xs font-semibold relative z-10"
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
            disabled={
              !form.name.trim() ||
              (form.bgType === "photo" && !form.bgPhotoData)
            }
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
