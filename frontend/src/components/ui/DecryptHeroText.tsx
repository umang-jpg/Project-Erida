import React, { useState, useEffect, useRef } from 'react';

interface DecryptHeroTextProps {
  children: string;
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789⌬⌭⌰⌯⌖⋔⋕⋗⋘⋙⋚◈◇◆□△▽◉∆ΛΩΨΣ▓▒░█';

export const DecryptHeroText: React.FC<DecryptHeroTextProps> = ({ children }) => {
  const [displayedText, setDisplayedText] = useState(children);
  const originalText = children;
  
  // Track if prefers-reduced-motion is active
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedText(originalText);
      return;
    }

    let isUnmounted = false;
    let animationFrameId: number;
    let timeoutId: any;

    // We store states for each character:
    // targetChar: original character
    // currentChar: currently visible character
    // revealTime: timestamp when this character should start to resolve/reveal
    // state: 'idle' | 'scrambling' | 'resolved'
    interface CharState {
      index: number;
      targetChar: string;
      currentChar: string;
      delay: number; // delay in ms from start of phase
      duration: number; // duration of phase in ms
      startVal: string;
    }

    const startAnimation = (mode: 'reveal' | 'encrypt') => {
      const startTime = performance.now();
      const chars: CharState[] = [];
      const len = originalText.length;

      for (let i = 0; i < len; i++) {
        const char = originalText[i];
        if (char === ' ') {
          chars.push({
            index: i,
            targetChar: ' ',
            currentChar: ' ',
            delay: 0,
            duration: 0,
            startVal: ' '
          });
          continue;
        }

        const delay = i * (10 + Math.random() * 30);
        const duration = 400 + Math.random() * 200;

        chars.push({
          index: i,
          targetChar: char,
          currentChar: mode === 'reveal' ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : char,
          delay,
          duration,
          startVal: mode === 'reveal' ? '' : char
        });
      }

      const totalDuration = mode === 'reveal' ? 900 : 600;

      const tick = (now: number) => {
        if (isUnmounted) return;
        const elapsed = now - startTime;
        let allDone = true;

        const renderedChars = chars.map((c) => {
          if (c.targetChar === ' ') {
            return <span key={c.index}> </span>;
          }

          let charToShow = '';
          let isScrambled = false;

          if (mode === 'reveal') {
            if (elapsed < c.delay) {
              allDone = false;
              charToShow = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              isScrambled = true;
            } else if (elapsed < c.delay + c.duration) {
              allDone = false;
              const progress = (elapsed - c.delay) / c.duration;
              if (progress > 0.85 && Math.random() < 0.4) {
                charToShow = c.targetChar;
              } else {
                charToShow = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                isScrambled = true;
              }
            } else {
              charToShow = c.targetChar;
            }
          } else {
            if (elapsed < c.delay) {
              allDone = false;
              if (Math.random() < (elapsed / totalDuration)) {
                charToShow = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                isScrambled = true;
              } else {
                charToShow = c.targetChar;
              }
            } else if (elapsed < c.delay + c.duration) {
              allDone = false;
              charToShow = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              isScrambled = true;
            } else {
              charToShow = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              isScrambled = true;
            }
          }

          if (isScrambled) {
            return (
              <span
                key={c.index}
                style={{
                  color: '#FF6B2B',
                  textShadow: '0 0 10px rgba(255, 107, 43, 0.9), 0 0 20px rgba(255, 107, 43, 0.5)',
                  transition: 'color 0.1s ease, text-shadow 0.1s ease',
                }}
              >
                {charToShow}
              </span>
            );
          } else {
            return (
              <span
                key={c.index}
                style={{
                  color: '#F5F0E8',
                  textShadow: '0 0 15px rgba(245,240,232,0.8), 0 0 30px rgba(245,240,232,0.4)',
                  transition: 'color 0.25s ease, text-shadow 0.25s ease',
                }}
              >
                {charToShow}
              </span>
            );
          }
        });

        setDisplayedText(renderedChars as any);

        if (!allDone && elapsed < totalDuration + 500) {
          animationFrameId = requestAnimationFrame(tick);
        } else {
          if (mode === 'reveal') {
            const finalNormal = originalText.split('').map((ch, idx) => (
              <span
                key={idx}
                style={{
                  color: '#F5F0E8',
                  textShadow: '0 0 15px rgba(245,240,232,0.8), 0 0 30px rgba(245,240,232,0.4)',
                }}
              >
                {ch}
              </span>
            ));
            setDisplayedText(finalNormal as any);
            const nextInterval = 4000 + Math.random() * 4000;
            timeoutId = setTimeout(() => {
              startAnimation('encrypt');
            }, nextInterval);
          } else {
            const waitTime = 300 + Math.random() * 300;
            timeoutId = setTimeout(() => {
              startAnimation('reveal');
            }, waitTime);
          }
        }
      };

      animationFrameId = requestAnimationFrame(tick);
    };

    startAnimation('reveal');

    return () => {
      isUnmounted = true;
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [prefersReducedMotion, originalText]);

  return <>{displayedText}</>;
};
