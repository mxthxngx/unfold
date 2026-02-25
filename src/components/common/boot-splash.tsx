import { motion, useReducedMotion } from 'motion/react';

import './boot-splash.css';

type BootSplashProps = {
  exiting: boolean;
};

const SEQUENCE_DURATION_SECONDS = 2.2;
export const BOOT_SPLASH_MIN_DURATION_MS = Math.round(SEQUENCE_DURATION_SECONDS * 1000);
export function BootSplash({ exiting }: BootSplashProps) {
  const reduceMotion = useReducedMotion();

  // Sequence: un in -> fold in -> both out.
  const sharedVariant = reduceMotion
    ? { opacity: 1, y: 0 }
    : {
        opacity: [0, 1, 1, 0],
        y: [0, 0, 0, 0],
      };

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
            initial={{ opacity: 0, y: 0 }}
            animate={sharedVariant}
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: SEQUENCE_DURATION_SECONDS,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }
            }
          >
            un
          </motion.span>
          <motion.span
            className="boot-loader__segment"
            initial={{ opacity: 0, y: 0 }}
            animate={sharedVariant}
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: SEQUENCE_DURATION_SECONDS,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                    delay: 0.35,
                  }
            }
          >
            fold
          </motion.span>
        </div>
      </div>
    </div>
  );
}
