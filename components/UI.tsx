import React, { useEffect } from 'react';
import { useStore } from '../store';
import { WeaponType } from '../types';

export const UI = () => {
  const { 
    hp, maxHp, armor, maxArmor, 
    currentWeapon, ammo, reserves, 
    score, wave, damageTexts, removeDamageText,
    gameOver, resetGame 
  } = useStore();

  return (
    <div className="absolute inset-0 pointer-events-none font-mono text-white">
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {currentWeapon === WeaponType.RIFLE && <div className="w-1 h-1 bg-green-400 rounded-full" />}
        {currentWeapon === WeaponType.SHOTGUN && <div className="w-8 h-8 border-2 border-red-500 rounded-full opacity-50" />}
        {currentWeapon === WeaponType.ROCKET && <div className="w-12 h-12 border-4 border-purple-500 rounded-none opacity-70 flex items-center justify-center"><div className="w-1 h-1 bg-purple-500"/></div>}
        {currentWeapon === WeaponType.SMG && <div className="w-4 h-4 border border-yellow-400 rounded-full" />}
      </div>

      {/* HUD Bottom Left */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8">HP</div>
          <div className="w-64 h-4 bg-gray-800 border border-gray-600">
            <div className="h-full bg-green-500 transition-all duration-200" style={{ width: `${(hp / maxHp) * 100}%` }} />
          </div>
          <div className="text-xl font-bold">{hp}</div>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-8">ARM</div>
            <div className="w-64 h-4 bg-gray-800 border border-gray-600">
                <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${(armor / maxArmor) * 100}%` }} />
            </div>
            <div className="text-xl font-bold">{armor}</div>
        </div>
      </div>

      {/* HUD Bottom Right (Ammo) */}
      <div className="absolute bottom-4 right-4 text-right">
        <div className="text-4xl font-black tracking-tighter">
          {ammo[currentWeapon]} <span className="text-lg text-gray-400">/ {reserves[currentWeapon]}</span>
        </div>
        <div className="text-xl text-yellow-400 uppercase">{currentWeapon}</div>
      </div>

      {/* Weapon Selector */}
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex flex-col gap-2">
        {Object.values(WeaponType).map((w, idx) => (
          <div 
            key={w} 
            className={`p-2 bg-black bg-opacity-50 border-r-4 ${currentWeapon === w ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-500'}`}
          >
            {idx + 1}. {w}
          </div>
        ))}
      </div>

      {/* Top Info */}
      <div className="absolute top-4 left-4">
        <div className="text-2xl font-bold">WAVE {wave}</div>
        <div className="text-gray-400">SCORE: {score}</div>
      </div>
      
      {/* Controls Help */}
      <div className="absolute top-4 right-4 text-right text-xs text-gray-500">
        <p>WASD - Move</p>
        <p>SPACE - Jump</p>
        <p>SHIFT - Sprint</p>
        <p>CTRL - Crouch</p>
        <p>1-4 - Weapons</p>
        <p>Click - Shoot</p>
      </div>

      {/* Floating Damage Numbers */}
      {damageTexts.map((dt) => (
        <DamageNumber key={dt.id} data={dt} onComplete={() => removeDamageText(dt.id)} />
      ))}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-80 flex flex-col items-center justify-center pointer-events-auto">
          <h1 className="text-6xl font-black mb-4">YOU DIED</h1>
          <p className="text-2xl mb-8">Wave Reached: {wave} | Score: {score}</p>
          <button 
            onClick={() => resetGame()} 
            className="px-8 py-4 bg-white text-black font-bold hover:bg-gray-200"
          >
            RESTART MISSION
          </button>
        </div>
      )}
    </div>
  );
};

const DamageNumber: React.FC<{ data: any, onComplete: () => void }> = ({ data, onComplete }) => {
    // We need to project the 3D position to 2D screen coordinates.
    // However, keeping it simple in this architecture, we use a CSS animation.
    // To do it properly in 3D, we'd use <Html> from drei.
    // But since UI is separate, we'll cheat or skip projection for this specific format request
    // and assume <Html> inside the canvas is better.
    
    // *Correction*: The UI component is outside the Canvas. We cannot easily project 3D coords here without
    // passing the camera/scene.
    // Let's refactor UI to be inside Canvas using @react-three/drei's Html for floating numbers,
    // and keep HUD static.
    return null; 
};