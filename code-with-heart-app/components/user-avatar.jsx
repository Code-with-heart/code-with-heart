"use client"

import { User } from "lucide-react"

const getInitials = (fullName) => {
  if (!fullName) return null;
  const names = fullName.trim().split(/\s+/);
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

export function UserAvatar({ fullName, size = "default" }) {
  const initials = getInitials(fullName);

  const sizeClasses = {
    small: "size-6 text-[10px]",
    default: "size-8 text-xs",
    large: "size-10 text-sm"
  };

  return (
    <div className={`flex aspect-square items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex-shrink-0 font-semibold ${sizeClasses[size] || sizeClasses.default}`}>
      {initials || <User className="size-4" />}
    </div>
  );
}
