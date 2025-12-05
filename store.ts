import { create } from 'zustand';
import { WeaponType, PlayerState, DamageText } from './types';
import { WEAPONS } from './constants';
import { generateUUID } from 'three/src/math/MathUtils';

interface GameState extends PlayerState {
  gameOver: boolean;
  wave: number;
  enemiesKilled: number;
  damageTexts: DamageText[];
  
  // Actions
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  addArmor: (amount: number) => void;
  switchWeapon: (weapon: WeaponType) => void;
  shootAmmo: () => boolean; // Returns true if shot fired
  reload: () => void;
  finishReload: () => void;
  setSprint: (v: boolean) => void;
  setCrouch: (v: boolean) => void;
  addScore: (points: number) => void;
  addDamageText: (pos: [number, number, number], val: number, crit: boolean) => void;
  removeDamageText: (id: string) => void;
  resetGame: () => void;
  nextWave: () => void;
}

const INITIAL_AMMO = {
  [WeaponType.RIFLE]: 30,
  [WeaponType.SHOTGUN]: 8,
  [WeaponType.SMG]: 40,
  [WeaponType.ROCKET]: 1
};

const INITIAL_RESERVES = {
  [WeaponType.RIFLE]: 120,
  [WeaponType.SHOTGUN]: 32,
  [WeaponType.SMG]: 200,
  [WeaponType.ROCKET]: 5
};

export const useStore = create<GameState>((set, get) => ({
  hp: 100,
  maxHp: 100,
  armor: 0,
  maxArmor: 50,
  currentWeapon: WeaponType.RIFLE,
  ammo: { ...INITIAL_AMMO },
  reserves: { ...INITIAL_RESERVES },
  isReloading: false,
  isSprinting: false,
  isCrouching: false,
  score: 0,
  gameOver: false,
  wave: 1,
  enemiesKilled: 0,
  damageTexts: [],

  takeDamage: (amount) => set((state) => {
    if (state.gameOver) return {};
    let damageLeft = amount;
    let newArmor = state.armor;
    
    if (newArmor > 0) {
      const reduction = Math.min(newArmor, damageLeft);
      newArmor -= reduction;
      damageLeft -= reduction;
    }
    
    const newHp = Math.max(0, state.hp - damageLeft);
    return { hp: newHp, armor: newArmor, gameOver: newHp <= 0 };
  }),

  heal: (amount) => set((state) => ({ hp: Math.min(state.maxHp, state.hp + amount) })),
  addArmor: (amount) => set((state) => ({ armor: Math.min(state.maxArmor, state.armor + amount) })),
  
  switchWeapon: (weapon) => set((state) => {
    if (state.isReloading) return {};
    return { currentWeapon: weapon };
  }),

  shootAmmo: () => {
    const state = get();
    if (state.isReloading) return false;
    const current = state.currentWeapon;
    if (state.ammo[current] > 0) {
      set((s) => ({
        ammo: { ...s.ammo, [current]: s.ammo[current] - 1 }
      }));
      return true;
    } else {
      // Auto reload if empty
      get().reload();
      return false;
    }
  },

  reload: () => set((state) => {
    const w = state.currentWeapon;
    const weaponStats = WEAPONS[w];
    if (state.ammo[w] >= weaponStats.magSize) return {}; // Full mag
    if (state.reserves[w] <= 0) return {}; // No reserves
    
    return { isReloading: true };
  }),

  finishReload: () => set((state) => {
    const w = state.currentWeapon;
    const weaponStats = WEAPONS[w];
    const needed = weaponStats.magSize - state.ammo[w];
    const available = state.reserves[w];
    const toLoad = Math.min(needed, available);

    return {
      isReloading: false,
      ammo: { ...state.ammo, [w]: state.ammo[w] + toLoad },
      reserves: { ...state.reserves, [w]: state.reserves[w] - toLoad }
    };
  }),

  setSprint: (v) => set({ isSprinting: v }),
  setCrouch: (v) => set({ isCrouching: v }),

  addScore: (points) => set((s) => ({ score: s.score + points, enemiesKilled: s.enemiesKilled + 1 })),
  
  addDamageText: (pos, val, crit) => set((s) => ({
    damageTexts: [...s.damageTexts, { id: generateUUID(), position: pos, value: val, isCrit: crit, timestamp: Date.now() }]
  })),

  removeDamageText: (id) => set((s) => ({
    damageTexts: s.damageTexts.filter(d => d.id !== id)
  })),

  nextWave: () => set((s) => ({ wave: s.wave + 1 })),

  resetGame: () => set({
    hp: 100,
    armor: 0,
    currentWeapon: WeaponType.RIFLE,
    ammo: { ...INITIAL_AMMO },
    reserves: { ...INITIAL_RESERVES },
    isReloading: false,
    score: 0,
    gameOver: false,
    wave: 1,
    enemiesKilled: 0,
    damageTexts: []
  })
}));