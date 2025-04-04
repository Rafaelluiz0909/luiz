import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface Avatar3DProps {
  isSpeaking: boolean;
}

function Head({ isSpeaking }: { isSpeaking: boolean }) {
  const headRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  const upperLipRef = useRef<THREE.Mesh>(null);
  const lowerLipRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (upperLipRef.current && lowerLipRef.current) {
      if (isSpeaking) {
        // Animação da boca quando falando
        const animate = () => {
          if (!upperLipRef.current || !lowerLipRef.current) return;
          
          const time = Date.now() * 0.005;
          const openAmount = Math.sin(time) * 0.1 + 0.1;
          
          upperLipRef.current.position.y = 0.3 + openAmount;
          lowerLipRef.current.position.y = -0.3 - openAmount;
        };

        const animationId = setInterval(animate, 16);
        return () => clearInterval(animationId);
      } else {
        // Posição normal da boca
        upperLipRef.current.position.y = 0.3;
        lowerLipRef.current.position.y = -0.3;
      }
    }

    // Animação dos olhos piscando
    const blinkEyes = () => {
      if (eyeLeftRef.current && eyeRightRef.current) {
        eyeLeftRef.current.scale.y = 0.1;
        eyeRightRef.current.scale.y = 0.1;
        
        setTimeout(() => {
          if (eyeLeftRef.current && eyeRightRef.current) {
            eyeLeftRef.current.scale.y = 1;
            eyeRightRef.current.scale.y = 1;
          }
        }, 150);
      }
    };

    const blinkInterval = setInterval(blinkEyes, 4000);
    return () => clearInterval(blinkInterval);
  }, [isSpeaking]);

  return (
    <group>
      {/* Cabeça */}
      <mesh ref={headRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#f4a261" />
      </mesh>

      {/* Olhos */}
      <mesh ref={eyeLeftRef} position={[-0.3, 0.2, 0.8]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#2a9d8f" />
      </mesh>
      <mesh ref={eyeRightRef} position={[0.3, 0.2, 0.8]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#2a9d8f" />
      </mesh>

      {/* Boca - Lábio Superior */}
      <mesh ref={upperLipRef} position={[0, 0.3, 0.8]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.4, 0.08, 0.1]} />
        <meshStandardMaterial color="#e76f51" />
      </mesh>

      {/* Boca - Lábio Inferior */}
      <mesh ref={lowerLipRef} position={[0, -0.3, 0.8]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.4, 0.08, 0.1]} />
        <meshStandardMaterial color="#e76f51" />
      </mesh>

      {/* Sobrancelhas */}
      <mesh position={[-0.3, 0.4, 0.8]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.2, 0.05, 0.05]} />
        <meshStandardMaterial color="#774936" />
      </mesh>
      <mesh position={[0.3, 0.4, 0.8]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.2, 0.05, 0.05]} />
        <meshStandardMaterial color="#774936" />
      </mesh>

      {/* Nariz */}
      <mesh position={[0, 0, 0.9]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.1, 0.2, 0.1]} />
        <meshStandardMaterial color="#e9c46a" />
      </mesh>
    </group>
  );
}

export function Avatar3D({ isSpeaking }: Avatar3DProps) {
  return (
    <div className="w-64 h-64 bg-zinc-900 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Head isSpeaking={isSpeaking} />
        <OrbitControls 
          enableZoom={false}
          minPolarAngle={Math.PI/2 - 0.5}
          maxPolarAngle={Math.PI/2 + 0.5}
        />
      </Canvas>
    </div>
  );
}