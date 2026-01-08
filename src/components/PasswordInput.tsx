import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Copy, RefreshCw, Check } from "lucide-react";
import { generatePassword, getPasswordStrength } from "@/lib/password";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showGenerator?: boolean;
  showStrength?: boolean;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = "Mínimo 6 caracteres",
  showGenerator = true,
  showStrength = true,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const strength = getPasswordStrength(value);

  const handleGenerate = () => {
    const newPassword = generatePassword(12);
    onChange(newPassword);
    setShowPassword(true);
  };

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Senha copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pr-20"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        {showGenerator && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleGenerate}
            title="Gerar senha"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showStrength && value && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= strength.score ? strength.color : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{strength.label}</p>
        </div>
      )}
    </div>
  );
}
