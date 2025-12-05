import React from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store';

const SingleNumber = ({ id, position, value, isCrit, onComplete }: any) => {
  const [offset, setOffset] = React.useState(0);
  
  useFrame((state, delta) => {
    setOffset(prev => prev + delta * 2);
    if (offset > 1.5) onComplete(id);
  });

  return (
    <Html position={[position[0], position[1] + offset, position[2]]} center style={{ pointerEvents: 'none' }}>
      <div className={`text-2xl font-bold ${isCrit ? 'text-red-500 text-4xl' : 'text-white'} drop-shadow-md`}>
        {value}
      </div>
    </Html>
  );
};

export const DamageNumbers = () => {
  const { damageTexts, removeDamageText } = useStore();
  
  return (
    <>
      {damageTexts.map(dt => (
        <SingleNumber 
          key={dt.id} 
          {...dt} 
          onComplete={() => removeDamageText(dt.id)} 
        />
      ))}
    </>
  );
};
