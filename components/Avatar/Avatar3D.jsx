// Avatar3D.jsx
"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { VRMLoaderPlugin } from "@pixiv/three-vrm";
import * as VRMAnimation from "@pixiv/three-vrm-animation";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useState, useRef, Suspense, useCallback, useEffect } from "react";

import { compareBones } from "../../lib/vrmBoneUtils";
import AvatarModel from "./Model/AvatarModel";

import style from './Avatar3D.module.css';

// Component chính
export default function Avatar3D({ emotion, audioData }) {
  const [clips, setClips] = useState([]);
  const [blendShapes, setBlendShapes] = useState({ A: 0, I: 0, U: 0, E: 0, O: 0 });
  const mixerRef = useRef(null);
  const vrmRef = useRef(null);
  
  // Audio & LipSync Refs
  const audioRef = useRef(null);
  const lipSyncDataRef = useRef(null);
  const requestRef = useRef();
  const lastShapeRef = useRef(null); // To avoid redundant state updates

  useEffect(() => {
    if (!audioData) return;

    const { audioUrl, lipSyncUrl } = audioData;

    // 1. Fetch Lip Sync Data
    fetch(lipSyncUrl)
      .then(res => res.json())
      .then(data => {
          lipSyncDataRef.current = data;
          
          // 2. Play Audio
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
          }
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          
          audio.play().catch(e => console.error("Audio play error", e));
          
          // 3. Start Animation Loop
          const animate = () => {
              if (!audioRef.current || audioRef.current.paused || audioRef.current.ended) {
                  // Reset mouth if stopped
                  if (lastShapeRef.current !== 'X') {
                    setBlendShapes({ A: 0, I: 0, U: 0, E: 0, O: 0 });
                    lastShapeRef.current = 'X';
                  }
                  return;
              }
              
              const currentTime = audioRef.current.currentTime;
              updateMouth(currentTime);
              requestRef.current = requestAnimationFrame(animate);
          };
          requestRef.current = requestAnimationFrame(animate);
          
          audio.onended = () => {
              cancelAnimationFrame(requestRef.current);
              setBlendShapes({ A: 0, I: 0, U: 0, E: 0, O: 0 });
              lastShapeRef.current = 'X';
          };
      })
      .catch(err => console.error("Failed to load lip sync", err));

    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (audioRef.current) audioRef.current.pause();
    };
  }, [audioData]);

  const updateMouth = (currentTime) => {
      if (!lipSyncDataRef.current || !lipSyncDataRef.current.mouthCues) return;
      
      const cues = lipSyncDataRef.current.mouthCues;
      // Find current cue
      const currentCue = cues.find(cue => currentTime >= cue.start && currentTime <= cue.end);
      
      if (currentCue) {
          const shape = currentCue.value; // Object (e.g. {A: 0.8, E: 0.2}) or "X"
          
          // Check if shape changed (by reference is enough since it comes from the same JSON object)
          if (lastShapeRef.current !== shape) {
            const newShapes = { A: 0, I: 0, U: 0, E: 0, O: 0 };
            
            if (shape !== 'X' && typeof shape === 'object') {
                // Merge shape weights into newShapes
                Object.assign(newShapes, shape);
            } else if (typeof shape === 'string' && shape !== 'X') {
                // Backward compatibility for single string values
                if (newShapes.hasOwnProperty(shape)) {
                    newShapes[shape] = 1;
                }
            }
            
            setBlendShapes(newShapes);
            lastShapeRef.current = shape;
          }
      } else {
          if (lastShapeRef.current !== 'X') {
            setBlendShapes({ A: 0, I: 0, U: 0, E: 0, O: 0 });
            lastShapeRef.current = 'X';
          }
      }
  };

  const [compareResult, setCompareResult] = useState(null);
  const [comparing, setComparing] = useState(false);

  const animationFiles = [
    { file: "/animations/VRMA_01.vrma", name: "VRMA_01" },
    { file: "/animations/VRMA_02.vrma", name: "VRMA_02" },
    { file: "/animations/VRMA_03.vrma", name: "VRMA_03" },
    { file: "/animations/VRMA_04.vrma", name: "VRMA_04" },
    { file: "/animations/VRMA_05.vrma", name: "VRMA_05" },
    { file: "/animations/VRMA_06.vrma", name: "VRMA_06" },
    { file: "/animations/VRMA_07.vrma", name: "VRMA_07" },
    { file: "/animations/VRMA_08.vrma", name: "VRMA_08" },
    { file: "/animations/VRMA_09.vrma", name: "VRMA_09" },
  ];

  // *** TOÀN BỘ THAY ĐỔI NẰM Ở ĐÂY ***
  const handleReady = useCallback(({ vrm, mixer }) => {
    vrmRef.current = vrm;
    mixerRef.current = mixer;
    // Optimization: Animations are now loaded on-demand when clicked to reduce initial lag
    playAnimation("VRMA_02", "/animations/VRMA_02.vrma");
  }, []); // useCallback dependency rỗng là OK


  const [loadingAnim, setLoadingAnim] = useState(false);

  function playAnimation(name, file) {
    const mixer = mixerRef.current;
    const vrm = vrmRef.current;
    if (!mixer || !vrm) return;

    // 1. Check if clip is already loaded
    const existingEntry = clips.find((c) => c.name === name);
    if (existingEntry) {
      playClipInternal(existingEntry.clip);
      return;
    }

    // 2. Load if not exists
    setLoadingAnim(true);
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    loader.register((parser) => new VRMAnimation.VRMAnimationLoaderPlugin(parser));

    loader.load(
      file,
      (gltf) => {
        const vrmAnimations = gltf.userData.vrmAnimations;
        let clip = null;

        if (vrmAnimations && vrmAnimations.length > 0) {
          clip = VRMAnimation.createVRMAnimationClip(vrmAnimations[0], vrm);
        } else if (gltf.animations && gltf.animations.length) {
          clip = gltf.animations[0];
        }

        if (clip) {
          clip.name = name;
          setClips((prev) => [...prev, { name, clip }]);
          playClipInternal(clip);
        }
        setLoadingAnim(false);
      },
      undefined,
      (err) => {
        console.warn("Error loading animation:", err);
        setLoadingAnim(false);
      }
    );
  }

  function playClipInternal(clip) {
    const mixer = mixerRef.current;
    if (!mixer) return;
    try {
      mixer.stopAllAction();
      const action = mixer.clipAction(clip);
      action.reset();
      action.setLoop(THREE.LoopOnce, 0);
      action.clampWhenFinished = true;
      action.play();
    } catch (e) {
      // ignore
    }
  }

  // Hàm debug (không đổi)
  async function handleCompareClick() {
    setComparing(true);
    try {
      const anim = animationFiles.length ? animationFiles[0].file : '/animations/VRMA_01.vrma';
      // Lưu ý: hàm compareBones của bạn có thể sẽ cần đăng ký VRMLoaderPlugin
      // cho loader riêng của nó để có thể đọc file .vrma
      const res = await compareBones('/Mirai_AI_model.vrm', anim);
      setCompareResult(res);
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compare-${(anim || 'anim').replace(/\W+/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Compare failed', e);
    } finally {
      setComparing(false);
    }
  }

  // JSX (không đổi)
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Animation UI overlay (không đổi) */}
      <div style={{ position: "absolute", left: 8, top: 8, zIndex: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: 'center' }}>
          {loadingAnim && <div style={{ padding: 6, background: "rgba(0,0,0,0.6)", color: "#fff" }}>Loading...</div>}
          {animationFiles.map((anim) => (
            <button
              key={anim.name}
              onClick={() => playAnimation(anim.name, anim.file)}
              style={{ padding: "6px 10px", background: "#111111ff", borderRadius: 6, border: "none", cursor: "pointer" }}
            >
              {anim.name}
            </button>
          ))}
        </div>
      </div>

      {/* BlendShape Sliders */}
      <div style={{ position: "absolute", right: 8, top: 8, zIndex: 10, background: "rgba(0,0,0,0.6)", padding: 10, borderRadius: 8, color: "white", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ marginBottom: 4, fontWeight: 'bold', fontSize: '0.9em' }}>Vowel Mouth Shapes</div>
        {Object.keys(blendShapes).map((key) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 15, fontWeight: 'bold' }}>{key}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={blendShapes[key]}
              onChange={(e) => setBlendShapes(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
              style={{ cursor: 'pointer' }}
            />
          </div>
        ))}
      </div>

      <Canvas 
        camera={{ position: [0, 1.5, 2.5], fov: 20 }} 
        dpr={1} // Force 1x resolution to fix lag on high-DPI PC monitors
        performance={{ min: 0.5, max: 1 }}
        gl={{ 
          antialias: false, 
          powerPreference: "high-performance",
          precision: "mediump",
          depth: true,
          stencil: false,
          alpha: false 
        }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[1, 2, 3]} intensity={1.5} />
        <Suspense fallback={null}>
          <AvatarModel emotion={emotion} blendShapes={blendShapes} onReady={handleReady} />
        </Suspense>
        <OrbitControls
          target={[0, 1.6, 0]}
          enablePan={false}
          enableZoom={false}
          distance={0.5}
          maxPolarAngle={Math.PI / 1.8}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
}