/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameRoomSummary } from '../types/game';
import { Users, Plus, RefreshCw, Key, Shield, MapPin, Swords } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onJoinRoom: (roomId: string, mapId: 'outpost' | 'bunker' | 'cyber') => void;
  onClose: () => void;
}

export const RoomBrowserModal: React.FC<Props> = ({ isOpen, onJoinRoom, onClose }) => {
  const [rooms, setRooms] = useState<GameRoomSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'create'>('browse');

  // Create Room Form State
  const [createName, setCreateName] = useState('Delta Strike Outpost');
  const [createMap, setCreateMap] = useState<'outpost' | 'bunker' | 'cyber'>('outpost');
  const [createMode, setCreateMode] = useState<'ffa' | 'tdm'>('ffa');
  const [createMaxPlayers, setCreateMaxPlayers] = useState(8);
  const [createBotCount, setCreateBotCount] = useState(3);
  const [creating, setCreating] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCodeInput.trim().toUpperCase();
    if (!code) return;
    onJoinRoom(code, 'outpost');
    onClose();
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName,
          mapId: createMap,
          mode: createMode,
          maxPlayers: createMaxPlayers,
          botCount: createBotCount,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onJoinRoom(data.roomId, createMap);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create room:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-950/60 border border-blue-500/40 rounded-lg text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide font-['Chakra_Petch'] uppercase text-neutral-100">
                Multiplayer War Rooms
              </h2>
              <p className="text-xs text-neutral-400">
                Join live battlefield lobbies, enter room codes, or host your custom arena
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-6 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('browse')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'browse'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Public Rooms</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Host Custom Room</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'browse' ? (
            <div className="space-y-5">
              {/* Direct Code Join Input */}
              <form onSubmit={handleJoinByCode} className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Enter Private Room Code (e.g. ALPHA, MIL72)..."
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs font-bold uppercase tracking-wider text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!roomCodeInput.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Join Code
                </button>
                <button
                  type="button"
                  onClick={fetchRooms}
                  disabled={loading}
                  className="p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                  title="Refresh Rooms"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </form>

              {/* Rooms List */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Active Battlefields
                </span>
                {rooms.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-lg">
                    No active rooms found. Host a new room below!
                  </div>
                ) : (
                  rooms.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3.5 bg-neutral-950/60 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-neutral-100 font-['Chakra_Petch']">
                            {r.name}
                          </span>
                          <span className="text-[10px] bg-neutral-800 text-neutral-300 font-mono px-1.5 py-0.5 rounded">
                            {r.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-neutral-500" />
                            <span className="capitalize">{r.mapId}</span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1">
                            <Swords className="w-3 h-3 text-neutral-500" />
                            <span className="uppercase">{r.mode}</span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{r.playerCount} Players ({r.botCount} Bots)</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onJoinRoom(r.id, r.mapId);
                          onClose();
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase px-4 py-2 rounded-lg transition-colors shadow-sm"
                      >
                        Join Room
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateRoom} className="space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 block mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Map Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 block mb-2">
                  Select Arena
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'outpost', name: 'Outpost Arena', desc: 'Floating rocks & catacombs' },
                    { id: 'bunker', name: 'Bunker 17', desc: 'Acid pit & steel catwalks' },
                    { id: 'cyber', name: 'Cyber Complex', desc: 'Neon platforms & high jump pads' },
                  ].map((m) => {
                    const isSelected = createMap === m.id;
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setCreateMap(m.id as 'outpost' | 'bunker' | 'cyber')}
                        className={`text-left p-3 rounded-lg border text-xs transition-all ${
                          isSelected
                            ? 'bg-blue-950/40 border-blue-500 text-white'
                            : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:bg-neutral-800/40'
                        }`}
                      >
                        <div className="font-bold font-['Chakra_Petch'] text-sm">{m.name}</div>
                        <div className="text-[11px] text-neutral-400 mt-1">{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 block mb-2">
                  Game Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateMode('ffa')}
                    className={`p-3 rounded-lg border text-xs font-bold uppercase transition-all ${
                      createMode === 'ffa'
                        ? 'bg-blue-950/40 border-blue-500 text-white'
                        : 'bg-neutral-950/40 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Free For All (Deathmatch)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMode('tdm')}
                    className={`p-3 rounded-lg border text-xs font-bold uppercase transition-all ${
                      createMode === 'tdm'
                        ? 'bg-blue-950/40 border-blue-500 text-white'
                        : 'bg-neutral-950/40 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Team Deathmatch (Red vs Blue)
                  </button>
                </div>
              </div>

              {/* Max Players & Bot Count */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 block mb-2">
                    Max Human Players: {createMaxPlayers}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    step="2"
                    value={createMaxPlayers}
                    onChange={(e) => setCreateMaxPlayers(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 block mb-2">
                    AI Militia Bots: {createBotCount}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    value={createBotCount}
                    onChange={(e) => setCreateBotCount(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md mt-4"
              >
                {creating ? 'Creating Battle Room...' : 'Launch Room & Deploy'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
