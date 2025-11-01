// Avatar3D.jsx
"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { useEffect, useRef, useState, Suspense } from "react"; // Thêm Suspense

// ... (component AvatarModel không đổi) ...
function AvatarModel({ emotion }) {
  const [vrm, setVrm] = useState(null);
  const group = useRef();

  // --- Load VRM model ---
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    loader.load("/Mirai_AI_model.vrm", (gltf) => {
      VRMUtils.removeUnnecessaryJoints(gltf.scene);
      const loadedVrm = gltf.userData.vrm;
      VRMUtils.rotateVRM0(loadedVrm);
      setVrm(loadedVrm);
    });
  }, []);

  // --- Animation update ---
  useFrame((state, delta) => {
    if (vrm) {
      vrm.update(delta);
      const proxy = vrm.blendShapeProxy;
      if (proxy) {
        // Bạn có thể làm mượt chuyển động bằng THREE.MathUtils.lerp
        proxy.setValue("Joy", THREE.MathUtils.lerp(proxy.getValue("Joy"), emotion === "smile" ? 0.8 : 0, delta * 10));
        proxy.setValue("Angry", THREE.MathUtils.lerp(proxy.getValue("Angry"), emotion === "angry" ? 0.8 : 0, delta * 10));
        // Bạn có thể thêm các biểu cảm khác ở đây
      }
    }
  });

  return vrm ? <primitive object={vrm.scene} ref={group} scale={1.2} /> : null;
}

// Component chính
export default function Avatar3D({ emotion }) {
  return (
    <Canvas camera={{ position: [0, 1.5, 2.5], fov: 20 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[1, 2, 3]} intensity={1.5} />
      <Suspense fallback={null}> {/* Thêm Suspense để chờ model load */}
        <AvatarModel emotion={emotion} />
      </Suspense>
      <OrbitControls
        target={[0, 1.6, 0]} /* Đặt mục tiêu nhìn vào ngực/cổ */
        enablePan={false} /* Tắt kéo (pan) */
        enableZoom={false} /* Cho phép zoom */
        distance={0.5}
        maxPolarAngle={Math.PI / 1.8} /* Giới hạn góc nhìn từ trên xuống */
        enableRotate={false} /* Tắt xoay quanh mô hình */
      />
    </Canvas>
  );
}