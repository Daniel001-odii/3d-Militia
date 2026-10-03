/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TargetEnemyInfo } from '../game/engine';
import { 
  Play, 
  RotateCcw, 
  Sliders, 
  LogOut, 
  Shield, 
  Crosshair, 
  Volume2, 
  HelpCircle,
  X
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  sectorName: string;
  scores: { red: number; blue: number };
  playerKills: number;
  targetEnemy: TargetEnemyInfo | null;
  mouseSensitivity: number;
  onSensitivityChange: (val: number) => void;
  onResume: () => void;
  onOpenLoadout: () => void;
  onRestartMatch: () => void;
  onQuitToMenu: () => void;
}

export const PauseMenuModal: React.FC<Props> = ({
  isOpen,
  sectorName,
  scores,
  playerKills,
  targetEnemy,
  mouseSensitivity,
  onSensitivityChange,
  onResume,
  onOpenLoadout,
  onRestartMatch,
  onQuitToMenu,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md font-['Rajdhani'] select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-5 sm:p-7 space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black font-['Chakra_Petch'] uppercase tracking-wider text-white">
                Mission Paused
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                SECTOR: <span className="text-amber-400 font-bold">{sectorName.toUpperCase()}</span> · ESC TO RESUME
              </p>
            </div>
          </div>

          <button
            onClick={onResume}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border border-neutral-800"
            title="Resume"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tactical Intel Card */}
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3.5 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-neutral-400">Active Target</span>
            <div className="flex items-center gap-2 font-bold text-rose-400 font-['Chakra_Petch']">
              <Crosshair className="w-3.5 h-3.5 text-rose-500" />
              <span>{targetEnemy ? targetEnemy.name : 'Awaiting Next Hostile'}</span>
              {targetEnemy && (
                <span className="text-neutral-400 text-[10px] font-mono">[{targetEnemy.weapon.toUpperCase()}]</span>
              )}
            </div>
          </div>

          <div className="text-right space-y-0.5 border-l border-neutral-800 pl-4">
            <span className="text-[10px] uppercase font-mono text-neutral-400">Combat Score</span>
            <div className="font-mono font-bold text-emerald-400 text-sm">
              {playerKills * 100} PTS <span className="text-neutral-500 text-xs">({playerKills} Kills)</span>
            </div>
          </div>
        </div>

        {/* Mouse / Look Sensitivity Slider */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold font-['Chakra_Petch'] uppercase">
            <span className="text-neutral-300">Look Sensitivity</span>
            <span className="text-amber-400 font-mono">{(mouseSensitivity * 1000).toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.001"
            max="0.005"
            step="0.0002"
            value={mouseSensitivity}
            onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
            <span>Slow & Precise</span>
            <span>Fast Reflex</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Resume */}
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black font-['Chakra_Petch'] uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Mission</span>
          </button>

          {/* Change Loadout */}
          <button
            onClick={onOpenLoadout}
            className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 hover:border-amber-500/50 text-neutral-200 hover:text-white font-bold font-['Chakra_Petch'] uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Change Loadout & Armory</span>
          </button>

          {/* Restart Match */}
          <button
            onClick={onRestartMatch}
            className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 hover:border-neutral-600 text-neutral-300 hover:text-white font-bold font-['Chakra_Petch'] uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
          >
            <RotateCcw className="w-4 h-4 text-neutral-400" />
            <span>Restart Match</span>
          </button>

          {/* Quit to Menu */}
          <button
            onClick={onQuitToMenu}
            className="w-full py-2.5 px-4 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 hover:border-rose-600 text-rose-300 hover:text-rose-100 font-bold font-['Chakra_Petch'] uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Quit to Main Menu</span>
          </button>
        </div>

        {/* Footer controls hint */}
        <div className="pt-2 border-t border-neutral-800 text-center text-[11px] text-neutral-400 font-mono">
          Press <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-200">ESC</kbd> anytime to Pause or Resume
        </div>
      </div>
    </div>
  );
};
