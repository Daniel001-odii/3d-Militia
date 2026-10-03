/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Crosshair, 
  RotateCcw, 
  Bomb, 
  Target, 
  Flame, 
  ArrowLeftRight,
  Pause,
  Swords
} from 'lucide-react';

interface Props {
  onVirtualMove: (forward: number, strafe: number, wantsFly: boolean) => void;
  onVirtualLook: (dx: number, dy: number) => void;
  onSetFiring: (isFiring: boolean) => void;
  onToggleADS: () => void;
  onThrowGrenade: () => void;
  onReload: () => void;
  onSwitchWeapon: () => void;
  onMelee: () => void;
  onPause: () => void;
  grenadeCount: number;
}

export const MobileControls: React.FC<Props> = ({
  onVirtualMove,
  onVirtualLook,
  onSetFiring,
  onToggleADS,
  onThrowGrenade,
  onReload,
  onSwitchWeapon,
  onMelee,
  onPause,
  grenadeCount,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickCenter, setJoystickCenter] = useState<{ x: number; y: number } | null>(null);
  const [stickOffset, setStickOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const moveTouchIdRef = useRef<number | null>(null);
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef<{ x: number; y: number } | null>(null);
  const wantsFlyRef = useRef(false);

  // Detect mobile or touch capability
  useEffect(() => {
    const checkMobile = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 1024;
      setIsMobile(hasTouch || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update flying state
  useEffect(() => {
    wantsFlyRef.current = isBoosting;
  }, [isBoosting]);

  if (!isMobile) return null;

  // Joystick (Left half) touch handling
  const handleJoystickStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    moveTouchIdRef.current = touch.identifier;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = touch.clientX - rect.left;
    const centerY = touch.clientY - rect.top;

    setJoystickCenter({ x: centerX, y: centerY });
    setStickOffset({ x: 0, y: 0 });
    setJoystickActive(true);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (!joystickActive || !joystickCenter || moveTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === moveTouchIdRef.current) {
        const rect = e.currentTarget.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;

        const deltaX = currentX - joystickCenter.x;
        const deltaY = currentY - joystickCenter.y;
        const distance = Math.hypot(deltaX, deltaY);
        const maxRadius = 45;

        const angle = Math.atan2(deltaY, deltaX);
        const clampedDist = Math.min(distance, maxRadius);
        const clampedX = Math.cos(angle) * clampedDist;
        const clampedY = Math.sin(angle) * clampedDist;

        setStickOffset({ x: clampedX, y: clampedY });

        // Normalize inputs (-1 to 1)
        const strafe = clampedX / maxRadius; // right is positive
        const forward = -clampedY / maxRadius; // up is positive forward

        onVirtualMove(forward, strafe, wantsFlyRef.current);
        break;
      }
    }
  };

  const handleJoystickEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === moveTouchIdRef.current) {
        moveTouchIdRef.current = null;
        setJoystickActive(false);
        setJoystickCenter(null);
        setStickOffset({ x: 0, y: 0 });
        onVirtualMove(0, 0, wantsFlyRef.current);
        break;
      }
    }
  };

  // Look Zone (Right half) touch handling
  const handleLookStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    lookTouchIdRef.current = touch.identifier;
    lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookMove = (e: React.TouchEvent) => {
    if (lookTouchIdRef.current === null || !lastLookPosRef.current) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const dx = touch.clientX - lastLookPosRef.current.x;
        const dy = touch.clientY - lastLookPosRef.current.y;

        onVirtualLook(dx * 1.8, dy * 1.8);
        lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
        break;
      }
    }
  };

  const handleLookEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        lastLookPosRef.current = null;
        break;
      }
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 font-['Rajdhani'] select-none touch-none">
      {/* Top Mobile Pause / Menu Button */}
      <div className="absolute top-3 right-3 pointer-events-auto z-40">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onPause();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onPause();
          }}
          className="px-3 py-2 rounded-xl bg-neutral-950/90 active:bg-neutral-800 border border-neutral-700 text-neutral-300 active:text-white flex items-center gap-1.5 shadow-lg backdrop-blur-md"
          title="Pause Game (ESC)"
        >
          <Pause className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold font-['Chakra_Petch'] uppercase tracking-wider text-amber-400">PAUSE</span>
        </button>
      </div>

      {/* Left Touch Zone: Movement & Joystick Area */}
      <div
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
        className="absolute left-0 bottom-0 w-[45%] h-[55%] pointer-events-auto touch-none"
      >
        {/* Visual Joystick base & thumb knob */}
        {joystickActive && joystickCenter ? (
          <div
            className="absolute w-28 h-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30 bg-black/40 backdrop-blur-xs flex items-center justify-center pointer-events-none"
            style={{ left: joystickCenter.x, top: joystickCenter.y }}
          >
            <div
              className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
              style={{
                transform: `translate(${stickOffset.x}px, ${stickOffset.y}px)`,
              }}
            />
          </div>
        ) : (
          /* Default hint circle in bottom left */
          <div className="absolute left-6 bottom-6 w-22 h-22 rounded-full border border-dashed border-white/30 bg-black/30 flex flex-col items-center justify-center text-[10px] text-white/60 font-bold uppercase tracking-wider pointer-events-none">
            <span>Touch & Drag</span>
            <span className="text-[9px] text-amber-400 font-['Chakra_Petch']">MOVE</span>
          </div>
        )}

        {/* Jetpack Booster Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsBoosting(true);
            onVirtualMove(0, 0, true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsBoosting(false);
            onVirtualMove(0, 0, false);
          }}
          onTouchCancel={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsBoosting(false);
            onVirtualMove(0, 0, false);
          }}
          onMouseDown={() => {
            setIsBoosting(true);
            onVirtualMove(0, 0, true);
          }}
          onMouseUp={() => {
            setIsBoosting(false);
            onVirtualMove(0, 0, false);
          }}
          className={`absolute left-6 bottom-32 w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-95 touch-none ${
            isBoosting
              ? 'bg-cyan-500 border-cyan-300 text-white shadow-[0_0_16px_rgba(6,182,212,0.8)]'
              : 'bg-neutral-950/85 border-cyan-500/70 text-cyan-400'
          }`}
        >
          <Flame className="w-5 h-5 mb-0.5 animate-pulse" />
          <span className="text-[9px] font-bold uppercase leading-none font-['Chakra_Petch']">BOOST</span>
        </button>
      </div>

      {/* Right Touch Zone: Swipe to Look Pad */}
      <div
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
        className="absolute right-0 bottom-0 w-[55%] h-[75%] pointer-events-auto touch-none"
      >
        {/* Look Drag Hint */}
        <div className="absolute right-36 bottom-28 text-[10px] text-white/30 font-bold uppercase tracking-widest pointer-events-none hidden sm:block">
          Swipe to Aim
        </div>

        {/* Right Mobile Action Cluster */}
        <div className="absolute right-3 bottom-4 flex flex-col items-end gap-2.5 pointer-events-auto">
          {/* Secondary Action Row: AIM (ADS), SWAP, RELOAD, GRENADE */}
          <div className="flex items-center gap-2">
            {/* Grenade Button */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onThrowGrenade();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onThrowGrenade();
              }}
              disabled={grenadeCount <= 0}
              className="w-11 h-11 rounded-full bg-emerald-950/85 active:bg-emerald-800 disabled:opacity-40 border border-emerald-500/60 text-emerald-400 flex flex-col items-center justify-center shadow-md relative"
              title="Throw Grenade"
            >
              <Bomb className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[9px] font-bold text-neutral-950 flex items-center justify-center">
                {grenadeCount}
              </span>
            </button>

            {/* Reload Button */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onReload();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onReload();
              }}
              className="w-11 h-11 rounded-full bg-neutral-900/85 active:bg-neutral-800 border border-neutral-700 text-neutral-200 active:text-white flex items-center justify-center shadow-md"
              title="Reload Magazine"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Swap Weapon Button */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSwitchWeapon();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSwitchWeapon();
              }}
              className="w-12 h-12 rounded-full bg-neutral-900/85 active:bg-neutral-800 border border-amber-500/60 text-amber-400 font-bold text-[10px] flex flex-col items-center justify-center shadow-md font-['Chakra_Petch']"
              title="Swap Weapon"
            >
              <ArrowLeftRight className="w-4 h-4 mb-0.5" />
              <span>SWAP</span>
            </button>

            {/* Aim / ADS Button */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleADS();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleADS();
              }}
              className="w-13 h-13 rounded-full bg-neutral-950/90 active:bg-emerald-950 border-2 border-emerald-500 text-emerald-400 font-bold text-[10px] flex flex-col items-center justify-center shadow-xl font-['Chakra_Petch']"
              title="Aim Down Sights"
            >
              <Target className="w-5 h-5 mb-0.5" />
              <span>AIM</span>
            </button>
          </div>

          {/* Primary Action Row: Melee & Big FIRE Button */}
          <div className="flex items-center gap-2.5">
            {/* Melee Bash Button */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMelee();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onMelee();
              }}
              className="w-12 h-12 rounded-full bg-neutral-900/85 active:bg-neutral-800 border border-neutral-700 text-rose-400 flex items-center justify-center shadow-md"
              title="Melee Bash"
            >
              <Swords className="w-5 h-5" />
            </button>

            {/* Big FIRE Button */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSetFiring(true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSetFiring(false);
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSetFiring(false);
              }}
              onMouseDown={() => onSetFiring(true)}
              onMouseUp={() => onSetFiring(false)}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-700 to-rose-500 active:from-rose-600 active:to-rose-400 border-2 border-rose-300 text-white font-black text-sm flex flex-col items-center justify-center shadow-[0_0_24px_rgba(244,63,94,0.7)] active:scale-95 transition-transform touch-none"
            >
              <Crosshair className="w-7 h-7 mb-0.5" />
              <span className="font-['Chakra_Petch'] tracking-wider">FIRE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
