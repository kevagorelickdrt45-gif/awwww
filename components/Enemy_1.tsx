import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion } from 'three';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import { Sphere, Box, Text } from '@react-three/drei';
import { EnemyType, WeaponType } from '../types';
import { useStore } from '../store';
import { audio } from '../services/audioService';

interface EnemyProps {
  id: string;
  type: EnemyType;
  position: [number, number, number];
  onDie: (id: string, score: number) => void;
  playerRef: React.MutableRefObject<any>; // Just to track position
}

export const Enemy: React.FC<EnemyProps> = ({ id, type, position, onDie }) => {
  // Stats
  const maxHp = type === EnemyType.BOSS ? 1000 : 50;
  const [hp, setHp] = useState(maxHp);
  const speed = type === EnemyType.BOSS ? 5 : 3;
  const scoreValue = type === EnemyType.BOSS ? 500 : 50;
  const color = type === EnemyType.BOSS ? '#ff0000' : '#44aa44';

  const rb = useRef<RapierRigidBody>(null);
  const { addDamageText, takeDamage } = useStore();
  const lastAttack = useRef(0);

  // Boss AI State
  const bossState = useRef<'CHASE' | 'DASH' | 'JUMP'>('CHASE');
  const bossTimer = useRef(0);

  // Listen for global hit events
  React.useEffect(() => {
    const handleHit = (e: any) => {
      // Raycast logic is centralized, but here we can simulate receiving damage
      // Ideally, the raycaster in WeaponController determines WHO was hit.
      // But since we don't have a central entity manager passing refs, we'll rely on
      // physics collision for Rockets and a simple distance check or a more complex 
      // event bus for raycasts.
      
      // Let's implement a "Listener" for the raycast event dispatched by WeaponController
      // Note: This is computationally expensive if many enemies check the ray. 
      // In a real app, the Raycaster would check intersections and call a method on the specific object.
    };
    
    const handleExplosion = (e: CustomEvent) => {
      if (!rb.current) return;
      const { position: expPos, radius, damage } = e.detail;
      const myPos = rb.current.translation();
      const dist = new Vector3(myPos.x, myPos.y, myPos.z).distanceTo(new Vector3(expPos.x, expPos.y, expPos.z));
      
      if (dist < radius) {
        applyDamage(damage * (1 - dist/radius));
        // Knockback
        const dir = new Vector3(myPos.x - expPos.x, myPos.y - expPos.y + 2, myPos.z - expPos.z).normalize();
        rb.current.applyImpulse(dir.multiplyScalar(20), true);
      }
    };
    
    // Specifically for Raycast shots
    const handleShot = (e: CustomEvent) => {
        if (!rb.current) return;
        const { ray, damage, count } = e.detail;
        
        // Simplified Ray-Sphere intersection for hit detection
        const myPos = rb.current.translation();
        const sphereCenter = new Vector3(myPos.x, myPos.y, myPos.z);
        const radius = type === EnemyType.BOSS ? 1.5 : 0.6;
        
        const rayOrigin = new Vector3(ray.origin.x, ray.origin.y, ray.origin.z);
        const rayDir = new Vector3(ray.direction.x, ray.direction.y, ray.direction.z);
        
        // Vector from origin to center
        const L = new Vector3().subVectors(sphereCenter, rayOrigin);
        const tca = L.dot(rayDir);
        
        if (tca < 0) return; // Behind ray
        
        const d2 = L.dot(L) - tca * tca;
        if (d2 > radius * radius) return; // Miss
        
        // Hit!
        const dist = Math.sqrt(L.dot(L));
        if (dist > 100) return; // Too far

        for(let i=0; i<count; i++) {
           applyDamage(damage);
        }
    };

    window.addEventListener('rocket-explode', handleExplosion as EventListener);
    window.addEventListener('player-shoot', handleShot as EventListener);
    return () => {
      window.removeEventListener('rocket-explode', handleExplosion as EventListener);
      window.removeEventListener('player-shoot', handleShot as EventListener);
    };
  }, [hp]);

  const applyDamage = (amount: number) => {
    const dmg = Math.floor(amount);
    const isCrit = Math.random() > 0.8;
    const finalDmg = isCrit ? dmg * 2 : dmg;
    
    setHp(prev => {
      const newHp = prev - finalDmg;
      if (newHp <= 0) onDie(id, scoreValue);
      return newHp;
    });

    if (rb.current) {
        const t = rb.current.translation();
        addDamageText([t.x, t.y + 2, t.z], finalDmg, isCrit);
        audio.playHit();
    }
  };

  useFrame((state, delta) => {
    if (!rb.current) return;
    
    // Find Player (Assuming player is at camera position roughly, or hardcoded finding)
    // We can iterate scene graph or use a store ref. 
    // For this generic demo, we assume player is at 0,0,0 if we can't find them, but actually 
    // Player updates camera position. Let's use camera position as target.
    const playerPos = state.camera.position;
    const myPos = rb.current.translation();
    const vecToPlayer = new Vector3(playerPos.x - myPos.x, 0, playerPos.z - myPos.z);
    const distToPlayer = vecToPlayer.length();
    
    vecToPlayer.normalize();

    // AI Logic
    if (type === EnemyType.BOSS) {
      bossTimer.current += delta;
      
      if (bossState.current === 'CHASE') {
        rb.current.setLinvel({ x: vecToPlayer.x * speed, y: rb.current.linvel().y, z: vecToPlayer.z * speed }, true);
        if (bossTimer.current > 5) {
           bossState.current = Math.random() > 0.5 ? 'DASH' : 'JUMP';
           bossTimer.current = 0;
        }
      } else if (bossState.current === 'DASH') {
        rb.current.setLinvel({ x: vecToPlayer.x * speed * 4, y: 0, z: vecToPlayer.z * speed * 4 }, true);
        if (bossTimer.current > 0.5) {
           bossState.current = 'CHASE';
           bossTimer.current = 0;
        }
      } else if (bossState.current === 'JUMP') {
         if (bossTimer.current < 0.1) {
             rb.current.applyImpulse({ x: vecToPlayer.x * 10, y: 20, z: vecToPlayer.z * 10 }, true);
         }
         if (bossTimer.current > 2) {
             bossState.current = 'CHASE';
             bossTimer.current = 0;
         }
      }
      
      // Boss Ranged Attack logic (simple interval)
      if (Date.now() - lastAttack.current > 2000) {
          if (distToPlayer < 20) {
              takeDamage(10); // Auto hit if close enough
              lastAttack.current = Date.now();
          }
      }

    } else {
      // Zombie Logic: Chase
      rb.current.setLinvel({ x: vecToPlayer.x * speed, y: rb.current.linvel().y, z: vecToPlayer.z * speed }, true);
      
      // Face player
      const angle = Math.atan2(vecToPlayer.x, vecToPlayer.z);
      rb.current.setRotation(new Quaternion().setFromAxisAngle(new Vector3(0,1,0), angle), true);
    }
    
    // Fall off map
    if (myPos.y < -20) onDie(id, 0);
  });

  return (
    <RigidBody 
        ref={rb} 
        position={position} 
        colliders={false} 
        enabledRotations={[false, true, false]}
        name="enemy_body"
    >
      <CapsuleCollider args={[type === EnemyType.BOSS ? 1 : 0.4, type === EnemyType.BOSS ? 1.5 : 0.8]} />
      
      <group>
        {/* Head */}
        <Sphere args={[type === EnemyType.BOSS ? 0.8 : 0.3]} position={[0, type === EnemyType.BOSS ? 2 : 1.4, 0]}>
            <meshStandardMaterial color={color} />
        </Sphere>
        {/* Body */}
        <Box args={[type === EnemyType.BOSS ? 1.5 : 0.6, type === EnemyType.BOSS ? 2 : 1, type === EnemyType.BOSS ? 1 : 0.3]} position={[0, type === EnemyType.BOSS ? 1 : 0.7, 0]}>
            <meshStandardMaterial color={type === EnemyType.BOSS ? '#550000' : '#225522'} />
        </Box>
        
        {/* HP Bar */}
        <group position={[0, type === EnemyType.BOSS ? 3.5 : 2.2, 0]}>
           <Box args={[1, 0.1, 0.1]}>
             <meshBasicMaterial color="red" />
           </Box>
           <Box args={[hp / maxHp, 0.12, 0.12]} position={[-(1 - hp/maxHp)/2, 0, 0.01]}>
             <meshBasicMaterial color="green" />
           </Box>
        </group>
      </group>
    </RigidBody>
  );
};
