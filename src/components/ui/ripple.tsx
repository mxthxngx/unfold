"use client";

import React, { useState, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface RippleProps {
  color?: string;
  duration?: number;
}

interface RippleStyle {
  x: number;
  y: number;
  size: number;
}

export const Ripple: React.FC<RippleProps> = ({
  color = "rgba(255, 255, 255, 0.3)",
  duration = 800,
}) => {
  return (
    <RippleContainer color={color} duration={duration} />
  );
};

const RippleContainer = ({ color, duration }: RippleProps) => {
  const [ripples, setRipples] = useState<{ key: number; style: RippleStyle }[]>([]);
  const ref = React.useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;

    // Make sure parent is relative and overflow hidden for the ripple to be contained
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.position === 'static') {
        parent.style.position = 'relative';
    }
    if (parentStyle.overflow !== 'hidden') {
        parent.style.overflow = 'hidden';
    }

    let rippleCount = 0;
    const handleMouseDown = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const newRipple = {
        key: Date.now() + rippleCount++,
        style: { x, y, size },
      };

      setRipples((prev) => [...prev, newRipple]);
    };

    parent.addEventListener('mousedown', handleMouseDown);
    return () => {
      parent.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-[inherit]">
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.key}
            initial={{ transform: "scale(0)", opacity: 0.35 }}
            animate={{ transform: "scale(2)", opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: (duration || 800) / 1000 }}
            style={{
              position: "absolute",
              left: ripple.style.x,
              top: ripple.style.y,
              width: ripple.style.size,
              height: ripple.style.size,
              backgroundColor: color,
              borderRadius: "50%",
              pointerEvents: "none",
            }}
            onAnimationComplete={() => {
                setRipples((prev) => prev.filter((r) => r.key !== ripple.key));
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
