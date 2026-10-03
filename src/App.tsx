/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  PlayerLoadout, 
  WeaponType, 
  GrenadeType, 
  KillFeedEntry, 
  ChatMessage, 
  PlayerState 
} from './types/game';
import { DEFAULT_LOADOUT } from './game/weapons';
import { MiniMilitiaEngine, TargetEnemyInfo } from './game/engine';
import { MultiplayerClient } from './game/multiplayerClient';
import { MainMenu } from './components/MainMenu';
import { GameHUD } from './components/GameHUD';
import { LoadoutModal } from './components/LoadoutModal';
import { RoomBrowserModal } from './components/RoomBrowserModal';
import { TextureGraphicsModal } from './components/TextureGraphicsModal';
import { ScoreboardModal } from './components/ScoreboardModal';
import { InGameChat } from './components/InGameChat';
import { MobileControls } from './components/MobileControls';
import { PauseMenuModal } from './components/PauseMenuModal';

export default function App() {
  // Game Screen State
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');

  // Loadout State (with LocalStorage cache)
  const [loadout, setLoadout] = useState<PlayerLoadout>(() => {
    try {
      const saved = localStorage.getItem('mini_militia_loadout');
      return saved ? JSON.parse(saved) : DEFAULT_LOADOUT;
    } catch {
      return DEFAULT_LOADOUT;
    }
  });

  // Current Room
  const [roomId, setRoomId] = useState('ALPHA');
  const [roomName, setRoomName] = useState('Outpost Arena (FPS)');
  const [mapId, setMapId] = useState<'outpost' | 'bunker' | 'cyber'>('outpost');
  const [mode, setMode] = useState<'ffa' | 'tdm'>('ffa');

  // Modals
  const [isLoadoutOpen, setIsLoadoutOpen] = useState(false);
  const [isRoomBrowserOpen, setIsRoomBrowserOpen] = useState(false);
  const [isTexturesOpen, setIsTexturesOpen] = useState(false);
  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);

  // In-Game FPS HUD state
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [nitro, setNitro] = useState(100);
  const [maxNitro, setMaxNitro] = useState(100);
  const [activeWeaponIndex, setActiveWeaponIndex] = useState<0 | 1>(0);
  const [activeWeapon, setActiveWeapon] = useState<WeaponType>(loadout.primaryWeapon);
  const [secondaryWeapon, setSecondaryWeapon] = useState<WeaponType>(loadout.secondaryWeapon);
  const [magAmmo, setMagAmmo] = useState(30);
  const [reserveAmmo, setReserveAmmo] = useState(120);
  const [isReloading, setIsReloading] = useState(false);
  const [grenadeCount, setGrenadeCount] = useState(3);
  const [grenadeType, setGrenadeType] = useState<GrenadeType>(loadout.grenade);
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([]);
  const [showHitmarker, setShowHitmarker] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [scores, setScores] = useState({ red: 0, blue: 0 });
  const [ping, setPing] = useState(16);
  const [isDead, setIsDead] = useState(false);
  const [deathInfo, setDeathInfo] = useState<{ killer: string; weapon: string } | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isADS, setIsADS] = useState(false);
  const [isSniperADS, setIsSniperADS] = useState(false);
  const [targetEnemy, setTargetEnemy] = useState<TargetEnemyInfo | null>({
    name: 'Hostile Viper',
    weapon: 'ak47',
    health: 70,
    maxHealth: 70,
  });
  const [waveNotice, setWaveNotice] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [mouseSensitivity, setMouseSensitivity] = useState(0.0022);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [connectedPlayers, setConnectedPlayers] = useState<Record<string, PlayerState>>({});

  // Engine and Client References
  const gameMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MiniMilitiaEngine | null>(null);
  const clientRef = useRef<MultiplayerClient | null>(null);
  const networkTickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save Loadout helper
  const handleSaveLoadout = (newLoadout: PlayerLoadout) => {
    setLoadout(newLoadout);
    try {
      localStorage.setItem('mini_militia_loadout', JSON.stringify(newLoadout));
    } catch {
      // Ignore
    }
  };

  // Scoreboard Tab Key Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setIsScoreboardOpen(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setIsScoreboardOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Launch Match
  const startMatch = (targetRoomId: string, targetMapId: 'outpost' | 'bunker' | 'cyber') => {
    setRoomId(targetRoomId);
    setMapId(targetMapId);
    setIsPaused(false);
    setGameState('playing');
  };

  // Pause on Escape Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && gameState === 'playing') {
        e.preventDefault();
        setIsPaused(prev => {
          const next = !prev;
          if (next) {
            try {
              if (document.pointerLockElement) {
                document.exitPointerLock?.();
              }
            } catch {
              // Ignore
            }
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Synchronize pause state with game engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setPaused(isPaused);
      if (isPaused) {
        try {
          if (document.pointerLockElement) {
            document.exitPointerLock?.();
          }
        } catch {
          // Ignore
        }
      }
    }
  }, [isPaused]);

  // Setup FPS Game Engine & WebSocket connection when gameState === 'playing'
  useEffect(() => {
    if (gameState !== 'playing' || !gameMountRef.current) return;

    // 1. Initialize Multiplayer WebSocket Client
    const client = new MultiplayerClient(loadout.callsign, loadout, {
      onRoomJoined: (joinedRoomId, playerId, roomState) => {
        setRoomId(joinedRoomId);
        setRoomName(roomState.name);
        setMode(roomState.mode);
        setTimeRemaining(roomState.timeRemaining);
        setScores(roomState.scores);
        setConnectedPlayers(roomState.players);
      },
      onStateTick: (players, remaining, roomScores) => {
        setTimeRemaining(remaining);
        setScores(roomScores);
        setConnectedPlayers(players);
        if (engineRef.current) {
          engineRef.current.syncRemotePlayers(players);
        }
      },
      onPlayerJoined: (player) => {
        setConnectedPlayers(prev => ({ ...prev, [player.id]: player }));
      },
      onPlayerLeft: (pId) => {
        setConnectedPlayers(prev => {
          const next = { ...prev };
          delete next[pId];
          return next;
        });
      },
      onChatMessage: (chat) => {
        setChatMessages(prev => [...prev, chat]);
      },
      onKillConfirmed: (kill, newScores) => {
        setKillFeed(prev => [...prev, kill]);
        setScores(newScores);
      },
      onGameOver: (winner) => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `sys_${Date.now()}`,
            senderName: 'SYSTEM',
            team: 'ffa',
            text: `MATCH CONCLUDED: ${winner.toUpperCase()} IS VICTORIOUS!`,
            timestamp: Date.now(),
          },
        ]);
      },
      onConnectionStatusChange: (status) => {
        if (status === 'connected') setPing(18);
        else if (status === 'connecting') setPing(60);
      },
      onWeaponFire: (shooterId, weaponType, origin, direction) => {
        engineRef.current?.spawnRemoteWeaponFire(shooterId, weaponType, origin, direction);
      },
    });

    client.connect(roomId);
    clientRef.current = client;

    // 2. Initialize Three.js FPS Game Engine
    const engine = new MiniMilitiaEngine(
      gameMountRef.current,
      loadout,
      mapId,
      {
        onHealthChange: (cur, max) => {
          setHealth(cur);
          setMaxHealth(max);
        },
        onNitroChange: (cur, max) => {
          setNitro(cur);
          setMaxNitro(max);
        },
        onWeaponChange: (index, type, mag, res, reloading) => {
          setActiveWeaponIndex(index);
          setActiveWeapon(type);
          setMagAmmo(mag);
          setReserveAmmo(res);
          setIsReloading(reloading);
          setSecondaryWeapon(index === 0 ? loadout.secondaryWeapon : loadout.primaryWeapon);
        },
        onGrenadeChange: (count, type) => {
          setGrenadeCount(count);
          setGrenadeType(type);
        },
        onHitmarker: () => {
          setShowHitmarker(true);
          setTimeout(() => setShowHitmarker(false), 90);
        },
        onKillFeed: (entry) => {
          setKillFeed(prev => [...prev, entry]);
          client.send({
            action: 'player_kill',
            victimId: 'hostile_bot_active',
            weapon: entry.weapon,
          });
        },
        onPlayerDied: (killer, weapon) => {
          setIsDead(true);
          setDeathInfo({ killer, weapon });
        },
        onPlayerRespawn: () => {
          setIsDead(false);
          setDeathInfo(null);
        },
        onPointerLockChange: (locked) => {
          setIsPointerLocked(locked);
        },
        onADSChange: (ads, isSniper) => {
          setIsADS(ads);
          setIsSniperADS(ads && isSniper);
        },
        onWaveStatusChange: (target, notice) => {
          setTargetEnemy(target);
          setWaveNotice(notice);
        },
        onTogglePause: () => {
          setIsPaused(prev => {
            const next = !prev;
            if (next) {
              try {
                if (document.pointerLockElement) {
                  document.exitPointerLock?.();
                }
              } catch {
                // Ignore
              }
            }
            return next;
          });
        },
        onSendLocalAction: (action) => {
          client.send({ action: action.type, ...action });
        },
      },
      client.playerId
    );

    engineRef.current = engine;

    // 3. Regular Input Sync to WebSocket Server (25 Hz)
    networkTickIntervalRef.current = setInterval(() => {
      if (engine && client) {
        client.sendInputUpdate({
          x: engine.localState.x,
          y: engine.localState.y,
          z: engine.localState.z,
          vx: engine.localState.vx,
          vy: engine.localState.vy,
          vz: engine.localState.vz,
          rotationY: engine.yaw,
          aimPitch: engine.pitch,
          isFlying: engine.localState.isFlying,
          isFiring: engine.localState.isFiring,
          health: engine.localState.health,
          nitro: engine.localState.nitro,
          currentWeaponIndex: engine.localState.currentWeaponIndex,
        });
      }
    }, 40);

    return () => {
      if (networkTickIntervalRef.current) {
        clearInterval(networkTickIntervalRef.current);
      }
      client.disconnect();
      engine.dispose();
      engineRef.current = null;
      clientRef.current = null;
    };
  }, [gameState, roomId, mapId, loadout]);

  const handleLeaveMatch = () => {
    setGameState('menu');
  };

  const handleSendChatMessage = (text: string) => {
    clientRef.current?.sendChatMessage(text);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none">
      {gameState === 'menu' ? (
        <MainMenu
          loadout={loadout}
          onQuickPlay={() => startMatch('ALPHA', 'outpost')}
          onOpenRoomBrowser={() => setIsRoomBrowserOpen(true)}
          onOpenLoadout={() => setIsLoadoutOpen(true)}
          onOpenTextures={() => setIsTexturesOpen(true)}
        />
      ) : (
        <div className="relative w-full h-full">
          {/* Three.js 3D Canvas Mount */}
          <div ref={gameMountRef} className="w-full h-full cursor-crosshair" />

          {/* First-Person Shooter HUD */}
          <GameHUD
            loadout={loadout}
            health={health}
            maxHealth={maxHealth}
            nitro={nitro}
            maxNitro={maxNitro}
            activeWeaponIndex={activeWeaponIndex}
            activeWeapon={activeWeapon}
            secondaryWeapon={secondaryWeapon}
            magAmmo={magAmmo}
            reserveAmmo={reserveAmmo}
            isReloading={isReloading}
            grenadeCount={grenadeCount}
            grenadeType={grenadeType}
            killFeed={killFeed}
            showHitmarker={showHitmarker}
            timeRemaining={timeRemaining}
            scores={scores}
            mode={mode}
            ping={ping}
            isDead={isDead}
            deathInfo={deathInfo}
            isPointerLocked={isPointerLocked}
            isADS={isADS}
            isSniperADS={isSniperADS}
            targetEnemy={targetEnemy}
            waveNotice={waveNotice}
            onRequestPointerLock={() => engineRef.current?.requestPointerLock()}
            onSwitchWeapon={() => engineRef.current?.switchWeapon(activeWeaponIndex === 0 ? 1 : 0)}
            onReload={() => engineRef.current?.startReload()}
            onThrowGrenade={() => engineRef.current?.throwGrenade()}
            onLeaveRoom={handleLeaveMatch}
            onPause={() => setIsPaused(true)}
          />

          {/* In-Game Chat Box */}
          <InGameChat
            messages={chatMessages}
            onSendMessage={handleSendChatMessage}
          />

          {/* Mobile Touch Controls for touchscreens */}
          <MobileControls
            onVirtualMove={(forward, strafe, wantsFly) => {
              if (engineRef.current && !isPaused) {
                engineRef.current.setVirtualMove(forward, strafe, wantsFly);
              }
            }}
            onVirtualLook={(dx, dy) => {
              if (engineRef.current && !isPaused) {
                engineRef.current.applyVirtualLook(dx, dy);
              }
            }}
            onSetFiring={(isFiring) => {
              if (engineRef.current && !isPaused) {
                engineRef.current.setVirtualFiring(isFiring);
              }
            }}
            onToggleADS={() => {
              if (engineRef.current && !isPaused) {
                engineRef.current.setADS(!engineRef.current.isADS);
              }
            }}
            onThrowGrenade={() => !isPaused && engineRef.current?.throwGrenade()}
            onReload={() => !isPaused && engineRef.current?.startReload()}
            onSwitchWeapon={() => !isPaused && engineRef.current?.switchWeapon(activeWeaponIndex === 0 ? 1 : 0)}
            onMelee={() => !isPaused && engineRef.current?.meleeBash()}
            onPause={() => {
              setIsPaused(true);
              try {
                if (document.pointerLockElement) {
                  document.exitPointerLock();
                }
              } catch {
                // Ignore
              }
            }}
            grenadeCount={grenadeCount}
          />

          {/* Pause Menu Modal (Triggered by ESC or Mobile Pause Button) */}
          <PauseMenuModal
            isOpen={isPaused}
            sectorName={roomName}
            scores={scores}
            playerKills={killFeed.filter(k => k.killerName === loadout.callsign).length}
            targetEnemy={targetEnemy}
            mouseSensitivity={mouseSensitivity}
            onSensitivityChange={(val) => {
              setMouseSensitivity(val);
              if (engineRef.current) {
                engineRef.current.mouseSensitivity = val;
              }
            }}
            onResume={() => {
              setIsPaused(false);
              engineRef.current?.requestPointerLock();
            }}
            onOpenLoadout={() => setIsLoadoutOpen(true)}
            onRestartMatch={() => {
              setIsPaused(false);
              engineRef.current?.respawnLocalPlayer();
            }}
            onQuitToMenu={() => {
              setIsPaused(false);
              handleLeaveMatch();
            }}
          />

          {/* Scoreboard on Tab */}
          <ScoreboardModal
            isOpen={isScoreboardOpen}
            players={connectedPlayers}
            mode={mode}
            scores={scores}
            roomName={roomName}
          />
        </div>
      )}

      {/* Armory & Loadouts Modal */}
      <LoadoutModal
        isOpen={isLoadoutOpen}
        loadout={loadout}
        onSave={handleSaveLoadout}
        onClose={() => setIsLoadoutOpen(false)}
      />

      {/* Multiplayer Rooms Browser Modal */}
      <RoomBrowserModal
        isOpen={isRoomBrowserOpen}
        onJoinRoom={(targetRoom, targetMap) => startMatch(targetRoom, targetMap)}
        onClose={() => setIsRoomBrowserOpen(false)}
      />

      {/* Textures & Graphics Customizer Modal */}
      <TextureGraphicsModal
        isOpen={isTexturesOpen}
        onClose={() => setIsTexturesOpen(false)}
      />
    </div>
  );
}
