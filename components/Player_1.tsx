import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Euler } from 'three';
import { RigidBody, CapsuleCollider, RapierRigidBody, useRapier } from '@react-three/rapier';
import { useStore } from '../store';
import { WeaponController } from './WeaponController';
import { PLAYER_SPEED, SPRINT_MULTIPLIER, JUMP_FORCE, CROUCH_MULTIPLIER } from '../constants';
import { Sphere, Cylinder } from '@react-three/drei';

export const Player = () => {
  const rigidBody = useRef<RapierRigidBody>(null);
  const { camera } = useThree();
  const { hp, takeDamage, setSprint, setCrouch, isSprinting, isCrouching } = useStore();
  const { rapier, world } = useRapier();

  // Input State
  const input = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });

  // Camera Rotation State
  const cameraEuler = useRef(new Euler(0, 0, 0, 'YXZ'));

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': input.current.forward = true; break;
        case 'KeyS': input.current.backward = true; break;
        case 'KeyA': input.current.left = true; break;
        case 'KeyD': input.current.right = true; break;
        case 'Space': input.current.jump = true; break;
        case 'ShiftLeft': setSprint(true); break;
        case 'ControlLeft': setCrouch(true); break;
        case 'Digit1': useStore.getState().switchWeapon('RIFLE'); break;
        case 'Digit2': useStore.getState().switchWeapon('SHOTGUN'); break;
        case 'Digit3': useStore.getState().switchWeapon('SMG'); break;
        case 'Digit4': useStore.getState().switchWeapon('ROCKET'); break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': input.current.forward = false; break;
        case 'KeyS': input.current.backward = false; break;
        case 'KeyA': input.current.left = false; break;
        case 'KeyD': input.current.right = false; break;
        case 'Space': input.current.jump = false; break;
        case 'ShiftLeft': setSprint(false); break;
        case 'ControlLeft': setCrouch(false); break;
      }
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        cameraEuler.current.y -= e.movementX * 0.002;
        cameraEuler.current.x -= e.movementY * 0.002;
        
        // Clamp look up/down
        cameraEuler.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraEuler.current.x));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  useFrame((state) => {
    if (!rigidBody.current || useStore.getState().gameOver) return;

    const rb = rigidBody.current;
    const velocity = rb.linvel();
    const pos = rb.translation();

    // Update Camera Rotation
    camera.quaternion.setFromEuler(cameraEuler.current);

    // Calculate movement direction relative to camera look direction (only Y axis)
    const frontVector = new Vector3(0, 0, Number(input.current.backward) - Number(input.current.forward));
    const sideVector = new Vector3(Number(input.current.left) - Number(input.current.right), 0, 0);
    const direction = new Vector3();
    
    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(PLAYER_SPEED);

    if (isSprinting) direction.multiplyScalar(SPRINT_MULTIPLIER);
    if (isCrouching) direction.multiplyScalar(CROUCH_MULTIPLIER);

    // Apply camera rotation (Y-axis only) to movement direction so W is always "forward"
    const moveRotation = new Euler(0, cameraEuler.current.y, 0, 'YXZ');
    direction.applyEuler(moveRotation);

    // Apply velocity (preserve Y for gravity)
    rb.setLinvel({ x: direction.x, y: velocity.y, z: direction.z }, true);

    // Jump
    if (input.current.jump) {
      // Raycast down to check if grounded
      const ray = new rapier.Ray(pos, { x: 0, y: -1, z: 0 });
      const hit = world.castRay(ray, 1.1, true);
      if (hit && Math.abs(velocity.y) < 0.1) {
         rb.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true);
      }
      input.current.jump = false; // Reset jump trigger
    }

    // Camera follow logic (FPS)
    // We attach camera directly to player head for simplicity in this demo, simulating eyes
    const camPos = new Vector3(pos.x, pos.y + (isCrouching ? 0.8 : 1.6), pos.z);
    camera.position.copy(camPos);
  });

  return (
    <group>
      <RigidBody 
        ref={rigidBody} 
        colliders={false} 
        mass={1} 
        type="dynamic" 
        position={[0, 5, 0]} 
        enabledRotations={[false, false, false]} // Prevent tipping over
        name="player"
        onCollisionEnter={(payload) => {
            if (payload.other.rigidBodyObject?.name === 'enemy_body') {
                takeDamage(5); // Contact damage
            }
        }}
      >
        <CapsuleCollider args={[isCrouching ? 0.4 : 0.8, 0.5]} />
        
        {/* Visible Body for Shadows/Reflections (Self) */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, isCrouching ? 1 : 1.8]} />
            <meshStandardMaterial color="#00ffcc" />
        </mesh>
      </RigidBody>

      {/* Weapon Manager attached to camera view */}
      <WeaponController camera={camera} playerId={rigidBody} position={new Vector3(0,0,0)} />
    </group>
  );
};