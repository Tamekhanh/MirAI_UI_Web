import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

// Utility to promisify GLTFLoader.load
function loadGltfWithLoader(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf), undefined, (err) => reject(err));
  });
}

function ensureLoader() {
  const loader = new GLTFLoader();
  try {
    loader.register((parser) => new VRMLoaderPlugin(parser));
  } catch (e) {
    // some bundlers/plugins may re-register; ignore
  }
  return loader;
}

function collectBonesFromScene(scene) {
  const bones = new Set();
  if (!scene) return [];

  scene.traverse((node) => {
    if (!node) return;
    // three Bone instances
    if (node.type === 'Bone') {
      bones.add(node.name || node.uuid);
    }
    // skinned meshes -> skeleton bones
    if (node.isSkinnedMesh && node.skeleton && Array.isArray(node.skeleton.bones)) {
      node.skeleton.bones.forEach((b) => bones.add(b.name || b.uuid));
    }
  });

  return Array.from(bones).filter(Boolean).sort();
}

// Extract names from animation track targets and from scene bones
function collectNodesFromAnimations(gltf) {
  const nodes = new Set();
  if (!gltf) return [];
  const { animations, scene } = gltf;
  if (Array.isArray(animations)) {
    animations.forEach((clip) => {
      if (!clip || !Array.isArray(clip.tracks)) return;
      clip.tracks.forEach((track) => {
        if (!track || typeof track.name !== 'string') return;
        // Typical track.name formats: 'Armature.Hip.rotation' or 'root/hip.position' or 'nodeName.property'
        const raw = track.name.split(/[/.]/)[0];
        if (raw) nodes.add(raw);
      });
    });
  }

  // also include bones found in the animation file's scene (if any)
  if (scene) {
    collectBonesFromScene(scene).forEach((b) => nodes.add(b));
  }

  return Array.from(nodes).filter(Boolean).sort();
}

// Public: get bone names from a VRM file (url)
export async function getVrmBones(vrmUrl = '/Mirai_AI_model.vrm') {
  const loader = ensureLoader();
  try {
    const gltf = await loadGltfWithLoader(loader, vrmUrl);
    // prefer combineSkeletons when available for better results
    try {
      if (typeof VRMUtils.combineSkeletons === 'function') {
        VRMUtils.combineSkeletons(gltf.scene);
      } else if (typeof VRMUtils.removeUnnecessaryJoints === 'function') {
        VRMUtils.removeUnnecessaryJoints(gltf.scene);
      }
    } catch (e) {
      // ignore optimization errors
      console.warn('VRM skeleton optimization failed', e);
    }

    const bones = collectBonesFromScene(gltf.scene);

    // try to include humanoid mapping names if available
    try {
      const vrm = gltf.userData && gltf.userData.vrm;
      if (vrm && vrm.humanoid && vrm.humanoid.humanBones) {
        Object.values(vrm.humanoid.humanBones).forEach((hb) => {
          if (hb && hb.nodeName) bones.push(hb.nodeName);
        });
      }
    } catch (e) {
      // ignore
    }

    // unique + sort
    return Array.from(new Set(bones)).filter(Boolean).sort();
  } catch (err) {
    console.warn('Failed to load VRM for bone extraction:', vrmUrl, err);
    return [];
  }
}

// Public: get node names referenced by animation tracks in a VRMA/GLTF file
export async function getAnimationNodes(animUrl) {
  const loader = ensureLoader();
  try {
    const gltf = await loadGltfWithLoader(loader, animUrl);
    const nodes = collectNodesFromAnimations(gltf);
    return nodes;
  } catch (err) {
    console.warn('Failed to load animation file for node extraction:', animUrl, err);
    return [];
  }
}

// Public: compare VRM bones vs animation nodes and return a diff object
export async function compareBones(vrmUrl = '/Mirai_AI_model.vrm', animUrl = '/animations/VRMA_01.vrma') {
  const [vrmBones, animNodes] = await Promise.all([getVrmBones(vrmUrl), getAnimationNodes(animUrl)]);
  const leftOnly = vrmBones.filter((x) => !animNodes.includes(x));
  const rightOnly = animNodes.filter((x) => !vrmBones.includes(x));
  const both = vrmBones.filter((x) => animNodes.includes(x));
  return { vrmBones, animNodes, leftOnly, rightOnly, both };
}
