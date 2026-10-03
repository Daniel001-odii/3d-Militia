/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayerLoadout, WeaponType, GrenadeType, JetpackPerk, HeadgearType, CamoPattern } from '../types/game';
import { WEAPON_DEFINITIONS, PERK_DEFINITIONS } from '../game/weapons';
import { Crosshair, Shield, Zap, Flame, User, Palette } from 'lucide-react';

interface Props {
  isOpen: boolean;
  loadout: PlayerLoadout;
  onSave: (newLoadout: PlayerLoadout) => void;
  onClose: () => void;
}

export const LoadoutModal: React.FC<Props> = ({ isOpen, loadout, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'weapons' | 'perks' | 'customization'>('weapons');
  const [current, setCurrent] = useState<PlayerLoadout>({ ...loadout });

  if (!isOpen) return null;

  const primaryWeapons: WeaponType[] = ['ak47', 'm4', 'shotgun', 'sniper', 'rpg', 'flamethrower'];
  const secondaryWeapons: WeaponType[] = ['pistol', 'uzi'];
  const grenades: { id: GrenadeType; name: string; desc: string }[] = [
    { id: 'frag', name: 'Frag Grenade', desc: 'High explosive fragmentation with lethal blast radius.' },
    { id: 'gas', name: 'Toxic Gas Grenade', desc: 'Releases lingering noxious chemical cloud.' },
    { id: 'mine', name: 'Proximity Claymore', desc: 'Deploys proximity explosive that triggers near enemies.' },
  ];
  const headgears: { id: HeadgearType; name: string }[] = [
    { id: 'beret_green', name: 'Classic Green Beret' },
    { id: 'helmet_camo', name: 'Kevlar Camo Helmet' },
    { id: 'gas_mask', name: 'Combat Gas Mask' },
    { id: 'aviators', name: 'Aviator Shades & Bandana' },
    { id: 'cyber_visor', name: 'Neon Cyber Visor' },
    { id: 'ninja_hood', name: 'Special Ops Balaclava' },
  ];
  const camos: { id: CamoPattern; name: string; color: string }[] = [
    { id: 'woodland', name: 'Woodland Green', color: '#4d7c0f' },
    { id: 'desert', name: 'Desert Marpat', color: '#d97706' },
    { id: 'urban', name: 'Urban Combat Gray', color: '#64748b' },
    { id: 'arctic', name: 'Arctic Camo', color: '#e2e8f0' },
    { id: 'midnight', name: 'Midnight Spec-Ops', color: '#0f172a' },
    { id: 'hazard', name: 'Hazard Stripe', color: '#eab308' },
  ];
  const trailColors = [
    { hex: '#f97316', label: 'Fiery Orange' },
    { hex: '#06b6d4', label: 'Plasma Cyan' },
    { hex: '#22c55e', label: 'Toxic Neon' },
    { hex: '#ec4899', label: 'Cyber Pink' },
    { hex: '#ef4444', label: 'Crimson Thruster' },
  ];

  const handleSave = () => {
    onSave(current);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950/60 border border-amber-500/40 rounded-lg text-amber-400">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide font-['Chakra_Petch'] uppercase text-neutral-100">
                Armory & Custom Loadouts
              </h2>
              <p className="text-xs text-neutral-400">
                Configure your combat weapons, jetpack boosters, and tactical camo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-amber-600 hover:bg-amber-500 text-black px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors shadow-md"
            >
              Deploy Loadout
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-6 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('weapons')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'weapons'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>Weapons & Tactical</span>
          </button>
          <button
            onClick={() => setActiveTab('perks')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'perks'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Jetpack Perks & Armor</span>
          </button>
          <button
            onClick={() => setActiveTab('customization')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'customization'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Appearance & Camo</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'weapons' && (
            <div className="space-y-6">
              {/* Primary Weapon */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-3">
                  Primary Weapon
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {primaryWeapons.map((wId) => {
                    const def = WEAPON_DEFINITIONS[wId];
                    const isSelected = current.primaryWeapon === wId;
                    return (
                      <button
                        key={wId}
                        onClick={() => setCurrent({ ...current, primaryWeapon: wId })}
                        className={`text-left p-3.5 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500 text-white shadow-md'
                            : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800/50 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm font-['Chakra_Petch']">{def.name}</span>
                          {isSelected && <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold uppercase">Equipped</span>}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">{def.description}</p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-neutral-400 bg-neutral-900/60 p-2 rounded">
                          <div>DMG: <span className="text-neutral-200 font-semibold">{def.damage}</span></div>
                          <div>RPM: <span className="text-neutral-200 font-semibold">{Math.round(def.fireRate * 60)}</span></div>
                          <div>MAG: <span className="text-neutral-200 font-semibold">{def.magazineSize}</span></div>
                          <div>RANGE: <span className="text-neutral-200 font-semibold">{def.range}m</span></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secondary Weapon */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-3">
                  Secondary Weapon
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {secondaryWeapons.map((wId) => {
                    const def = WEAPON_DEFINITIONS[wId];
                    const isSelected = current.secondaryWeapon === wId;
                    return (
                      <button
                        key={wId}
                        onClick={() => setCurrent({ ...current, secondaryWeapon: wId })}
                        className={`text-left p-3.5 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500 text-white shadow-md'
                            : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800/50 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm font-['Chakra_Petch']">{def.name}</span>
                          {isSelected && <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold uppercase">Equipped</span>}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1">{def.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grenade */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-3">
                  Tactical Grenade
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {grenades.map((g) => {
                    const isSelected = current.grenade === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setCurrent({ ...current, grenade: g.id })}
                        className={`text-left p-3.5 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500 text-white shadow-md'
                            : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800/50 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm font-['Chakra_Petch']">{g.name}</span>
                          {isSelected && <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold uppercase">Equipped</span>}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1">{g.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'perks' && (
            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block">
                Combat Perks & Jetpack Modifications
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(PERK_DEFINITIONS).map(([pId, def]) => {
                  const isSelected = current.perk === pId;
                  return (
                    <button
                      key={pId}
                      onClick={() => setCurrent({ ...current, perk: pId as JetpackPerk })}
                      className={`text-left p-4 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500 text-white shadow-md'
                          : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800/50 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm font-['Chakra_Petch']">{def.name}</span>
                        <span className="text-xs font-semibold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                          {def.stat}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-2">{def.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'customization' && (
            <div className="space-y-6">
              {/* Callsign */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-2">
                  Trooper Callsign / Name
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={current.callsign}
                  onChange={(e) => setCurrent({ ...current, callsign: e.target.value.toUpperCase() })}
                  className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-sm font-bold uppercase tracking-wider text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Headgear */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-3">
                  Military Headgear
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {headgears.map((h) => {
                    const isSelected = current.headgear === h.id;
                    return (
                      <button
                        key={h.id}
                        onClick={() => setCurrent({ ...current, headgear: h.id })}
                        className={`text-left p-3 rounded-lg border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500 text-white'
                            : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                        }`}
                      >
                        {h.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Camo Patterns */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-3">
                  Uniform Camouflage
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {camos.map((c) => {
                    const isSelected = current.camo === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setCurrent({ ...current, camo: c.id })}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500 text-white'
                            : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-black/40 shrink-0" style={{ backgroundColor: c.color }} />
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Jetpack Booster Trail */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-3">
                  Rocket Exhaust Flame Color
                </span>
                <div className="flex flex-wrap gap-3">
                  {trailColors.map((t) => {
                    const isSelected = current.trailColor === t.hex;
                    return (
                      <button
                        key={t.hex}
                        onClick={() => setCurrent({ ...current, trailColor: t.hex })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500 text-white'
                            : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.hex }} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
