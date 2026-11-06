"use client";

// Liquid Glass Navbar — Inspired by Apple's liquid glass design & gughigug (21st.dev)
// Features fluid liquid droplet stretching, gooey physics, hover meniscus, and backdrop refraction.

import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import { cn } from "@/lib/utils";

export interface LiquidNavbarItem {
  label: string;
  icon?: React.ReactNode | ((active: boolean) => React.ReactNode);
  fx?: "glow" | "spin" | "wave" | "drop" | "bounce" | "plane";
  href?: string;
  onClick?: () => void;
  badge?: string | number;
}

export interface LiquidNavbarProps {
  items: LiquidNavbarItem[];
  defaultActive?: number;
  active?: number;
  onChange?: (index: number) => void;
  tone?: "light" | "dark";
  sound?: boolean;
  className?: string;
  showLabels?: boolean;
}

// Built-in Nimbus SVG icons
export const NimbusIcons = {
  home: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="w-5 h-5 transition-transform duration-300">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  stethoscope: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="w-5 h-5 transition-transform duration-300">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v5a4 4 0 0 0 8 0V3m-9 0h2m6 0h2M12 12v3a5 5 0 0 0 10 0v-1.5m0 0a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
    </svg>
  ),
  notes: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="w-5 h-5 transition-transform duration-300">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  calendar: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="w-5 h-5 transition-transform duration-300">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  ),
  user: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="w-5 h-5 transition-transform duration-300">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
  globe: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="w-5 h-5 transition-transform duration-300">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
  drop: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="w-5 h-5 transition-transform duration-300">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-3.75 5.25-6.75 9-6.75 12.75a6.75 6.75 0 1 0 13.5 0c0-3.75-3-7.5-6.75-12.75Z" />
    </svg>
  ),
  plane: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="w-5 h-5 transition-transform duration-300">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  ),
};

export function LiquidNavbar({
  items,
  defaultActive = 0,
  active: controlledActive,
  onChange,
  tone = "light",
  className,
  showLabels = true,
}: LiquidNavbarProps) {
  const [internalActive, setInternalActive] = useState(defaultActive);
  const activeIndex = controlledActive !== undefined ? controlledActive : internalActive;

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; height: number }>({ left: 0, width: 0, height: 0 });
  const [stretching, setStretching] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const prevActiveRef = useRef(activeIndex);
  const filterId = useId().replace(/:/g, "-");

  const updateIndicator = useCallback((index: number, animateStretch = true) => {
    const el = itemsRef.current[index];
    const container = containerRef.current;
    if (!el || !container) return;

    const elRect = el.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    const left = elRect.left - contRect.left;
    const width = elRect.width;
    const height = elRect.height;

    if (animateStretch && prevActiveRef.current !== index) {
      setStretching(true);
      setTimeout(() => setStretching(false), 380);
    }

    setIndicatorStyle({ left, width, height });
    prevActiveRef.current = index;
  }, []);

  useEffect(() => {
    updateIndicator(activeIndex, true);
  }, [activeIndex, updateIndicator]);

  useEffect(() => {
    const handleResize = () => updateIndicator(activeIndex, false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex, updateIndicator]);

  const handleSelect = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (controlledActive === undefined) {
      setInternalActive(index);
    }
    onChange?.(index);
    items[index]?.onClick?.();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  const isDark = tone === "dark";

  return (
    <>
      {/* SVG Gooey Filter for Liquid Droplet Fluidity */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id={`liquid-goo-${filterId}`}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <nav
        ref={containerRef}
        aria-label="Liquid navigation bar"
        className={cn(
          "relative inline-flex items-center gap-1.5 p-1.5 rounded-full transition-all duration-300",
          isDark
            ? "bg-slate-900/80 border border-white/10 shadow-[0_16px_36px_-10px_rgba(0,0,0,0.6),inset_0_1px_1px_0_rgba(255,255,255,0.15)] text-slate-300 backdrop-blur-2xl"
            : "bg-white/85 border border-[#dce8e0] shadow-[0_20px_45px_-12px_rgba(15,98,87,0.16),inset_0_1px_2px_0_rgba(255,255,255,0.9)] text-[#4a635b] backdrop-blur-xl",
          className
        )}
      >
        {/* Liquid Glass Highlight Droplet (Gooey Fluid Physics) */}
        <div
          className="absolute inset-0 pointer-events-none rounded-full overflow-hidden"
          style={{ filter: `url(#liquid-goo-${filterId})` }}
        >
          {indicatorStyle.width > 0 && (
            <div
              className={cn(
                "absolute top-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                isDark
                  ? "bg-gradient-to-r from-teal-500/30 via-emerald-400/40 to-teal-400/30 border border-emerald-400/40 shadow-[0_0_20px_rgba(45,212,191,0.4)]"
                  : "bg-gradient-to-r from-[#0f6257] to-[#127a6c] shadow-[0_8px_20px_-4px_rgba(15,98,87,0.38),inset_0_1px_1px_rgba(255,255,255,0.3)]",
                stretching && "scale-x-110 scale-y-90"
              )}
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                height: `${indicatorStyle.height}px`,
              }}
            >
              {/* Internal Liquid Lens Highlight */}
              <div className="absolute inset-x-2 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/35 to-transparent blur-[0.5px]" />
            </div>
          )}
        </div>

        {/* Hover Meniscus Tracking Droplet */}
        {hoverIndex !== null && hoverIndex !== activeIndex && (
          <div
            className={cn(
              "absolute top-1.5 rounded-full pointer-events-none transition-all duration-300 ease-out",
              isDark ? "bg-white/5" : "bg-[#0f6257]/5"
            )}
            style={{
              left: `${itemsRef.current[hoverIndex]?.offsetLeft || 0}px`,
              width: `${itemsRef.current[hoverIndex]?.offsetWidth || 0}px`,
              height: `${itemsRef.current[hoverIndex]?.offsetHeight || 0}px`,
            }}
          />
        )}

        {/* Navigation Items */}
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const isHovered = index === hoverIndex;

          return (
            <button
              key={item.label}
              ref={(el) => {
                itemsRef.current[index] = el;
              }}
              type="button"
              onClick={(e) => handleSelect(index, e)}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative z-10 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold select-none cursor-pointer outline-none transition-all duration-200",
                isActive
                  ? isDark
                    ? "text-emerald-300 font-bold"
                    : "text-white font-bold"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-[#526d64] hover:text-[#183a33]"
              )}
            >
              {/* Icon with interactive FX animation */}
              {item.icon && (
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center transition-transform duration-300",
                    isActive && item.fx === "glow" && "drop-shadow-[0_0_8px_rgba(45,212,191,0.6)] scale-110",
                    isHovered && item.fx === "spin" && "rotate-45",
                    isHovered && item.fx === "bounce" && "-translate-y-0.5",
                    isActive && item.fx === "drop" && "animate-pulse"
                  )}
                >
                  {typeof item.icon === "function" ? item.icon(isActive) : item.icon}
                </span>
              )}

              {/* Text label */}
              {showLabels && <span className="tracking-tight whitespace-nowrap">{item.label}</span>}

              {/* Notification Badge */}
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-extrabold leading-none",
                    isActive
                      ? "bg-white text-[#0f6257]"
                      : isDark
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-[#e2efe8] text-[#0f6257]"
                  )}
                >
                  {item.badge}
                </span>
              )}

              {/* Click Ripple Effect */}
              {ripples.map((ripple) => (
                <span
                  key={ripple.id}
                  className="pointer-events-none absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 animate-ping"
                  style={{ left: ripple.x, top: ripple.y }}
                />
              ))}
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default LiquidNavbar;

