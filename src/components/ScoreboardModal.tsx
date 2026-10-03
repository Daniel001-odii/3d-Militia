/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerState } from '../types/game';
import { Trophy, Bot, Wifi } from 'lucide-react';

interface Props {
  isOpen: boolean;
  players: Record<string, PlayerState>;
  mode: 'ffa' | 'tdm';
  scores: { red: number; blue: number };
  roomName: string;
}

export const ScoreboardModal: React.FC<Props> = ({ isOpen, players, mode, scores, roomName }) => {
  if (!isOpen) return null;

  const playerList = Object.values(players).sort((a, b) => b.kills - a.kills || b.score - a.score);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none p-4">
      <div className="bg-neutral-950/90 border border-neutral-700/80 w-full max-w-2xl rounded-xl p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-base font-['Chakra_Petch'] uppercase tracking-wider text-white">
              {roomName}
            </span>
          </div>
          {mode === 'tdm' ? (
            <div className="flex items-center gap-4 text-sm font-bold font-['Chakra_Petch']">
              <span className="text-red-400">RED: {scores.red}</span>
              <span className="text-neutral-500">VS</span>
              <span className="text-blue-400">BLUE: {scores.blue}</span>
            </div>
          ) : (
            <span className="text-xs uppercase text-neutral-400 font-semibold">
              Free For All Deathmatch
            </span>
          )}
        </div>

        {/* Players Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-neutral-400 border-b border-neutral-800 text-[11px] uppercase tracking-wider">
                <th className="pb-2">Trooper</th>
                <th className="pb-2 text-center">Team</th>
                <th className="pb-2 text-center">Kills</th>
                <th className="pb-2 text-center">Deaths</th>
                <th className="pb-2 text-center">Score</th>
                <th className="pb-2 text-right">Ping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {playerList.map((p) => {
                const teamBadge = p.team === 'red' ? 'text-red-400' : p.team === 'blue' ? 'text-blue-400' : 'text-amber-400';
                return (
                  <tr key={p.id} className="hover:bg-neutral-900/50">
                    <td className="py-2.5 flex items-center gap-2 font-medium">
                      <span className="text-neutral-100 font-['Chakra_Petch']">{p.name}</span>
                      {p.isBot && (
                        <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1 py-0.5 rounded flex items-center gap-0.5">
                          <Bot className="w-3 h-3" />
                          <span>BOT</span>
                        </span>
                      )}
                    </td>
                    <td className={`py-2.5 text-center font-bold uppercase text-[11px] ${teamBadge}`}>
                      {p.team}
                    </td>
                    <td className="py-2.5 text-center text-emerald-400 font-semibold">{p.kills}</td>
                    <td className="py-2.5 text-center text-rose-400 font-semibold">{p.deaths}</td>
                    <td className="py-2.5 text-center text-amber-400 font-semibold">{p.score}</td>
                    <td className="py-2.5 text-right text-neutral-400 font-mono">
                      <span className="inline-flex items-center gap-1">
                        <Wifi className="w-3 h-3 text-neutral-500" />
                        {p.ping}ms
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
