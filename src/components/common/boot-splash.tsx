import { motion, useReducedMotion, type Easing } from 'motion/react';

import './boot-splash.css';

type BootSplashProps = {
  exiting: boolean;
};

const SEQUENCE_DURATION_SECONDS = 2.4;
export const BOOT_SPLASH_MIN_DURATION_MS = Math.round(SEQUENCE_DURATION_SECONDS * 1000);

const UN_ANIMATE = { opacity: [0, 0, 1, 1, 0], y: [10, 10, 0, 0, 0] };
const UN_TIMES = [0, 0.04, 0.26, 0.8, 1];
const UN_EASE: Easing[] = ['linear', 'easeOut', 'linear', 'easeIn'];
const FOLD_ANIMATE = { opacity: [0, 0, 1, 1, 0], y: [10, 10, 0, 0, 0] };
const FOLD_TIMES = [0, 0.38, 0.62, 0.8, 1];
const FOLD_EASE: Easing[] = ['linear', 'easeOut', 'linear', 'easeIn'];

const BASE_LOOP_TRANSITION = {
  duration: SEQUENCE_DURATION_SECONDS,
  repeat: Number.POSITIVE_INFINITY,
  repeatDelay: 0.3,
} as const;

export function BootSplash({ exiting }: BootSplashProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`boot-loader ${exiting ? 'is-exiting' : ''}`} aria-hidden="true">
      <svg
        className="boot-loader__noise"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="presentation"
        focusable="false"
      >
        <defs>
          <filter id="boot-grain-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              seed="9"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect x="0" y="0" width="100" height="100" />
      </svg>

      <div className="boot-loader__scene">
        <div className="boot-loader__text boot-loader__stack">
          <motion.span
            className="boot-loader__segment"
            initial={{ opacity: 0, y: 10 }}
            animate={reduceMotion ? { opacity: 1, y: 0 } : UN_ANIMATE}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { ...BASE_LOOP_TRANSITION, times: UN_TIMES, ease: UN_EASE }
            }
          >
            un
          </motion.span>
          <motion.span
            className="boot-loader__segment"
            initial={{ opacity: 0, y: 10 }}
            animate={reduceMotion ? { opacity: 1, y: 0 } : FOLD_ANIMATE}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { ...BASE_LOOP_TRANSITION, times: FOLD_TIMES, ease: FOLD_EASE }
            }
          >
            fold
          </motion.span>
        </div>
      </div>
    </div>
  );
}
