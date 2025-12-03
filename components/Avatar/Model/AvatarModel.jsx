"use client";
import { useFrame, useLoader } from "@react-three/fiber";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useEffect, useRef, useState } from "react";
import { optimizeVRM } from "../utils/optimization";

// Component AvatarModel (Updated to use useLoader for preloading)
export default function AvatarModel({ emotion, blendShapes, onReady }) {
  const gltf = useLoader(GLTFLoader, "/Mirai_AI_Casual_VRM0.0.vrm", (loader) => {
    loader.register((parser) => new VRMLoaderPlugin(parser));
  });
  
  const [vrm, setVrm] = useState(null);
  const group = useRef();
  const mixerRef = useRef(null);
  const timeAccumulator = useRef(0);

  useEffect(() => {
    if (!gltf || !gltf.userData.vrm) return;
    const loadedVrm = gltf.userData.vrm;

    if (vrm !== loadedVrm) {
      // Ensure we only setup the VRM once (since useLoader caches the result)
      if (!loadedVrm.__isSetup) {
        // Apply aggressive optimizations
        optimizeVRM(loadedVrm, gltf.scene);
        
        VRMUtils.rotateVRM0(loadedVrm);
        loadedVrm.__isSetup = true;
      }
      
      setVrm(loadedVrm);
      mixerRef.current = new THREE.AnimationMixer(loadedVrm.scene);
      if (onReady) onReady({ vrm: loadedVrm, mixer: mixerRef.current });
    }

    return () => {
      if (mixerRef.current) mixerRef.current.stopAllAction();
    };
  }, [gltf, onReady, vrm]);

  useFrame((state, delta) => {
    if (vrm) {
      // Throttle physics/animation updates to 30 FPS
      const INTERVAL = 1 / 12;
      
      // Clamp delta to prevent huge jumps (e.g. tab switching)
      const cappedDelta = Math.min(delta, 1);
      
      timeAccumulator.current += cappedDelta;

      // Only update if enough time has passed
      if (timeAccumulator.current >= INTERVAL) {
        // Update physics/animation with fixed time step
        if (mixerRef.current) mixerRef.current.update(INTERVAL);

        // Handle Expressions (BlendShapes)
        // @pixiv/three-vrm v1.0+ uses expressionManager instead of blendShapeProxy
        const expressionManager = vrm.expressionManager || vrm.blendShapeProxy;
        
        if (expressionManager) {
            const getWeight = (name) => expressionManager.getValue(name);
            const setWeight = (name, val) => expressionManager.setValue(name, val);
            
            // Map VRM 0.0 names to VRM 1.0 names
            // Joy -> happy, Angry -> angry
            // A,I,U,E,O -> aa, ih, ou, ee, oh
            
            const happyVal = emotion === "smile" ? 0.8 : 0;
            const angryVal = emotion === "angry" ? 0.8 : 0;
            
            // Use 'happy' for VRM 1.0 (loader maps Joy -> happy)
            setWeight('happy', THREE.MathUtils.lerp(getWeight('happy'), happyVal, INTERVAL * 10));
            setWeight('angry', THREE.MathUtils.lerp(getWeight('angry'), angryVal, INTERVAL * 10));

            if (blendShapes) {
                const presetMap = { A: 'aa', I: 'ih', U: 'ou', E: 'ee', O: 'oh' };
                Object.entries(blendShapes).forEach(([key, value]) => {
                    const target = presetMap[key] || key;
                    setWeight(target, THREE.MathUtils.lerp(getWeight(target), value, INTERVAL * 10));
                });
            }
        }

        vrm.update(INTERVAL);

        // Subtract interval (keep remainder for next frame)
        timeAccumulator.current %= INTERVAL;
      }
    }
  });

  return vrm ? <primitive object={vrm.scene} ref={group} scale={1.2} /> : null;
}

// Preload the model
useLoader.preload(GLTFLoader, "/Mirai_AI_model.vrm", (loader) => {
  loader.register((parser) => new VRMLoaderPlugin(parser));
});