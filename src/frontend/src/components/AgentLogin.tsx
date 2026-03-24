import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type React from "react";
import { useState } from "react";

interface Props {
  onLogin: (success: boolean) => void;
  onBack: () => void;
}

export default function AgentLogin({ onLogin, onBack }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (username === "mugi" && password === "2026") {
        onLogin(true);
      } else {
        setError("Invalid credentials. Please try again.");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 animate-float">🎱</div>
          <h1 className="text-2xl font-heading font-bold text-foreground neon-text-purple">
            Agent Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Neon Tambola Live Control Center
          </p>
        </div>

        <div className="glass-heavy rounded-2xl p-8 shadow-card-glow">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label
                htmlFor="agent-username"
                className="text-xs text-primary/80 uppercase tracking-wider font-mono"
              >
                Username
              </Label>
              <Input
                id="agent-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass border-border focus:border-primary/60 focus:shadow-neon-purple"
                placeholder="Enter username"
                data-ocid="login.input"
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="agent-password"
                className="text-xs text-primary/80 uppercase tracking-wider font-mono"
              >
                Password
              </Label>
              <Input
                id="agent-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass border-border focus:border-primary/60 focus:shadow-neon-purple"
                placeholder="Enter password"
                data-ocid="login.input"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p
                className="text-destructive text-sm text-center"
                data-ocid="login.error_state"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold shadow-neon-purple transition-all duration-300"
              data-ocid="login.submit_button"
            >
              {loading ? "Authenticating..." : "Login"}
            </Button>
          </form>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
            data-ocid="login.secondary_button"
          >
            ← Back to Player View
          </button>
        </div>
      </div>
    </div>
  );
}
