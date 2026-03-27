import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Standard professional Ready Player Me avatar
const AVATAR_URL = 'https://models.readyplayer.me/65a8dba831b23abb4f401bae.glb';

const AvatarModel = ({ isSpeaking }) => {
    // Load the 3D model
    const { scene, nodes, materials } = useGLTF(AVATAR_URL);
    const headRef = useRef();

    // Find the head mesh that contains morph targets for facial expressions
    useEffect(() => {
        scene.traverse((child) => {
            if (child.isMesh && child.morphTargetDictionary) {
                // Usually the head mesh contains the blendshapes for mouth/visemes
                if (child.name.includes('Head') || child.morphTargetDictionary['viseme_aa']) {
                    headRef.current = child;
                }
            }
        });
    }, [scene]);

    useFrame((state, delta) => {
        if (!headRef.current) return;

        const mesh = headRef.current;
        const dict = mesh.morphTargetDictionary;
        const influences = mesh.morphTargetInfluences;

        // Try to locate mouth opening visemes (Ready Player Me standard visemes)
        const mouthOpenIdx = dict['viseme_O'] !== undefined ? dict['viseme_O'] : dict['mouthOpen'];
        const jawOpenIdx = dict['viseme_aa'] !== undefined ? dict['viseme_aa'] : dict['jawOpen'];

        if (isSpeaking) {
            // Simulate lip-syncing using a randomized sine wave pattern
            const time = state.clock.getElapsedTime();
            // Create a randomized jittering effect for speaking
            const talkValue = (Math.sin(time * 15) * 0.5 + 0.5) * (Math.random() * 0.5 + 0.5);
            
            if (mouthOpenIdx !== undefined) influences[mouthOpenIdx] = talkValue;
            if (jawOpenIdx !== undefined) influences[jawOpenIdx] = talkValue * 0.8;
            
            // Add slight head bobbing when speaking
            scene.rotation.x = THREE.MathUtils.lerp(scene.rotation.x, (Math.sin(time * 2) * 0.05), 0.1);
        } else {
            // Smoothly close mouth when not speaking
            if (mouthOpenIdx !== undefined) influences[mouthOpenIdx] = THREE.MathUtils.lerp(influences[mouthOpenIdx], 0, 0.2);
            if (jawOpenIdx !== undefined) influences[jawOpenIdx] = THREE.MathUtils.lerp(influences[jawOpenIdx], 0, 0.2);
            
            // Return head to idle position
            scene.rotation.x = THREE.MathUtils.lerp(scene.rotation.x, 0, 0.1);
        }
        
        // Idle breathing animation
        scene.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.02 - 1.5;
    });

    return (
        <primitive object={scene} scale={2} position={[0, -1.5, 0]} />
    );
};

const VirtualInterviewer = ({ isSpeaking }) => {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)', borderRadius: '12px', overflow: 'hidden' }}>
            <Canvas camera={{ position: [0, 0.5, 3], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[2, 2, 2]} intensity={1.5} castShadow />
                <directionalLight position={[-2, 1, 1]} intensity={0.5} color="#4f46e5" />
                <Environment preset="city" />
                
                <React.Suspense fallback={null}>
                    <AvatarModel isSpeaking={isSpeaking} />
                    <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={5} blur={2.5} far={4} />
                </React.Suspense>
                
                <OrbitControls 
                    enableZoom={false} 
                    enablePan={false}
                    minPolarAngle={Math.PI / 2.5}
                    maxPolarAngle={Math.PI / 2}
                    minAzimuthAngle={-Math.PI / 6}
                    maxAzimuthAngle={Math.PI / 6}
                />
            </Canvas>
            
            {/* Minimal loading state fallback since Drei Suspense handles internal loading */}
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: isSpeaking ? '#10b981' : '#64748b', transition: 'background 0.3s' }} />
                <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 500 }}>
                    {isSpeaking ? 'AI is speaking...' : 'AI is listening'}
                </span>
            </div>
        </div>
    );
};

// Preload the model to avoid pop-in
useGLTF.preload(AVATAR_URL);

export default VirtualInterviewer;
