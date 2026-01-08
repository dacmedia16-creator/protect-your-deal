import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string;
  imageUrl?: string;
  role?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const roleColors: Record<string, string> = {
  super_admin: "bg-destructive text-destructive-foreground",
  imobiliaria_admin: "bg-primary text-primary-foreground",
  corretor: "bg-secondary text-secondary-foreground",
};

const sizeClasses: Record<string, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function UserAvatar({ name, imageUrl, role = "corretor", size = "md", className }: UserAvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
      <AvatarFallback className={cn(roleColors[role] || roleColors.corretor)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
