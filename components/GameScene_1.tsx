import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { Sky } from '@react-three/drei';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { useStore } from '../store';
import { EnemyType } from '../types';
import { WORLD_SIZE, BOSS_SPAWN_WAVE } from '../constants';
import { DamageNumbers } from './DamageNumbers';

const Wall: React.FC<{ position: [number, number, number], size: [number, number, number], rotation?: [number, number, number] }> = ({ position, size, rotation }) => (
  <RigidBody type="fixed" position={position} rotation={rotation}>
    <CuboidCollider args={[size[0]/2, size[1]/2, size[2]/2]} />
    <mesh castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#444" roughness={0.8} />
    </mesh>
  </RigidBody>
);

const Floor = () => (
  <RigidBody type="fixed" rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
    <mesh receiveShadow>
      <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
      <meshStandardMaterial color="#222" />
    </mesh>
  </RigidBody>
);

const ItemPickup = ({ type, position, onPickup }: { type: 'health' | 'armor' | 'ammo', position: [number, number, number], onPickup: () => void }) => {
    return (
        <RigidBody type="fixed" sensor position={position} onIntersectionEnter={(p) => {
            if (p.other.rigidBodyObject?.name === 'player') onPickup();
        }}>
            <mesh>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color={type === 'health' ? 'green' : type === 'armor' ? 'blue' : 'yellow'} />
            </mesh>
            <pointLight distance={3} color={type === 'health' ? 'green' : type === 'armor' ? 'blue' : 'yellow'} intensity={1} />
        </RigidBody>
    )
}

export const GameScene = () => {
  const { wave, nextWave, addScore, heal, addArmor, gameOver } = useStore();
  const [enemies, setEnemies] = useState<{id: string, type: EnemyType, pos: [number, number, number]}[]>([]);
  
  // Wave Management
  useEffect(() => {
    if (gameOver) return;

    // Spawn Enemies for current wave
    const count = wave * 3 + 2;
    const newEnemies = [];
    
    // Spawn Boss?
    if (wave % BOSS_SPAWN_WAVE === 0) {
        newEnemies.push({
            id: `boss-${wave}`,
            type: EnemyType.BOSS,
            pos: [0, 5, -20] as [number, number, number]
        });
    }

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 15 + Math.random() * 15;
        newEnemies.push({
            id: `zombie-${wave}-${i}`,
            type: EnemyType.ZOMBIE,
            pos: [Math.sin(angle) * radius, 2, Math.cos(angle) * radius] as [number, number, number]
        });
    }
    setEnemies(newEnemies);

  }, [wave, gameOver]);

  const handleEnemyDie = (id: string, score: number) => {
    addScore(score);
    setEnemies(prev => {
        const next = prev.filter(e => e.id !== id);
        if (next.length === 0) {
            setTimeout(() => nextWave(), 1000);
        }
        return next;
    });
  };

  // Environment Generation (Simple Maze/Arena)
  const walls = [];
  const seed = 12345; 
  for(let i=0; i<15; i++) {
     const x = (Math.sin(seed * i) * 20);
     const z = (Math.cos(seed * i * 2) * 20);
     const rot = Math.sin(i) > 0 ? Math.PI / 2 : 0;
     walls.push(<Wall key={i} position={[x, 1.5, z]} size={[8, 3, 1]} rotation={[0, rot, 0]} />);
  }

  return (
    <>
      <Canvas shadows camera={{ fov: 75 }} style={{ cursor: 'none' }} onClick={(e) => {
          if(!document.pointerLockElement) (e.target as HTMLElement).requestPointerLock();
      }}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 20, 10]} castShadow intensity={0.8} shadow-mapSize={[2048, 2048]} />
        
        <Physics gravity={[0, -30, 0]}>
          <Player />
          
          {enemies.map(e => (
            <Enemy 
                key={e.id} 
                id={e.id} 
                type={e.type} 
                position={e.pos} 
                onDie={handleEnemyDie} 
                playerRef={null as any}
            />
          ))}

          <Floor />
          {/* Borders */}
          <Wall position={[0, 2, -30]} size={[60, 4, 1]} />
          <Wall position={[0, 2, 30]} size={[60, 4, 1]} />
          <Wall position={[-30, 2, 0]} size={[1, 4, 60]} />
          <Wall position={[30, 2, 0]} size={[1, 4, 60]} />
          
          {walls}

          <ItemPickup type="health" position={[5, 1, 5]} onPickup={() => heal(50)} />
          <ItemPickup type="armor" position={[-5, 1, 5]} onPickup={() => addArmor(25)} />
          
        </Physics>
        
        <DamageNumbers />
      </Canvas>
    </>
  );
};