export enum WeaponType {
  RIFLE = 'RIFLE',
  SHOTGUN = 'SHOTGUN',
  SMG = 'SMG',
  ROCKET = 'ROCKET'
}

export enum EnemyType {
  ZOMBIE = 'ZOMBIE',
  BOSS = 'BOSS'
}

export interface WeaponStats {
  id: WeaponType;
  name: string;
  damage: number;
  fireRate: number; // ms between shots
  magSize: number;
  reloadTime: number; // ms
  spread: number;
  projectileSpeed?: number;
  color: string;
  automatic: boolean;
  recoil: number;
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  currentWeapon: WeaponType;
  ammo: Record<WeaponType, number>; // Current mag
  reserves: Record<WeaponType, number>; // Total ammo
  isReloading: boolean;
  isSprinting: boolean;
  isCrouching: boolean;
  score: number;
}

export interface DamageText {
  id: string;
  position: [number, number, number];
  value: number;
  isCrit: boolean;
  timestamp: number;
}

export interface Projectile {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  damage: number;
  type: 'bullet' | 'rocket';
  owner: 'player' | 'enemy';
}
