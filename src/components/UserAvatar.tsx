"use client";

import React, { useState } from "react";
import { getDeterministicColor, getInitials } from "@/lib/formatters";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  badge?: React.ReactNode;
}

export default function UserAvatar({
  src,
  name = "Worker",
  size = 48,
  className = "",
  badge,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const initials = getInitials(name);
  const bgColor = getDeterministicColor(name || "User");

  return (
    <div
      className={`relative rounded-full flex items-center justify-center shrink-0 overflow-visible ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
    >
      {src && !hasError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || "User avatar"}
          className="w-full h-full rounded-full object-cover"
          onError={() => setHasError(true)}
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-white font-black select-none"
          style={{
            background: `linear-gradient(135deg, ${bgColor}, ${bgColor}CC)`,
            fontSize: Math.max(10, Math.floor(size * 0.38)),
            boxShadow: `0 2px 8px ${bgColor}33`,
          }}
        >
          {initials}
        </div>
      )}

      {badge && (
        <div className="absolute -bottom-0.5 -right-0.5 z-10 flex items-center justify-center">
          {badge}
        </div>
      )}
    </div>
  );
}
