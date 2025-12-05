import React, { Suspense } from 'react';
import { GameScene } from './components/GameScene';
import { UI } from './components/UI';
import { DamageNumbers } from './components/DamageNumbers';
import { Canvas } from '@react-three/fiber';
// We need to inject DamageNumbers into the Canvas in GameScene, 
// so we'll modify GameScene to include it or compose here.
// Actually, let's update GameScene to include DamageNumbers directly.

export default function App() {
  return (
    <div className="w-full h-full bg-black">
      <Suspense fallback={<div className="text-white center text-2xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">LOADING ASSETS...</div>}>
         <GameSceneWithOverlay />
      </Suspense>
    </div>
  );
}

// Wrapper to combine Scene and UI properly
import { Physics } from '@react-three/rapier';
import { Sky } from '@react-three/drei';
import { Player } from './components/Player';
import { Enemy } from './components/Enemy';
import { useStore } from './store';
import { EnemyType } from './types';
import { WORLD_SIZE, BOSS_SPAWN_WAVE } from './constants';
import { useEffect, useState } from 'react';
import { Vector3 } from 'three';

// Re-defining Wall/Floor here or importing (simplified for file structure)
// We will use the GameScene.tsx content effectively here if we weren't splitting files, 
// but since GameScene is defined, we use it.

// wait... I need to make sure DamageNumbers is INSIDE the Canvas.
// GameScene.tsx exports GameScene which returns <Canvas>...
// I should wrap the UI *outside* and DamageNumbers *inside*.
// Let's adjust GameScene to accept children or just put DamageNumbers in it.
// To keep things clean in the XML response, I will update GameScene to include DamageNumbers.
// And App renders UI overlay on top.

const GameSceneWithOverlay = () => {
    return (
        <>
            <GameScene />
            <UI />
        </>
    )
}
