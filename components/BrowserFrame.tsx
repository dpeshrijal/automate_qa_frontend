import React from "react";
import { Lock, RotateCw } from "lucide-react";

interface BrowserFrameProps {
  url: string;
  children: React.ReactNode;
}

export function BrowserFrame({ url, children }: BrowserFrameProps) {
  // Truncate URL for display if too long
  const displayUrl = url.length > 50 ? url.substring(0, 50) + "..." : url;

  return (
    <div className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-2xl bg-white">
      {/* Browser Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-4">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-amber-400/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
        </div>

        {/* Address Bar */}
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-500 shadow-sm">
          <Lock className="w-3 h-3 text-slate-400" />
          <span className="font-mono select-all">
            {displayUrl || "about:blank"}
          </span>
          <div className="flex-1" />
          <RotateCw className="w-3 h-3 text-slate-400" />
        </div>
      </div>

      {/* Browser Content */}
      <div className="relative w-full bg-slate-100 min-h-[400px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
