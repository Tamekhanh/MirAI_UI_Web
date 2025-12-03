import { VRMUtils } from "@pixiv/three-vrm";

/**
 * Optimizes a VRM model for better performance.
 * @param {import("@pixiv/three-vrm").VRM} vrm 
 * @param {THREE.Group} scene 
 */
export function optimizeVRM(vrm, scene) {
  // 1. Remove unused bones to reduce matrix calculations
  // This collapses the skeleton to only essential bones
  VRMUtils.removeUnnecessaryJoints(scene);

  // 2. Combine Skeletons (Standard optimization)
  VRMUtils.combineSkeletons(scene);

  // 3. Traverse and optimize meshes/materials
  scene.traverse((obj) => {
    if (obj.isMesh) {
      // Disable shadows - huge performance boost
      obj.castShadow = false;
      obj.receiveShadow = false;
      
      // Disable frustum culling
      // Since the avatar is always in view, calculating culling is wasted CPU
      obj.frustumCulled = false;

      // Optimize Material
      if (obj.material) {
        // Use lower precision for shaders
        obj.material.precision = 'mediump';
        
        // Disable dithering (noise pattern for gradients)
        obj.material.dithering = false;
        
        // If transparent, ensure depth write is handled correctly (sometimes helps)
        // obj.material.depthWrite = true; 
      }
    }
  });

  return vrm;
}
