import { WeaponType, WeaponStats } from './types';

export const WEAPONS: Record<WeaponType, WeaponStats> = {
  [WeaponType.RIFLE]: {
    id: WeaponType.RIFLE,
    name: 'Assault Rifle',
    damage: 15,
    fireRate: 100,
    magSize: 30,
    reloadTime: 2000,
    spread: 0.05,
    color: '#3b82f6',
    automatic: true,
    recoil: 0.1
  },
  [WeaponType.SHOTGUN]: {
    id: WeaponType.SHOTGUN,
    name: 'Pump Shotgun',
    damage: 12, // per pellet
    fireRate: 800,
    magSize: 8,
    reloadTime: 3000,
    spread: 0.2,
    color: '#ef4444',
    automatic: false,
    recoil: 0.5
  },
  [WeaponType.SMG]: {
    id: WeaponType.SMG,
    name: 'Vector SMG',
    damage: 8,
    fireRate: 50,
    magSize: 40,
    reloadTime: 1500,
    spread: 0.12,
    color: '#eab308',
    automatic: true,
    recoil: 0.08
  },
  [WeaponType.ROCKET]: {
    id: WeaponType.ROCKET,
    name: 'Doombringer',
    damage: 150,
    fireRate: 1500,
    magSize: 1,
    reloadTime: 2500,
    spread: 0.01,
    projectileSpeed: 20,
    color: '#a855f7',
    automatic: false,
    recoil: 1.0
  }
};

export const PLAYER_SPEED = 6;
export const SPRINT_MULTIPLIER = 1.6;
export const CROUCH_MULTIPLIER = 0.5;
export const JUMP_FORCE = 6;
export const GRAVITY = [0, -20, 0] as const;

export const WORLD_SIZE = 60;
export const BOSS_SPAWN_WAVE = 5;
