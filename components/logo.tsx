"use client";

import { Activity } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Activity className="w-10 h-10 text-primary animate-pulse" />
      <span className="font-bold text-3xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        RepoPulse
      </span>
    </div>
  );
}