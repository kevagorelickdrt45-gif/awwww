import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Raycaster, Camera, Group } from 'three';
import { useStore } from '../store';
import { WEAPONS } from '../constants';
import { WeaponType } from '../types';
import { audio } from '../services/audioService';
import { Sphere, Box } from '@react-three/drei';
import { RapierRigidBody, RigidBody, CuboidCollider } from '@react-three/rapier';

interface WeaponControllerProps {
  camera: Camera;
  playerId: React.MutableRefObject<RapierRigidBody | null>;
  position: Vector3; // Hand position
}

const RocketProjectile: React.FC<{ position: Vector3, rotation: Quaternion, onExplode: (pos: Vector3) => void }> = ({ position, rotation, onExplode }) => {
  const rb = useRef<RapierRigidBody>(null);
  
  useEffect(() => {
    if (rb.current) {
      const direction = new Vector3(0, 0, -1).applyQuaternion(rotation);
      rb.current.setLinvel(direction.multiplyScalar(25), true);
    }
  }, []);

  return (
    <RigidBody 
      ref={rb} 
      position={position} 
      colliders="ball" 
      sensor 
      onIntersectionEnter={(payload) => {
        if (payload.other.rigidBodyObject?.name !== 'player') {
           onExplode(new Vector3().copy(rb.current?.translation() as Vector3));
        }
      }}
    >
      <Sphere args={[0.2]} >
        <meshStandardMaterial color="orange" emissive="red" emissiveIntensity={2} />
      </Sphere>
    </RigidBody>
  );
};

export const WeaponController: React.FC<WeaponControllerProps> = ({ camera, playerId }) => {
  const { currentWeapon, shootAmmo, isReloading, finishReload, addDamageText, isSprinting } = useStore();
  const weaponStats = WEAPONS[currentWeapon];
  
  const lastShotTime = useRef(0);
  const isMouseDown = useRef(false);
  const recoilOffset = useRef(new Vector3(0, 0, 0));
  const recoilRot = useRef(new Vector3(0, 0, 0));
  const gunRef = useRef<Group>(null);
  
  // Projectiles (Rockets)
  const [rockets, setRockets] = useState<{id: number, pos: Vector3, rot: Quaternion}[]>([]);

  // Muzzle Flash
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    const onMouseDown = () => (isMouseDown.current = true);
    const onMouseUp = () => (isMouseDown.current = false);
    
    // Reload logic
    let reloadTimer: ReturnType<typeof setTimeout>;
    if (isReloading) {
       audio.playReload();
       reloadTimer = setTimeout(() => {
         finishReload();
       }, weaponStats.reloadTime);
    }

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      clearTimeout(reloadTimer);
    };
  }, [isReloading, currentWeapon]);

  const shoot = () => {
    const now = Date.now();
    if (now - lastShotTime.current < weaponStats.fireRate) return;
    if (isSprinting) return; // Cannot shoot while sprinting

    if (shootAmmo()) {
      lastShotTime.current = now;
      
      // Audio
      audio.playShoot(
        currentWeapon === WeaponType.ROCKET ? 'rocket' : 
        currentWeapon === WeaponType.SHOTGUN ? 'heavy' : 'light'
      );

      // Recoil
      recoilOffset.current.z += 0.2;
      recoilRot.current.x += weaponStats.recoil;
      recoilRot.current.y += (Math.random() - 0.5) * weaponStats.recoil;

      // Flash
      setFlash(3); // frames to show flash

      // Logic
      if (currentWeapon === WeaponType.ROCKET) {
        // Spawn physical projectile
        const spawnPos = new Vector3();
        gunRef.current?.getWorldPosition(spawnPos);
        // Move slightly forward so it doesn't hit player
        spawnPos.add(new Vector3(0, 0, -1).applyQuaternion(camera.quaternion));
        
        setRockets(prev => [...prev, { id: now, pos: spawnPos, rot: camera.quaternion.clone() }]);
      } else {
        // Raycast
        const raycaster = new Raycaster();
        raycaster.setFromCamera({ x: 0, y: 0 }, camera);
        
        // Add spread
        const spread = weaponStats.spread;
        raycaster.ray.direction.x += (Math.random() - 0.5) * spread;
        raycaster.ray.direction.y += (Math.random() - 0.5) * spread;

        // Note: Actual hit detection needs access to scene objects. 
        // We will dispatch a custom event that the Main Scene listens to, or check intersections manually if we had the refs.
        // For this architecture, we will fire a ray into the scene globally.
        // A better way in R3F Rapier: use `rapier.world.castRay`.
        
        // We will emit an event for the GameScene to handle raycasting logic against enemies
        const event = new CustomEvent('player-shoot', { 
          detail: { 
            ray: raycaster.ray, 
            damage: weaponStats.damage, 
            count: currentWeapon === WeaponType.SHOTGUN ? 8 : 1 
          } 
        });
        window.dispatchEvent(event);
      }
    }
  };

  useFrame((state, delta) => {
    if (isMouseDown.current && weaponStats.automatic) {
      shoot();
    } else if (isMouseDown.current && !weaponStats.automatic) {
      // Semi-auto logic handled by click listener usually, but for simplicity here:
      if (Date.now() - lastShotTime.current > weaponStats.fireRate + 100) {
         // Reset semi-auto lock? simple implementation for now allows holding for pump shotgun with delay
         shoot();
      }
    }

    // Recover recoil
    recoilOffset.current.lerp(new Vector3(0, 0, 0), delta * 5);
    recoilRot.current.lerp(new Vector3(0, 0, 0), delta * 5);

    if (gunRef.current) {
      gunRef.current.position.lerp(new Vector3(0.4, -0.3, -0.5).add(recoilOffset.current), 0.5);
      gunRef.current.rotation.x = recoilRot.current.x;
      gunRef.current.rotation.y = recoilRot.current.y;
      
      // Weapon bob
      if (!isReloading && !isSprinting) {
        gunRef.current.position.y += Math.sin(state.clock.elapsedTime * 4) * 0.005;
      }
      if (isSprinting) {
         // Lower gun
         gunRef.current.rotation.x += 1.0;
      }
      if (isReloading) {
         gunRef.current.rotation.x -= 1.0; // Hide gun to reload
      }
    }

    if (flash > 0) setFlash(f => f - 1);
  });

  const handleRocketExplode = (id: number, pos: Vector3) => {
    audio.playExplosion();
    setRockets(prev => prev.filter(r => r.id !== id));
    // Dispatch explosion event
    window.dispatchEvent(new CustomEvent('rocket-explode', { detail: { position: pos, radius: 5, damage: 150 } }));
  };

  return (
    <group>
      {/* Gun Model Placeholder attached to camera */}
      <group ref={gunRef} position={[0.4, -0.3, -0.5]}>
        <Box args={[0.1, 0.1, 0.6]}>
          <meshStandardMaterial color={weaponStats.color} />
        </Box>
        <Box args={[0.05, 0.2, 0.1]} position={[0, -0.1, 0.2]}>
          <meshStandardMaterial color="#333" />
        </Box>
        {flash > 0 && (
          <pointLight position={[0, 0, -0.4]} intensity={2} color="yellow" distance={5} />
        )}
      </group>

      {rockets.map(r => (
        <RocketProjectile 
          key={r.id} 
          position={r.pos} 
          rotation={r.rot} 
          onExplode={(pos) => handleRocketExplode(r.id, pos)} 
        />
      ))}
    </group>
  );
};