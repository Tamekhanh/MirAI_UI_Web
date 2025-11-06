// Avatar3D.jsx
"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
// Import này vẫn đúng
import * as VRMAnimation from "@pixiv/three-vrm-animation";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { compareBones } from "../lib/vrmBoneUtils";

// Component AvatarModel (Không đổi, đã đúng)
function AvatarModel({ emotion, onReady }) {
  const [vrm, setVrm] = useState(null);
  const group = useRef();
  const mixerRef = useRef(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    loader.load("/Mirai_AI_model.vrm", (gltf) => {
      VRMUtils.combineSkeletons(gltf.scene);
      const loadedVrm = gltf.userData.vrm;
      VRMUtils.rotateVRM0(loadedVrm);
      setVrm(loadedVrm);
      mixerRef.current = new THREE.AnimationMixer(loadedVrm.scene);
      if (onReady) onReady({ vrm: loadedVrm, mixer: mixerRef.current });
    });

    return () => {
      if (mixerRef.current) mixerRef.current.stopAllAction();
    };
  }, [onReady]);

  useFrame((state, delta) => {
    if (vrm) {
      vrm.update(delta);
      if (mixerRef.current) mixerRef.current.update(delta);
      const proxy = vrm.blendShapeProxy;
      if (proxy) {
        proxy.setValue("Joy", THREE.MathUtils.lerp(proxy.getValue("Joy"), emotion === "smile" ? 0.8 : 0, delta * 10));
        proxy.setValue("Angry", THREE.MathUtils.lerp(proxy.getValue("Angry"), emotion === "angry" ? 0.8 : 0, delta * 10));
      }
    }
  });

  return vrm ? <primitive object={vrm.scene} ref={group} scale={1.2} /> : null;
}

// Component chính
export default function Avatar3D({ emotion }) {
  const [clips, setClips] = useState([]);
  const mixerRef = useRef(null);
  const vrmRef = useRef(null);
  // Khởi tạo loaderRef. Chúng ta sẽ đăng ký plugin BÊN TRONG handleReady
  const loaderRef = useRef(new GLTFLoader());
  
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
  ];

  // *** TOÀN BỘ THAY ĐỔI NẰM Ở ĐÂY ***
  const handleReady = useCallback(({ vrm, mixer }) => {
    vrmRef.current = vrm;
    mixerRef.current = mixer;
    const loader = loaderRef.current;

    // **ĐÂY LÀ BƯỚC QUAN TRỌNG:**
    // Chúng ta cần đăng ký CẢ HAI plugin cho loader animation
    
    // 1. Plugin VRM (để loader hiểu file .vrm và .vrma)
    // (Ghi chú: loader trong AvatarModel đã có cái này, nhưng loader này CŨNG cần)
    loader.register((parser) => new VRMLoaderPlugin(parser));
    
    // 2. Plugin Animation (để nó TỰ ĐỘNG retarget)
    // Chúng ta truyền `vrm` (model Mirai) vào làm mục tiêu
    loader.register(
      (parser) => new VRMAnimation.VRMAnimationLoaderPlugin(parser, { vrm: vrm })
    );

    // Bây giờ, chúng ta tải animation như bình thường
    const promises = animationFiles.map(({ file, name }) => {
      return new Promise((resolve, reject) => {
        loader.load(
          file,
          (gltf) => {
            if (gltf && gltf.animations && gltf.animations.length) {
              // clip này đã được `VRMAnimationLoaderPlugin` TỰ ĐỘNG retarget
              const retargetedClip = gltf.animations[0];
              
              retargetedClip.name = name;
              resolve({ name, clip: retargetedClip });
            } else {
              reject(new Error(`Không tìm thấy animation trong file: ${file}`));
            }
          },
          undefined,
          (err) => reject(err)
        );
      });
    });

    Promise.all(promises)
      .then((retargetedClips) => {
        setClips(retargetedClips);
      })
      .catch((err) => {
        console.warn("Lỗi khi load hoặc retarget animations:", err);
      });
  }, []); // useCallback dependency rỗng là OK


  function playAnimation(name) {
    const entry = clips.find((c) => c.name === name);
    const mixer = mixerRef.current;
    if (!entry || !mixer) return;
    try {
      mixer.stopAllAction();
      const action = mixer.clipAction(entry.clip);
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
          {clips.length === 0 && <div style={{ padding: 6, background: "rgba(0,0,0,0.6)", color: "#fff" }}>Đang tải animations...</div>}
          {clips.map((c) => (
            <button
              key={c.name}
              onClick={() => playAnimation(c.name)}
              style={{ padding: "6px 10px", background: "#111111ff", borderRadius: 6, border: "none", cursor: "pointer" }}
            >
              {c.name}
            </button>
          ))}
          <button
            onClick={handleCompareClick}
            disabled={comparing}
            title="Compare VRM bones with first animation file and download JSON"
            style={{ padding: "6px 10px", background: "#2b6cb0", color: '#fff', borderRadius: 6, border: "none", cursor: "pointer" }}
          >
            {comparing ? 'Comparing...' : 'Compare Bones'}
          </button>
        </div>
        {compareResult && (
          <div style={{ marginTop: 8, background: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 6, color: '#fff', maxWidth: 420 }}>
            <div><strong>Compare result:</strong></div>
            <div>VRM bones: {compareResult.vrmBones.length}</div>
            <div>Animation nodes: {compareResult.animNodes.length}</div>
            <div>Both: {compareResult.both.length}</div>
            <div>Only in VRM: {compareResult.leftOnly.length}</div>
            <div>Only in animation: {compareResult.rightOnly.length}</div>
          </div>
        )}
      </div>

      <Canvas camera={{ position: [0, 1.5, 2.5], fov: 20 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[1, 2, 3]} intensity={1.5} />
        <Suspense fallback={null}>
          <AvatarModel emotion={emotion} onReady={handleReady} />
        </Suspense>
        <OrbitControls
          target={[0, 1.6, 0]}
          enablePan={false}
          enableZoom={true}
          distance={0.5}
          maxPolarAngle={Math.PI / 1.8}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}