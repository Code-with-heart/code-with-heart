"use client"

import * as React from "react"
import { User } from "lucide-react"

const getInitials = (fullName) => {
  if (!fullName) return null;
  const names = fullName.trim().split(/\s+/);
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

export function UserAvatar({ fullName, profilePictureUrl, size = "default" }) {
  const [imageError, setImageError] = React.useState(false);
  const initials = getInitials(fullName);

  const sizeClasses = {
    small: "size-6 text-[10px]",
    default: "size-8 text-xs",
    large: "size-10 text-sm"
  };

  // Reset error state when profilePictureUrl changes
  React.useEffect(() => {
    setImageError(false);
  }, [profilePictureUrl]);

  // If we have a profile picture URL and it hasn't failed to load, use it
  if (profilePictureUrl && !imageError) {
    return (
      <img 
        src={profilePictureUrl} 
        alt={fullName || "Profile picture"}
        className={`aspect-square rounded-lg object-cover flex-shrink-0 ${sizeClasses[size] || sizeClasses.default}`}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback to initials/icon
  return (
    <div className={`flex aspect-square items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex-shrink-0 font-semibold ${sizeClasses[size] || sizeClasses.default}`}>
      {initials || <User className="size-4" />}
    </div>
  );
}
