/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerLoadout, PlayerState, RoomState, ChatMessage, KillFeedEntry, WeaponType } from '../types/game';

export interface NetworkCallbacks {
  onRoomJoined: (roomId: string, playerId: string, state: RoomState) => void;
  onStateTick: (players: Record<string, PlayerState>, timeRemaining: number, scores: { red: number; blue: number }) => void;
  onPlayerJoined: (player: PlayerState) => void;
  onPlayerLeft: (playerId: string) => void;
  onChatMessage: (chat: ChatMessage) => void;
  onKillConfirmed: (kill: KillFeedEntry, scores: { red: number; blue: number }) => void;
  onGameOver: (winner: string, scores: { red: number; blue: number }) => void;
  onConnectionStatusChange: (status: 'connecting' | 'connected' | 'disconnected') => void;
  onWeaponFire?: (
    shooterId: string, 
    weaponType: WeaponType, 
    origin: { x: number; y: number; z: number }, 
    direction: { x: number; y: number; z: number }
  ) => void;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private callbacks: NetworkCallbacks;
  private roomId: string | null = null;
  public playerId: string;
  private playerName: string;
  private loadout: PlayerLoadout;
  private isConnected = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(playerName: string, loadout: PlayerLoadout, callbacks: NetworkCallbacks) {
    this.playerName = playerName;
    this.loadout = loadout;
    this.callbacks = callbacks;
    this.playerId = 'p_' + Math.random().toString(36).substring(2, 9);
  }

  public connect(roomId: string) {
    this.roomId = roomId;
    this.callbacks.onConnectionStatusChange('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.callbacks.onConnectionStatusChange('connected');
        // Send join packet
        this.send({
          action: 'join_room',
          roomId: this.roomId,
          playerId: this.playerId,
          name: this.playerName,
          loadout: this.loadout,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('Failed to parse WS packet:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.callbacks.onConnectionStatusChange('disconnected');
      };

      this.ws.onerror = (e) => {
        console.warn('WS error:', e);
      };
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      this.callbacks.onConnectionStatusChange('disconnected');
    }
  }

  private handleMessage(msg: Record<string, unknown>) {
    const type = msg.type as string;

    if (type === 'room_joined') {
      this.callbacks.onRoomJoined(
        msg.roomId as string,
        msg.playerId as string,
        msg.roomState as RoomState
      );
    } else if (type === 'state_tick') {
      this.callbacks.onStateTick(
        msg.players as Record<string, PlayerState>,
        msg.timeRemaining as number,
        msg.scores as { red: number; blue: number }
      );
    } else if (type === 'player_joined') {
      this.callbacks.onPlayerJoined(msg.player as PlayerState);
    } else if (type === 'player_left') {
      this.callbacks.onPlayerLeft(msg.playerId as string);
    } else if (type === 'chat_message') {
      this.callbacks.onChatMessage(msg.chat as ChatMessage);
    } else if (type === 'kill_confirmed') {
      this.callbacks.onKillConfirmed(
        msg.kill as KillFeedEntry,
        msg.scores as { red: number; blue: number }
      );
    } else if (type === 'game_over') {
      this.callbacks.onGameOver(
        msg.winner as string,
        msg.scores as { red: number; blue: number }
      );
    } else if (type === 'weapon_fire') {
      this.callbacks.onWeaponFire?.(
        msg.shooterId as string,
        msg.weaponType as WeaponType,
        msg.origin as { x: number; y: number; z: number },
        msg.direction as { x: number; y: number; z: number }
      );
    }
  }

  public sendInputUpdate(state: Partial<PlayerState>) {
    if (!this.isConnected || !this.ws) return;
    this.send({
      action: 'input_update',
      x: state.x,
      y: state.y,
      z: state.z,
      vx: state.vx,
      vy: state.vy,
      vz: state.vz,
      rotationY: state.rotationY,
      aimPitch: state.aimPitch,
      isFlying: state.isFlying,
      isFiring: state.isFiring,
      health: state.health,
      nitro: state.nitro,
      weaponIndex: state.currentWeaponIndex,
    });
  }

  public sendChatMessage(text: string) {
    if (!this.isConnected) return;
    this.send({
      action: 'chat_message',
      text,
    });
  }

  public send(data: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.send({ action: 'leave_room' });
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}
