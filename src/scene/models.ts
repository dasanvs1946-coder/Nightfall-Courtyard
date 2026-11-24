import * as THREE from 'three';
import { SKIN_SPECS } from '../game/career';
import { DRONE_SPECS } from '../game/drones';
import { CrateKind, DroneId, SkinId, WeaponCamoId, WeaponId, ZombieKind } from '../game/types';
import { TexturedSurfaceSet } from './textures';

export interface PlayerRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  weaponModels: Record<WeaponId, THREE.Group>;
  muzzlePoint: THREE.Object3D;
  muzzleFlash: THREE.Group;
  flashLight: THREE.PointLight | null;
  flashlightSpot: THREE.SpotLight;
  flashlightCone: THREE.Mesh;
  armorMat: THREE.MeshStandardMaterial;
  clothMat: THREE.MeshStandardMaterial;
  pouchMat: THREE.MeshStandardMaterial;
  visorMat: THREE.MeshStandardMaterial;
  trimMat: THREE.MeshStandardMaterial;
  footRingMat: THREE.MeshBasicMaterial;
  coneMat: THREE.MeshBasicMaterial;
  bioPackGroup: THREE.Group;
  katanaGroup: THREE.Group;
  hoodGroup: THREE.Group;
  exoTrimGroup: THREE.Group;
  reloadArcSegments: THREE.Mesh[];
  dashArcSegments: THREE.Mesh[];
}

const sharedGeoCache = new Map<string, THREE.BufferGeometry>();

function getSharedGeo(
  key: string,
  factory: () => THREE.BufferGeometry,
): THREE.BufferGeometry {
  let geo = sharedGeoCache.get(key);
  if (!geo) {
    geo = factory();
    geo.userData.shared = true;
    sharedGeoCache.set(key, geo);
  }
  return geo;
}

export function disposeSharedModelGeometries(): void {
  for (const geo of sharedGeoCache.values()) {
    geo.dispose();
  }
  sharedGeoCache.clear();
}

export function disposeObject3DTree(root: THREE.Object3D): void {
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.geometry && !mesh.geometry.userData?.shared) {
      mesh.geometry.dispose();
    }
    const mat = (mesh as { material?: THREE.Material | THREE.Material[] }).material;
    if (Array.isArray(mat)) {
      for (const m of mat) {
        if (!m.userData?.shared) m.dispose();
      }
    } else if (mat && !mat.userData?.shared) {
      mat.dispose();
    }
  });
}

export interface ZombieRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  hitFlashMaterials: THREE.MeshStandardMaterial[];
  stalkerMaterials?: THREE.MeshStandardMaterial[];
  auraRing?: THREE.Mesh | null;
  eliteRing?: THREE.Mesh;
  eliteRingMat?: THREE.MeshBasicMaterial;
  bossShieldSphere?: THREE.Mesh | null;
  bossShieldMat?: THREE.MeshBasicMaterial | null;
  bossCoreMat?: THREE.MeshStandardMaterial;
  bossAuraMat?: THREE.MeshBasicMaterial;
  telegraphRing: THREE.Mesh | null;
  telegraphLine: THREE.Mesh | null;
  hpBarGroup: THREE.Group;
  hpBarFill: THREE.Mesh;
}

export interface ProximityMineRig {
  root: THREE.Group;
  ledMat: THREE.MeshStandardMaterial;
  ringMesh: THREE.Mesh;
}

export interface DeployableTurretRig {
  root: THREE.Group;
  headGroup: THREE.Group;
  muzzlePoint: THREE.Object3D;
  muzzleFlash: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
}

export function buildContactShadow(
  shadowTex: THREE.CanvasTexture,
  radius: number,
  opacity = 0.55,
): THREE.Mesh {
  const rounded = Math.round(radius * 20) / 20;
  const geo = getSharedGeo(
    `shadow-plane-${rounded}`,
    () => new THREE.PlaneGeometry(rounded * 2.2, rounded * 2.2),
  );
  const mat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.015;
  return mesh;
}

export function buildPlayerRig(
  shadowTex: THREE.CanvasTexture,
  enableMuzzlePointLight: boolean,
): PlayerRig {
  const root = new THREE.Group();
  root.add(buildContactShadow(shadowTex, 0.65, 0.65));

  const footRingMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const footRing = new THREE.Mesh(
    new THREE.RingGeometry(0.54, 0.6, 28),
    footRingMat,
  );
  footRing.rotation.x = -Math.PI / 2;
  footRing.position.y = 0.025;
  root.add(footRing);

  // Slim circular diegetic reload (outer amber) & dash cooldown (inner cyan) arcs around survivor's feet
  const ARC_SEGMENTS = 24;
  const reloadArcSegments: THREE.Mesh[] = [];
  const dashArcSegments: THREE.Mesh[] = [];
  const dashArcMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const reloadArcMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const segSpan = (Math.PI * 2) / ARC_SEGMENTS;
  for (let i = 0; i < ARC_SEGMENTS; i++) {
    const startA = Math.PI / 2 - (i + 1) * segSpan + 0.018;
    const thetaLen = Math.max(0.05, segSpan - 0.036);
    const dashSeg = new THREE.Mesh(
      new THREE.RingGeometry(0.64, 0.7, 2, 1, startA, thetaLen),
      dashArcMat,
    );
    dashSeg.rotation.x = -Math.PI / 2;
    dashSeg.position.y = 0.027;
    dashSeg.visible = false;
    root.add(dashSeg);
    dashArcSegments.push(dashSeg);

    const relSeg = new THREE.Mesh(
      new THREE.RingGeometry(0.73, 0.81, 2, 1, startA, thetaLen),
      reloadArcMat,
    );
    relSeg.rotation.x = -Math.PI / 2;
    relSeg.position.y = 0.028;
    relSeg.visible = false;
    root.add(relSeg);
    reloadArcSegments.push(relSeg);
  }

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.52,
    metalness: 0.42,
  });
  const clothMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.85,
    metalness: 0.05,
  });
  const pouchMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.78,
    metalness: 0.15,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xd9a88a,
    roughness: 0.72,
    metalness: 0.02,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.65,
    roughness: 0.15,
    metalness: 0.7,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.55,
    roughness: 0.32,
    metalness: 0.65,
  });
  const gunMetalMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.26,
    metalness: 0.88,
  });
  const gunGripMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.82,
    metalness: 0.12,
  });

  // Legs + knee guards
  const legGeo = new THREE.BoxGeometry(0.22, 0.54, 0.24);
  const leftLeg = new THREE.Mesh(legGeo, clothMat);
  leftLeg.position.set(-0.15, 0.27, 0);
  leftLeg.castShadow = true;
  const kneeL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.08), armorMat);
  kneeL.position.set(0, 0.04, -0.11);
  leftLeg.add(kneeL);
  bodyGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, clothMat);
  rightLeg.position.set(0.15, 0.27, 0);
  rightLeg.castShadow = true;
  const kneeR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.08), armorMat);
  kneeR.position.set(0, 0.04, -0.11);
  rightLeg.add(kneeR);
  bodyGroup.add(rightLeg);

  // Tactical armored torso + chest pouches
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.58, 0.34), armorMat);
  torso.position.set(0, 0.82, 0);
  torso.castShadow = true;
  bodyGroup.add(torso);

  const chestRig = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.24, 0.08),
    pouchMat,
  );
  chestRig.position.set(0, 0.82, -0.19);
  bodyGroup.add(chestRig);

  // Tactical backpack + radio antenna + glowing status beacon
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.2), pouchMat);
  pack.position.set(0, 0.84, 0.24);
  pack.castShadow = true;
  bodyGroup.add(pack);

  const packBeacon = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.05, 0.04),
    visorMat,
  );
  packBeacon.position.set(0.08, 0.96, 0.35);
  bodyGroup.add(packBeacon);

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.016, 0.46, 6),
    gunGripMat,
  );
  antenna.position.set(-0.14, 1.24, 0.26);
  bodyGroup.add(antenna);

  // Diagonal tactical harness straps
  const strapGeo = new THREE.BoxGeometry(0.08, 0.62, 0.38);
  const strapL = new THREE.Mesh(strapGeo, gunGripMat);
  strapL.position.set(-0.15, 0.83, 0);
  const strapR = new THREE.Mesh(strapGeo, gunGripMat);
  strapR.position.set(0.15, 0.83, 0);
  bodyGroup.add(strapL, strapR);

  // Shoulder pads + accent trim strips
  const padGeo = new THREE.BoxGeometry(0.19, 0.17, 0.31);
  const leftPad = new THREE.Mesh(padGeo, armorMat);
  leftPad.position.set(-0.35, 1.0, 0);
  const rightPad = new THREE.Mesh(padGeo, armorMat);
  rightPad.position.set(0.35, 1.0, 0);
  const padTrimGeo = new THREE.BoxGeometry(0.21, 0.045, 0.33);
  const padTrimL = new THREE.Mesh(padTrimGeo, trimMat);
  padTrimL.position.set(-0.35, 1.08, 0);
  const padTrimR = new THREE.Mesh(padTrimGeo, trimMat);
  padTrimR.position.set(0.35, 1.08, 0);
  bodyGroup.add(leftPad, rightPad, padTrimL, padTrimR);

  // Head + tactical helmet + visor
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), skinMat);
  head.position.set(0, 1.28, 0);
  head.castShadow = true;
  bodyGroup.add(head);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62),
    armorMat,
  );
  helmet.position.set(0, 1.31, 0);
  helmet.castShadow = true;
  bodyGroup.add(helmet);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.085, 0.14), visorMat);
  visor.position.set(0, 1.28, -0.175);
  bodyGroup.add(visor);

  // Skin Cosmetic 1: Hazmat Breacher Bio-Pack Canisters
  const bioPackGroup = new THREE.Group();
  const bioTankMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x16a34a,
    emissiveIntensity: 1.5,
    roughness: 0.22,
  });
  const tankL = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.42, 10), bioTankMat);
  tankL.position.set(-0.11, 0.88, 0.33);
  const tankR = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.42, 10), bioTankMat);
  tankR.position.set(0.11, 0.88, 0.33);
  const bioBar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.09), visorMat);
  bioBar.position.set(0, 1.05, 0.34);
  bioPackGroup.add(tankL, tankR, bioBar);
  bioPackGroup.visible = false;
  bodyGroup.add(bioPackGroup);

  // Skin Cosmetic 2: Cyber Ronin Back Katana & Illuminated Cyber Ribs
  const katanaGroup = new THREE.Group();
  const scabbard = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.08, 1.15),
    new THREE.MeshStandardMaterial({ color: 0x090a0f, roughness: 0.3, metalness: 0.85 }),
  );
  scabbard.position.set(0.02, 0.92, 0.32);
  scabbard.rotation.set(0.55, 0, -0.68);
  const bladeHilt = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.1, 0.28),
    visorMat,
  );
  bladeHilt.position.set(0.28, 1.32, 0.28);
  bladeHilt.rotation.set(0.55, 0, -0.68);
  const cyberRibL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.05), visorMat);
  cyberRibL.position.set(-0.22, 0.84, -0.18);
  const cyberRibR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.05), visorMat);
  cyberRibR.position.set(0.22, 0.84, -0.18);
  katanaGroup.add(scabbard, bladeHilt, cyberRibL, cyberRibR);
  katanaGroup.visible = false;
  bodyGroup.add(katanaGroup);

  // Skin Cosmetic 3: Storm Phantom Hooded Cloak
  const hoodGroup = new THREE.Group();
  const hoodMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b4b,
    roughness: 0.78,
    metalness: 0.15,
  });
  const hoodDome = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.44, 8),
    hoodMat,
  );
  hoodDome.position.set(0, 1.44, 0.03);
  hoodDome.rotation.x = 0.18;
  const cloakBack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.56, 0.08), hoodMat);
  cloakBack.position.set(0, 0.86, 0.32);
  cloakBack.rotation.x = 0.14;
  const hoodEdge = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 8, 16), visorMat);
  hoodEdge.position.set(0, 1.28, -0.12);
  hoodGroup.add(hoodDome, cloakBack, hoodEdge);
  hoodGroup.visible = false;
  bodyGroup.add(hoodGroup);

  // Skin Cosmetic 4: Golden Sovereign Brushed Gold Exo-Suit Trim
  const exoTrimGroup = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.65,
    roughness: 0.22,
    metalness: 0.92,
  });
  const crownCrest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.34), goldMat);
  crownCrest.position.set(0, 1.54, 0);
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.12), goldMat);
  wingL.position.set(-0.26, 1.1, 0.26);
  wingL.rotation.z = 0.25;
  const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.12), goldMat);
  wingR.position.set(0.26, 1.1, 0.26);
  wingR.rotation.z = -0.25;
  exoTrimGroup.add(crownCrest, wingL, wingR);
  exoTrimGroup.visible = false;
  bodyGroup.add(exoTrimGroup);

  // Arms aiming forward (-Z)
  const armGeo = new THREE.BoxGeometry(0.15, 0.15, 0.44);
  const rightArm = new THREE.Mesh(armGeo, clothMat);
  rightArm.position.set(0.27, 0.9, -0.24);
  const leftArm = new THREE.Mesh(armGeo, clothMat);
  leftArm.position.set(-0.2, 0.86, -0.26);
  leftArm.rotation.y = -0.35;
  bodyGroup.add(rightArm, leftArm);

  // Weapon models mounted at right hand aiming along -Z
  const weaponAnchor = new THREE.Group();
  weaponAnchor.position.set(0.22, 0.9, -0.45);
  bodyGroup.add(weaponAnchor);

  const railGlowMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x06b6d4,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });
  const flameTipMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 1.8,
    roughness: 0.3,
  });
  const drumMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.35,
    metalness: 0.72,
  });

  // 1. Pistol (M9 Tactical)
  const pistolGroup = new THREE.Group();
  const pSlide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.32), gunMetalMat);
  pSlide.position.set(0, 0.03, -0.1);
  const pGrip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.13, 0.09), gunGripMat);
  pGrip.position.set(0, -0.05, 0.01);
  pGrip.rotation.x = 0.25;
  pistolGroup.add(pSlide, pGrip);
  weaponAnchor.add(pistolGroup);

  // 2. SMG (MP5K Submachine)
  const smgGroup = new THREE.Group();
  const smgBody = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.11, 0.34), gunGripMat);
  smgBody.position.set(0, 0.02, -0.12);
  const smgShroud = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.2), gunMetalMat);
  smgShroud.position.set(0, 0.04, -0.35);
  const smgMag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.06), gunGripMat);
  smgMag.position.set(0, -0.1, -0.18);
  smgMag.rotation.x = -0.3;
  smgGroup.add(smgBody, smgShroud, smgMag);
  smgGroup.visible = false;
  weaponAnchor.add(smgGroup);

  // 3. Shotgun (M870 Breacher)
  const shotgunGroup = new THREE.Group();
  const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.44), gunMetalMat);
  sBody.position.set(0, 0.02, -0.14);
  const sBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.036, 0.44, 8),
    gunMetalMat,
  );
  sBarrel.rotation.x = Math.PI / 2;
  sBarrel.position.set(0, 0.045, -0.49);
  const sPump = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.22), gunGripMat);
  sPump.position.set(0, -0.02, -0.44);
  const sStock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.24), gunGripMat);
  sStock.position.set(0, -0.01, 0.18);
  shotgunGroup.add(sBody, sBarrel, sPump, sStock);
  shotgunGroup.visible = false;
  weaponAnchor.add(shotgunGroup);

  // 4. Assault Rifle (MK18 Carbine)
  const rifleGroup = new THREE.Group();
  const rBody = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.48), gunMetalMat);
  rBody.position.set(0, 0.02, -0.15);
  const rBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.36, 8),
    gunMetalMat,
  );
  rBarrel.rotation.x = Math.PI / 2;
  rBarrel.position.set(0, 0.04, -0.52);
  const rMag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.19, 0.08), gunGripMat);
  rMag.position.set(0, -0.09, -0.18);
  rMag.rotation.x = -0.2;
  const rStock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.22), gunGripMat);
  rStock.position.set(0, 0.01, 0.18);
  const rOptic = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.12), gunGripMat);
  rOptic.position.set(0, 0.1, -0.14);
  rifleGroup.add(rBody, rBarrel, rMag, rStock, rOptic);
  rifleGroup.visible = false;
  weaponAnchor.add(rifleGroup);

  // 5. Revolver (Python .357)
  const revolverGroup = new THREE.Group();
  const revFrame = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.1, 0.24), gunMetalMat);
  revFrame.position.set(0, 0.02, -0.06);
  const revBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.32), gunMetalMat);
  revBarrel.position.set(0, 0.045, -0.28);
  const revCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.11, 8), drumMat);
  revCyl.rotation.x = Math.PI / 2;
  revCyl.position.set(0, 0.03, -0.08);
  const revGrip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.09), flameTipMat);
  revGrip.position.set(0, -0.05, 0.04);
  revGrip.rotation.x = 0.3;
  revolverGroup.add(revFrame, revBarrel, revCyl, revGrip);
  revolverGroup.visible = false;
  weaponAnchor.add(revolverGroup);

  // 6. Auto Shotgun (AA-12 Striker with drum magazine)
  const autoshotgunGroup = new THREE.Group();
  const aaBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.56), gunGripMat);
  aaBody.position.set(0, 0.02, -0.12);
  const aaBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.34, 8), gunMetalMat);
  aaBarrel.rotation.x = Math.PI / 2;
  aaBarrel.position.set(0, 0.04, -0.5);
  const aaDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.12, 12), drumMat);
  aaDrum.rotation.x = Math.PI / 2;
  aaDrum.position.set(0, -0.1, -0.16);
  autoshotgunGroup.add(aaBody, aaBarrel, aaDrum);
  autoshotgunGroup.visible = false;
  weaponAnchor.add(autoshotgunGroup);

  // 7. Precision DMR (MK14 Marksman)
  const dmrGroup = new THREE.Group();
  const dmrBody = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.58), gunGripMat);
  dmrBody.position.set(0, 0.02, -0.12);
  const dmrBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.5, 8), gunMetalMat);
  dmrBarrel.rotation.x = Math.PI / 2;
  dmrBarrel.position.set(0, 0.045, -0.62);
  const dmrScope = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.24, 8), gunMetalMat);
  dmrScope.rotation.x = Math.PI / 2;
  dmrScope.position.set(0, 0.11, -0.14);
  dmrGroup.add(dmrBody, dmrBarrel, dmrScope);
  dmrGroup.visible = false;
  weaponAnchor.add(dmrGroup);

  // 8. Heavy LMG (M249 Saw with ammo box)
  const lmgGroup = new THREE.Group();
  const lmgBody = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.14, 0.54), gunMetalMat);
  lmgBody.position.set(0, 0.02, -0.14);
  const lmgBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.46, 8), gunMetalMat);
  lmgBarrel.rotation.x = Math.PI / 2;
  lmgBarrel.position.set(0, 0.04, -0.58);
  const lmgBox = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.22), drumMat);
  lmgBox.position.set(-0.08, -0.09, -0.16);
  const lmgStock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.24), gunGripMat);
  lmgStock.position.set(0, 0.01, 0.2);
  lmgGroup.add(lmgBody, lmgBarrel, lmgBox, lmgStock);
  lmgGroup.visible = false;
  weaponAnchor.add(lmgGroup);

  // 9. Twin Glocks (Akimbo left & right hand pistols)
  const dualGroup = new THREE.Group();
  const dRight = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.085, 0.3), gunMetalMat);
  dRight.position.set(0, 0.03, -0.1);
  const dLeft = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.085, 0.3), gunMetalMat);
  dLeft.position.set(-0.44, 0.01, -0.08);
  dualGroup.add(dRight, dLeft);
  dualGroup.visible = false;
  weaponAnchor.add(dualGroup);

  // 10. Anti-Materiel Sniper (Barrett M82)
  const sniperGroup = new THREE.Group();
  const snBody = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.64), gunGripMat);
  snBody.position.set(0, 0.02, -0.1);
  const snBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.68, 8), gunMetalMat);
  snBarrel.rotation.x = Math.PI / 2;
  snBarrel.position.set(0, 0.045, -0.72);
  const snBrake = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.11), gunMetalMat);
  snBrake.position.set(0, 0.045, -1.06);
  const snScope = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.042, 0.32, 8), drumMat);
  snScope.rotation.x = Math.PI / 2;
  snScope.position.set(0, 0.125, -0.14);
  sniperGroup.add(snBody, snBarrel, snBrake, snScope);
  sniperGroup.visible = false;
  weaponAnchor.add(sniperGroup);

  // 11. Flamethrower (M2 Incinerator with twin canisters & igniter nozzle)
  const flameGroup = new THREE.Group();
  const flBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.46), gunMetalMat);
  flBody.position.set(0, 0.02, -0.14);
  const flTank = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.28, 10), flameTipMat);
  flTank.rotation.x = Math.PI / 2;
  flTank.position.set(0.06, -0.07, -0.2);
  const flNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.34, 8), flameTipMat);
  flNozzle.rotation.x = Math.PI / 2;
  flNozzle.position.set(0, 0.03, -0.5);
  flameGroup.add(flBody, flTank, flNozzle);
  flameGroup.visible = false;
  weaponAnchor.add(flameGroup);

  // 12. XR-9 Railgun (Twin-rail coil cannon with cyan plasma core)
  const railGroup = new THREE.Group();
  const rlBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.15, 0.56), gunGripMat);
  rlBody.position.set(0, 0.02, -0.14);
  const rlTop = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.58), gunMetalMat);
  rlTop.position.set(0, 0.09, -0.42);
  const rlBot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.58), gunMetalMat);
  rlBot.position.set(0, -0.02, -0.42);
  const rlCore = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.05, 0.54), railGlowMat);
  rlCore.position.set(0, 0.035, -0.42);
  railGroup.add(rlBody, rlTop, rlBot, rlCore);
  railGroup.visible = false;
  weaponAnchor.add(railGroup);

  // 13. Twin-9 Akimbo (Sleek cyan-trimmed dual SMGs)
  const twin9Group = new THREE.Group();
  const tw9Mat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 1.4,
    roughness: 0.25,
  });
  for (const xOff of [0, -0.44]) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.095, 0.34), gunGripMat);
    body.position.set(xOff, 0.025, -0.12);
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.32), tw9Mat);
    slide.position.set(xOff, 0.065, -0.14);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.06), gunMetalMat);
    mag.position.set(xOff, -0.08, -0.14);
    twin9Group.add(body, slide, mag);
  }
  twin9Group.visible = false;
  weaponAnchor.add(twin9Group);

  // 14. Cryo-Carbine (Frosted cyan cryo coils & chill canister)
  const cryoGroup = new THREE.Group();
  const cryoMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.9,
    roughness: 0.2,
  });
  const crBody = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.12, 0.5), gunMetalMat);
  crBody.position.set(0, 0.02, -0.15);
  const crBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.38, 8), cryoMat);
  crBarrel.rotation.x = Math.PI / 2;
  crBarrel.position.set(0, 0.04, -0.52);
  const crTank = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.24, 10), cryoMat);
  crTank.rotation.x = Math.PI / 2;
  crTank.position.set(0, -0.065, -0.2);
  cryoGroup.add(crBody, crBarrel, crTank);
  cryoGroup.visible = false;
  weaponAnchor.add(cryoGroup);

  // 15. Pulse Katana (Glowing violet-plasma blade)
  const katanaWeaponGroup = new THREE.Group();
  const bladeEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xd8b4fe,
    emissive: 0xa855f7,
    emissiveIntensity: 2.3,
    roughness: 0.18,
    metalness: 0.85,
  });
  const ktHilt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.28, 8), gunGripMat);
  ktHilt.rotation.x = Math.PI / 2;
  ktHilt.position.set(0, 0.02, 0.04);
  const ktGuard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.04), drumMat);
  ktGuard.position.set(0, 0.02, -0.1);
  const ktBlade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 1.05), bladeEdgeMat);
  ktBlade.position.set(0, 0.03, -0.62);
  katanaWeaponGroup.add(ktHilt, ktGuard, ktBlade);
  katanaWeaponGroup.visible = false;
  weaponAnchor.add(katanaWeaponGroup);

  // 16. Vulcan Minigun (Multi-barrel rotary Gatling assembly)
  const vulcanGroup = new THREE.Group();
  const vHousing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.44), gunGripMat);
  vHousing.position.set(0, 0.02, -0.14);
  const vClamp = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 10), flameTipMat);
  vClamp.rotation.x = Math.PI / 2;
  vClamp.position.set(0, 0.02, -0.64);
  const vDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 12), drumMat);
  vDrum.position.set(-0.08, -0.11, -0.16);
  vulcanGroup.add(vHousing, vClamp, vDrum);
  for (let b = 0; b < 4; b++) {
    const ang = (b / 4) * Math.PI * 2;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.62, 6), gunMetalMat);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(Math.cos(ang) * 0.06, 0.02 + Math.sin(ang) * 0.06, -0.58);
    vulcanGroup.add(bar);
  }
  vulcanGroup.visible = false;
  weaponAnchor.add(vulcanGroup);

  // 17. Gauss Rail-Carbine (Indigo magnetic accelerator frame)
  const gaussGroup = new THREE.Group();
  const gaussMat = new THREE.MeshStandardMaterial({
    color: 0x818cf8,
    emissive: 0x6366f1,
    emissiveIntensity: 2.1,
    roughness: 0.2,
  });
  const gBody = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.52), gunGripMat);
  gBody.position.set(0, 0.02, -0.14);
  const gCore = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.065, 0.56), gaussMat);
  gCore.position.set(0, 0.04, -0.45);
  const gCoils = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.08), gunMetalMat);
  gCoils.position.set(0, 0.04, -0.56);
  gaussGroup.add(gBody, gCore, gCoils);
  gaussGroup.visible = false;
  weaponAnchor.add(gaussGroup);

  // 18. MML-4 Micro-Launcher (Quad-tube missile pod)
  const launcherGroup = new THREE.Group();
  const mlPod = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.56), drumMat);
  mlPod.position.set(0, 0.05, -0.2);
  const mlTrim = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.12), flameTipMat);
  mlTrim.position.set(0, 0.05, -0.44);
  const mlGrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.1), gunGripMat);
  mlGrip.position.set(0, -0.09, -0.14);
  launcherGroup.add(mlPod, mlTrim, mlGrip);
  launcherGroup.visible = false;
  weaponAnchor.add(launcherGroup);

  // 19. Chem-Thrower (Toxic lime pressurized nozzle & canisters)
  const chemGroup = new THREE.Group();
  const chemMat = new THREE.MeshStandardMaterial({
    color: 0x84cc16,
    emissive: 0x65a30d,
    emissiveIntensity: 1.9,
    roughness: 0.25,
  });
  const chBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.46), gunMetalMat);
  chBody.position.set(0, 0.02, -0.14);
  const chTank = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 10), chemMat);
  chTank.rotation.x = Math.PI / 2;
  chTank.position.set(0.07, -0.07, -0.2);
  const chNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.06, 0.34, 8), chemMat);
  chNozzle.rotation.x = Math.PI / 2;
  chNozzle.position.set(0, 0.03, -0.5);
  chemGroup.add(chBody, chTank, chNozzle);
  chemGroup.visible = false;
  weaponAnchor.add(chemGroup);

  // Weapon-mounted Tactical Flashlight (SpotLight + subtle beam cone)
  const flashlightSpot = new THREE.SpotLight(
    0xe0f2fe,
    24,
    22,
    Math.PI / 5.5,
    0.58,
    1.5,
  );
  flashlightSpot.position.set(0.22, 0.96, -0.85);
  const flashTarget = new THREE.Object3D();
  flashTarget.position.set(0.22, 0.2, -12);
  bodyGroup.add(flashTarget);
  flashlightSpot.target = flashTarget;
  bodyGroup.add(flashlightSpot);

  const coneLen = 7.5;
  const coneGeo = new THREE.CylinderGeometry(0.14, 2.2, coneLen, 18, 1, true);
  coneGeo.translate(0, -coneLen / 2, 0);
  coneGeo.rotateX(Math.PI / 2);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.065,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const flashlightCone = new THREE.Mesh(coneGeo, coneMat);
  flashlightCone.position.set(0.22, 0.92, -0.95);
  bodyGroup.add(flashlightCone);

  // Muzzle point & multi-petal starburst flash
  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0.22, 0.94, -1.05);
  bodyGroup.add(muzzlePoint);

  const muzzleFlash = new THREE.Group();
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffe082,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const flashCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), flashMat);
  flashCore.scale.set(0.85, 0.85, 2.1);
  const flashCross = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.09, 0.14), flashMat);
  const flashCrossV = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.46, 0.14), flashMat);
  muzzleFlash.add(flashCore, flashCross, flashCrossV);
  muzzleFlash.position.copy(muzzlePoint.position);
  muzzleFlash.visible = false;
  bodyGroup.add(muzzleFlash);

  let flashLight: THREE.PointLight | null = null;
  if (enableMuzzlePointLight) {
    flashLight = new THREE.PointLight(0xffb74d, 0, 8, 2);
    flashLight.position.set(0.22, 1.0, -1.15);
    bodyGroup.add(flashLight);
  }

  return {
    root,
    bodyGroup,
    leftLeg,
    rightLeg,
    weaponModels: {
      pistol: pistolGroup,
      smg: smgGroup,
      shotgun: shotgunGroup,
      rifle: rifleGroup,
      revolver: revolverGroup,
      autoshotgun: autoshotgunGroup,
      dmr: dmrGroup,
      lmg: lmgGroup,
      dual: dualGroup,
      sniper: sniperGroup,
      flamethrower: flameGroup,
      railgun: railGroup,
      twin9: twin9Group,
      cryo_carbine: cryoGroup,
      pulse_katana: katanaWeaponGroup,
      vulcan_minigun: vulcanGroup,
      gauss_carbine: gaussGroup,
      micro_launcher: launcherGroup,
      chem_thrower: chemGroup,
    },
    muzzlePoint,
    muzzleFlash,
    flashLight,
    flashlightSpot,
    flashlightCone,
    armorMat,
    clothMat,
    pouchMat,
    visorMat,
    trimMat,
    footRingMat,
    coneMat,
    bioPackGroup,
    katanaGroup,
    hoodGroup,
    exoTrimGroup,
    reloadArcSegments,
    dashArcSegments,
  };
}

export function applyPlayerSkin(rig: PlayerRig, skinId: SkinId): void {
  const spec = SKIN_SPECS[skinId] ?? SKIN_SPECS.nightwatch;
  rig.armorMat.color.setHex(spec.armorColor);
  rig.clothMat.color.setHex(spec.clothColor);
  rig.pouchMat.color.setHex(spec.pouchColor);
  rig.visorMat.color.setHex(spec.visorColor);
  rig.visorMat.emissive.setHex(spec.visorColor);
  rig.visorMat.emissiveIntensity = spec.emissiveIntensity;
  rig.trimMat.color.setHex(spec.trimColor);
  rig.trimMat.emissive.setHex(spec.trimColor);
  rig.footRingMat.color.setHex(spec.trailColor);
  rig.flashlightSpot.color.setHex(spec.beamColor);
  rig.coneMat.color.setHex(spec.coneColor);

  rig.bioPackGroup.visible = Boolean(spec.hasBioPack);
  rig.katanaGroup.visible = Boolean(spec.hasKatana);
  rig.hoodGroup.visible = Boolean(spec.hasHood);
  rig.exoTrimGroup.visible = Boolean(spec.hasExoTrim);
}

export function updateDiegeticFootArcs(
  rig: PlayerRig,
  isReloading: boolean,
  reloadProgress: number,
  dashCooldownProgress: number,
): void {
  const relCount = rig.reloadArcSegments.length;
  const activeRelSegs = isReloading
    ? Math.max(1, Math.round(Math.min(1, Math.max(0, reloadProgress)) * relCount))
    : 0;
  for (let i = 0; i < relCount; i++) {
    rig.reloadArcSegments[i].visible = isReloading && i < activeRelSegs;
  }

  const dashCount = rig.dashArcSegments.length;
  const rechargingDash = dashCooldownProgress < 0.999;
  const activeDashSegs = rechargingDash
    ? Math.max(1, Math.round(Math.min(1, Math.max(0, dashCooldownProgress)) * dashCount))
    : 0;
  for (let i = 0; i < dashCount; i++) {
    rig.dashArcSegments[i].visible = rechargingDash && i < activeDashSegs;
  }
}

export function buildZombieRig(
  kind: ZombieKind,
  shadowTex: THREE.CanvasTexture,
): ZombieRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const hitFlashMaterials: THREE.MeshStandardMaterial[] = [];
  const stalkerMaterials: THREE.MeshStandardMaterial[] = [];

  const scale =
    kind === 'boss'
      ? 1.95
      : kind === 'juggernaut' || kind === 'matriarch'
        ? 1.56
        : kind === 'brute'
          ? 1.48
          : kind === 'breacher' || kind === 'siege_breaker'
            ? 1.32
            : kind === 'ravager'
              ? 1.24
              : kind === 'bomber' || kind === 'necromancer'
                ? 1.1
                : kind === 'spitter' || kind === 'howler'
                  ? 1.04
                  : kind === 'stalker'
                    ? 0.96
                    : kind === 'runner'
                      ? 0.94
                      : kind === 'crawler'
                        ? 0.68
                        : 1.0;
  root.add(buildContactShadow(shadowTex, 0.54 * scale, 0.62));

  const skinColor =
    kind === 'boss'
      ? 0x3b1d2e
      : kind === 'runner'
        ? 0xb91c1c
        : kind === 'brute'
          ? 0x4b5563
          : kind === 'spitter'
            ? 0x4d7c0f
            : kind === 'bomber'
              ? 0x431407
              : kind === 'howler'
                ? 0x713f12
                : kind === 'stalker'
                  ? 0x1e1b4b
                  : kind === 'breacher'
                    ? 0x475569
                    : kind === 'juggernaut'
                      ? 0x78350f
                      : kind === 'siege_breaker'
                        ? 0x7f1d1d
                        : kind === 'necromancer'
                          ? 0x3b0764
                          : kind === 'matriarch'
                            ? 0x064e3b
                            : kind === 'crawler'
                              ? 0x059669
                              : kind === 'ravager'
                                ? 0x881337
                                : 0x6b7f5e;
  const clothesColor =
    kind === 'boss'
      ? 0x18181b
      : kind === 'runner'
        ? 0x450a0a
        : kind === 'brute'
          ? 0x1f2937
          : kind === 'spitter'
            ? 0x1a2e05
            : kind === 'bomber'
              ? 0x27272a
              : kind === 'howler'
                ? 0x422006
                : kind === 'stalker'
                  ? 0x09090f
                  : kind === 'breacher'
                    ? 0x0f172a
                    : kind === 'juggernaut'
                      ? 0x292524
                      : kind === 'siege_breaker'
                        ? 0x1c1917
                        : kind === 'necromancer'
                          ? 0x1e1b4b
                          : kind === 'matriarch'
                            ? 0x022c22
                            : kind === 'crawler'
                              ? 0x065f46
                              : kind === 'ravager'
                                ? 0x18181b
                                : 0x2f3b33;
  const eyeColor =
    kind === 'boss' || kind === 'ravager'
      ? 0xf43f5e
      : kind === 'runner'
        ? 0xff2e2e
        : kind === 'brute' || kind === 'juggernaut'
          ? 0xf59e0b
          : kind === 'spitter'
            ? 0xa3e635
            : kind === 'bomber'
              ? 0xf97316
              : kind === 'howler'
                ? 0xfbbf24
                : kind === 'stalker' || kind === 'necromancer'
                  ? 0xc084fc
                  : kind === 'breacher'
                    ? 0x38bdf8
                    : kind === 'siege_breaker'
                      ? 0xef4444
                      : kind === 'matriarch' || kind === 'crawler'
                        ? 0x34d399
                        : 0xd9f99d;

  const isStalker = kind === 'stalker';
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: isStalker ? 0.45 : 0.72,
    metalness: kind === 'boss' ? 0.18 : 0.04,
    transparent: isStalker,
    opacity: isStalker ? 0.16 : 1,
  });
  const clothMat = new THREE.MeshStandardMaterial({
    color: clothesColor,
    roughness: 0.85,
    metalness:
      kind === 'boss' ||
      kind === 'breacher' ||
      kind === 'juggernaut' ||
      kind === 'siege_breaker'
        ? 0.45
        : 0.05,
    transparent: isStalker,
    opacity: isStalker ? 0.16 : 1,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: eyeColor,
    emissive: eyeColor,
    emissiveIntensity: kind === 'boss' ? 2.6 : kind === 'stalker' ? 1.8 : 2.1,
    roughness: 0.2,
    transparent: isStalker,
    opacity: isStalker ? 0.45 : 1,
  });
  hitFlashMaterials.push(skinMat, clothMat);
  if (isStalker) {
    stalkerMaterials.push(skinMat, clothMat, eyeMat);
  }

  // Legs (shared cached geometry per kind)
  const legGeo = getSharedGeo(
    `z-leg-${kind}`,
    () => new THREE.BoxGeometry(0.2 * scale, 0.5 * scale, 0.22 * scale),
  );
  const legL = new THREE.Mesh(legGeo, clothMat);
  legL.position.set(-0.14 * scale, 0.25 * scale, 0);
  const legR = new THREE.Mesh(legGeo, clothMat);
  legR.position.set(0.14 * scale, 0.25 * scale, 0);
  bodyGroup.add(legL, legR);

  // Torso
  const torsoW =
    kind === 'boss'
      ? 0.78 * scale
      : kind === 'brute' ||
          kind === 'breacher' ||
          kind === 'juggernaut' ||
          kind === 'matriarch'
        ? 0.66 * scale
        : 0.48 * scale;
  const torsoGeo = getSharedGeo(
    `z-torso-${kind}`,
    () => new THREE.BoxGeometry(torsoW, 0.56 * scale, 0.36 * scale),
  );
  const torso = new THREE.Mesh(torsoGeo, clothMat);
  torso.position.set(0, 0.78 * scale, 0);
  if (kind === 'runner' || kind === 'spitter' || kind === 'stalker') {
    torso.rotation.x = kind === 'spitter' ? 0.28 : 0.22;
  }
  torso.castShadow = !isStalker;
  bodyGroup.add(torso);

  if (kind === 'runner') {
    const spineGeo = getSharedGeo(
      'z-runner-spine',
      () => new THREE.BoxGeometry(0.08, 0.09, 0.08),
    );
    for (let s = 0; s < 3; s++) {
      const node = new THREE.Mesh(spineGeo, eyeMat);
      node.position.set(0, (0.64 + s * 0.14) * scale, 0.18 * scale);
      bodyGroup.add(node);
    }
  }

  // Acid Spitter: glowing bloated venom sacs & dripping mandible
  if (kind === 'spitter') {
    const acidMat = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      emissive: 0x65a30d,
      emissiveIntensity: 1.75,
      roughness: 0.25,
    });
    hitFlashMaterials.push(acidMat);
    const sacMainGeo = getSharedGeo(
      'z-spitter-sac-main',
      () => new THREE.SphereGeometry(0.24, 10, 8),
    );
    const sacSmallGeo = getSharedGeo(
      'z-spitter-sac-small',
      () => new THREE.SphereGeometry(0.14, 8, 6),
    );
    const bellySac = new THREE.Mesh(sacMainGeo, acidMat);
    bellySac.scale.set(1.1, 1.15, 0.9);
    bellySac.position.set(0, 0.78, -0.18);
    const shoulderSacL = new THREE.Mesh(sacSmallGeo, acidMat);
    shoulderSacL.position.set(-0.24, 1.08, 0.04);
    const shoulderSacR = new THREE.Mesh(sacSmallGeo, acidMat);
    shoulderSacR.position.set(0.24, 1.1, 0.06);
    const jawSac = new THREE.Mesh(sacSmallGeo, acidMat);
    jawSac.scale.set(0.85, 0.65, 0.85);
    jawSac.position.set(0, 1.14, -0.18);
    bodyGroup.add(bellySac, shoulderSacL, shoulderSacR, jawSac);
  }

  let auraRing: THREE.Mesh | null = null;

  // Volatile Bomber: glowing volatile orange tanks & pressurized pustules
  if (kind === 'bomber') {
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 2.35,
      roughness: 0.25,
    });
    hitFlashMaterials.push(emberMat);
    const bellyBomb = new THREE.Mesh(
      getSharedGeo('z-bomber-core', () => new THREE.SphereGeometry(0.32, 12, 10)),
      emberMat,
    );
    bellyBomb.position.set(0, 0.86, -0.16);
    const tankBack = new THREE.Mesh(
      getSharedGeo('z-bomber-tank', () => new THREE.CylinderGeometry(0.18, 0.2, 0.56, 10)),
      emberMat,
    );
    tankBack.position.set(0, 0.92, 0.22);
    bodyGroup.add(bellyBomb, tankBack);

    const warnRing = new THREE.Mesh(
      getSharedGeo('z-bomber-ring', () => new THREE.RingGeometry(0.62, 0.72, 24)),
      new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    warnRing.rotation.x = -Math.PI / 2;
    warnRing.position.y = 0.03;
    root.add(warnRing);
    auraRing = warnRing;
  }

  // Howler: acoustic horn crests & pulsing amber buff aura ring
  if (kind === 'howler') {
    const howlMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 2.1,
      roughness: 0.25,
    });
    hitFlashMaterials.push(howlMat);
    const hornGeo = getSharedGeo(
      'z-howler-crest',
      () => new THREE.ConeGeometry(0.09, 0.42, 6),
    );
    const crestL = new THREE.Mesh(hornGeo, howlMat);
    crestL.position.set(-0.22, 1.44, 0.02);
    crestL.rotation.z = 0.45;
    const crestR = new THREE.Mesh(hornGeo, howlMat);
    crestR.position.set(0.22, 1.44, 0.02);
    crestR.rotation.z = -0.45;
    const throatGlow = new THREE.Mesh(
      getSharedGeo('z-howler-throat', () => new THREE.SphereGeometry(0.17, 10, 8)),
      howlMat,
    );
    throatGlow.position.set(0, 1.06, -0.18);
    bodyGroup.add(crestL, crestR, throatGlow);

    const buffRing = new THREE.Mesh(
      getSharedGeo('z-howler-ring', () => new THREE.RingGeometry(1.15, 1.32, 32)),
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    buffRing.rotation.x = -Math.PI / 2;
    buffRing.position.y = 0.03;
    root.add(buffRing);
    auraRing = buffRing;
  }

  // Shadow Stalker: ragged cloak shoulders & long razor claws
  if (kind === 'stalker') {
    const mantleGeo = getSharedGeo(
      'z-stalker-mantle',
      () => new THREE.ConeGeometry(0.38, 0.42, 6),
    );
    const mantle = new THREE.Mesh(mantleGeo, clothMat);
    mantle.position.set(0, 0.98, 0.06);
    const clawGeo = getSharedGeo(
      'z-stalker-claw',
      () => new THREE.ConeGeometry(0.04, 0.34, 5),
    );
    const clawL = new THREE.Mesh(clawGeo, eyeMat);
    clawL.rotation.x = -Math.PI / 2;
    clawL.position.set(-0.28, 0.85, -0.62);
    const clawR = new THREE.Mesh(clawGeo, eyeMat);
    clawR.rotation.x = -Math.PI / 2;
    clawR.position.set(0.28, 0.85, -0.62);
    bodyGroup.add(mantle, clawL, clawR);
  }

  // Riot Breacher: heavy riot armor helmet, steel shoulder pads & frontal riot shield
  if (kind === 'breacher') {
    const shieldBodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.34,
      metalness: 0.78,
    });
    const shieldTrimMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.28,
      metalness: 0.88,
    });
    const cautionMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.55,
      roughness: 0.35,
    });
    hitFlashMaterials.push(shieldBodyMat, shieldTrimMat);

    const helmGeo = getSharedGeo(
      'z-breacher-helm',
      () => new THREE.BoxGeometry(0.62, 0.46, 0.62),
    );
    const helm = new THREE.Mesh(helmGeo, shieldTrimMat);
    helm.position.set(0, 1.62, 0);
    helm.castShadow = true;

    const chestArmorGeo = getSharedGeo(
      'z-breacher-chest',
      () => new THREE.BoxGeometry(0.92, 0.74, 0.52),
    );
    const chestArmor = new THREE.Mesh(chestArmorGeo, shieldBodyMat);
    chestArmor.position.set(0, 1.05, 0);
    chestArmor.castShadow = true;

    // Prominent frontal ballistic riot shield
    const shieldGeo = getSharedGeo(
      'z-breacher-shield',
      () => new THREE.BoxGeometry(1.18, 1.38, 0.14),
    );
    const shield = new THREE.Mesh(shieldGeo, shieldBodyMat);
    shield.position.set(0, 0.96, -0.64);
    shield.castShadow = true;

    const rimGeo = getSharedGeo(
      'z-breacher-shield-rim',
      () => new THREE.BoxGeometry(1.24, 0.12, 0.17),
    );
    const rimTop = new THREE.Mesh(rimGeo, shieldTrimMat);
    rimTop.position.set(0, 1.61, -0.64);
    const rimBot = new THREE.Mesh(rimGeo, shieldTrimMat);
    rimBot.position.set(0, 0.32, -0.64);

    const slitGeo = getSharedGeo(
      'z-breacher-slit',
      () => new THREE.BoxGeometry(0.58, 0.12, 0.17),
    );
    const viewportSlit = new THREE.Mesh(slitGeo, eyeMat);
    viewportSlit.position.set(0, 1.32, -0.64);

    const stripeGeo = getSharedGeo(
      'z-breacher-stripe',
      () => new THREE.BoxGeometry(0.96, 0.12, 0.16),
    );
    const stripe = new THREE.Mesh(stripeGeo, cautionMat);
    stripe.position.set(0, 0.74, -0.65);

    bodyGroup.add(helm, chestArmor, shield, rimTop, rimBot, viewportSlit, stripe);
  }

  // Brute armor shoulder pauldrons & concrete/rebar maul
  if (kind === 'brute') {
    const armorPlateMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.38,
      metalness: 0.68,
    });
    const rebarMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.45,
      metalness: 0.8,
    });
    hitFlashMaterials.push(armorPlateMat);

    const pauldronGeo = getSharedGeo(
      'z-brute-pauldron',
      () => new THREE.BoxGeometry(0.34, 0.3, 0.46),
    );
    const pL = new THREE.Mesh(pauldronGeo, armorPlateMat);
    pL.position.set(-0.56, 1.38, 0);
    const pR = new THREE.Mesh(pauldronGeo, armorPlateMat);
    pR.position.set(0.56, 1.38, 0);
    const chestPlateGeo = getSharedGeo(
      'z-brute-chest',
      () => new THREE.BoxGeometry(0.74, 0.44, 0.46),
    );
    const chestPlate = new THREE.Mesh(chestPlateGeo, armorPlateMat);
    chestPlate.position.set(0, 1.18, -0.05);
    bodyGroup.add(pL, pR, chestPlate);

    const rebarGeo = getSharedGeo(
      'z-brute-rebar',
      () => new THREE.CylinderGeometry(0.045, 0.045, 1.15, 8),
    );
    const rebarShaft = new THREE.Mesh(rebarGeo, rebarMat);
    rebarShaft.rotation.x = Math.PI / 2;
    rebarShaft.position.set(0.45, 1.15, -0.78);
    const clubHeadGeo = getSharedGeo(
      'z-brute-club',
      () => new THREE.BoxGeometry(0.28, 0.28, 0.38),
    );
    const concreteHead = new THREE.Mesh(clubHeadGeo, rebarMat);
    concreteHead.position.set(0.45, 1.15, -1.25);
    bodyGroup.add(rebarShaft, concreteHead);
  }

  let bossCoreMat: THREE.MeshStandardMaterial | undefined;
  let bossAuraMat: THREE.MeshBasicMaterial | undefined;

  // Boss Iron Warden Dread Armor, Furnace Core, Spiked Pauldrons & Siege Gauntlets
  if (kind === 'boss') {
    const bossArmorMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.28,
      metalness: 0.82,
    });
    const bossTrimMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.32,
      metalness: 0.68,
    });
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 2.5,
      roughness: 0.2,
    });
    bossCoreMat = coreMat;
    hitFlashMaterials.push(bossArmorMat, bossTrimMat);

    const breastplate = new THREE.Mesh(
      getSharedGeo('z-boss-plate', () => new THREE.BoxGeometry(1.42, 0.86, 0.78)),
      bossArmorMat,
    );
    breastplate.position.set(0, 1.56, -0.04);
    breastplate.castShadow = true;
    const chestCore = new THREE.Mesh(
      getSharedGeo('z-boss-core', () => new THREE.OctahedronGeometry(0.24, 0)),
      coreMat,
    );
    chestCore.position.set(0, 1.58, -0.44);
    bodyGroup.add(breastplate, chestCore);

    const spikeGeo = getSharedGeo(
      'z-boss-spike',
      () => new THREE.ConeGeometry(0.11, 0.44, 6),
    );
    const pauldronGeo = getSharedGeo(
      'z-boss-pauldron',
      () => new THREE.BoxGeometry(0.54, 0.42, 0.68),
    );
    const trimGeo = getSharedGeo(
      'z-boss-trim',
      () => new THREE.BoxGeometry(0.58, 0.1, 0.72),
    );
    for (const side of [-1, 1]) {
      const pauldron = new THREE.Mesh(pauldronGeo, bossArmorMat);
      pauldron.position.set(side * 0.92, 1.92, 0);
      pauldron.rotation.z = -side * 0.16;
      const trim = new THREE.Mesh(trimGeo, bossTrimMat);
      trim.position.set(side * 0.92, 1.78, 0);
      const spikeA = new THREE.Mesh(spikeGeo, bossTrimMat);
      spikeA.position.set(side * 0.88, 2.3, -0.14);
      spikeA.rotation.z = -side * 0.25;
      const spikeB = new THREE.Mesh(spikeGeo, bossTrimMat);
      spikeB.position.set(side * 0.98, 2.26, 0.16);
      spikeB.rotation.z = -side * 0.35;
      bodyGroup.add(pauldron, trim, spikeA, spikeB);
    }

    const ventGeo = getSharedGeo(
      'z-boss-vent',
      () => new THREE.BoxGeometry(0.18, 0.24, 0.18),
    );
    for (let k = 0; k < 3; k++) {
      const vent = new THREE.Mesh(ventGeo, coreMat);
      vent.position.set(0, 1.25 + k * 0.32, 0.42);
      bodyGroup.add(vent);
    }

    const hornGeo = getSharedGeo(
      'z-boss-horn',
      () => new THREE.ConeGeometry(0.09, 0.46, 6),
    );
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(hornGeo, bossTrimMat);
      horn.position.set(side * 0.26, 2.68, -0.05);
      horn.rotation.z = -side * 0.55;
      horn.rotation.x = -0.25;
      bodyGroup.add(horn);
    }

    const gauntletGeo = getSharedGeo(
      'z-boss-gauntlet',
      () => new THREE.BoxGeometry(0.38, 0.38, 0.62),
    );
    const gL = new THREE.Mesh(gauntletGeo, bossArmorMat);
    gL.position.set(-0.62, 1.56, -0.88);
    const gR = new THREE.Mesh(gauntletGeo, bossArmorMat);
    gR.position.set(0.62, 1.56, -0.88);
    bodyGroup.add(gL, gR);

    const bAuraMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    bossAuraMat = bAuraMat;
    const aura = new THREE.Mesh(
      getSharedGeo('z-boss-aura', () => new THREE.RingGeometry(1.12, 1.28, 36)),
      bAuraMat,
    );
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.03;
    root.add(aura);
    auraRing = aura;
  }

  // Juggernaut Charger: heavy spiked frontal iron plating & battering ram cowl
  if (kind === 'juggernaut') {
    const jPlateMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.34,
      metalness: 0.78,
    });
    hitFlashMaterials.push(jPlateMat);
    const ramPlate = new THREE.Mesh(
      getSharedGeo('z-jug-ram', () => new THREE.BoxGeometry(1.22, 1.15, 0.32)),
      jPlateMat,
    );
    ramPlate.position.set(0, 1.18, -0.44);
    const helm = new THREE.Mesh(
      getSharedGeo('z-jug-helm', () => new THREE.CylinderGeometry(0.4, 0.46, 0.56, 8)),
      jPlateMat,
    );
    helm.position.set(0, 1.9, -0.05);
    const hornGeo = getSharedGeo('z-jug-horn', () => new THREE.ConeGeometry(0.11, 0.48, 6));
    const hL = new THREE.Mesh(hornGeo, eyeMat);
    hL.rotation.x = -Math.PI / 2;
    hL.position.set(-0.34, 1.48, -0.66);
    const hR = new THREE.Mesh(hornGeo, eyeMat);
    hR.rotation.x = -Math.PI / 2;
    hR.position.set(0.34, 1.48, -0.66);
    bodyGroup.add(ramPlate, helm, hL, hR);
  }

  // Siege Breaker: heavy crimson demolition hammers & sensor array
  if (kind === 'siege_breaker') {
    const sbMat = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      roughness: 0.35,
      metalness: 0.72,
    });
    hitFlashMaterials.push(sbMat);
    const hammerGeo = getSharedGeo('z-sb-hammer', () => new THREE.BoxGeometry(0.34, 0.42, 0.42));
    const hL = new THREE.Mesh(hammerGeo, sbMat);
    hL.position.set(-0.46, 0.98, -0.58);
    const hR = new THREE.Mesh(hammerGeo, sbMat);
    hR.position.set(0.46, 0.98, -0.58);
    const visor = new THREE.Mesh(
      getSharedGeo('z-sb-visor', () => new THREE.BoxGeometry(0.46, 0.14, 0.24)),
      eyeMat,
    );
    visor.position.set(0, 1.62, -0.22);
    bodyGroup.add(hL, hR, visor);
  }

  // Necromancer: tall violet mantle + floating rune orb staff
  if (kind === 'necromancer') {
    const necroMat = new THREE.MeshStandardMaterial({
      color: 0x4c1d95,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.85,
      roughness: 0.45,
    });
    hitFlashMaterials.push(necroMat);
    const hood = new THREE.Mesh(
      getSharedGeo('z-necro-hood', () => new THREE.ConeGeometry(0.36, 0.65, 7)),
      necroMat,
    );
    hood.position.set(0, 1.54, 0.02);
    const staff = new THREE.Mesh(
      getSharedGeo('z-necro-staff', () => new THREE.CylinderGeometry(0.035, 0.035, 1.7, 6)),
      necroMat,
    );
    staff.position.set(0.44, 0.96, -0.28);
    const orb = new THREE.Mesh(
      getSharedGeo('z-necro-orb', () => new THREE.OctahedronGeometry(0.14, 0)),
      eyeMat,
    );
    orb.position.set(0.44, 1.88, -0.28);
    bodyGroup.add(hood, staff, orb);
  }

  // Hive Matriarch: emerald brood egg-sacs along spine
  if (kind === 'matriarch') {
    const broodMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 1.85,
      roughness: 0.28,
    });
    hitFlashMaterials.push(broodMat);
    const sacGeo = getSharedGeo('z-mat-sac', () => new THREE.SphereGeometry(0.26, 10, 8));
    for (const offset of [
      [-0.28, 1.32, 0.25],
      [0.28, 1.32, 0.25],
      [0, 1.62, 0.2],
      [0, 1.05, 0.34],
    ] as const) {
      const sac = new THREE.Mesh(sacGeo, broodMat);
      sac.position.set(offset[0], offset[1], offset[2]);
      bodyGroup.add(sac);
    }
  }

  // Apex Ravager: hunched silhouette with twin crimson plasma scythe blades
  if (kind === 'ravager') {
    const bladeGeo = getSharedGeo('z-ravager-blade', () => new THREE.ConeGeometry(0.08, 0.82, 5));
    const bL = new THREE.Mesh(bladeGeo, eyeMat);
    bL.rotation.x = -Math.PI / 2;
    bL.position.set(-0.46, 1.04, -0.68);
    const bR = new THREE.Mesh(bladeGeo, eyeMat);
    bR.rotation.x = -Math.PI / 2;
    bR.position.set(0.46, 1.04, -0.68);
    bodyGroup.add(bL, bR);
  }

  // Head + glowing eyes (facing -Z)
  const head = new THREE.Mesh(
    getSharedGeo(`z-head-${kind}`, () => new THREE.SphereGeometry(0.21 * scale, 12, 10)),
    skinMat,
  );
  head.position.set(0, 1.22 * scale, kind === 'runner' ? -0.1 : 0);
  head.castShadow = !isStalker;
  bodyGroup.add(head);

  const eyeGeo = getSharedGeo(
    `z-eye-${kind}`,
    () => new THREE.BoxGeometry(0.065 * scale, 0.045 * scale, 0.05 * scale),
  );
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(
    -0.07 * scale,
    1.24 * scale,
    (kind === 'runner' ? -0.28 : -0.19) * scale,
  );
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(
    0.07 * scale,
    1.24 * scale,
    (kind === 'runner' ? -0.28 : -0.19) * scale,
  );
  bodyGroup.add(eyeL, eyeR);

  // Reaching arms (-Z forward)
  const armGeo = getSharedGeo(
    `z-arm-${kind}`,
    () => new THREE.BoxGeometry(0.14 * scale, 0.14 * scale, 0.48 * scale),
  );
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(-0.3 * scale, 0.88 * scale, -0.26 * scale);
  const rightArm = new THREE.Mesh(armGeo, skinMat);
  rightArm.position.set(0.3 * scale, 0.88 * scale, -0.26 * scale);
  bodyGroup.add(leftArm, rightArm);

  // Clear Red Ground Telegraph Rings (Brute, Breacher, Juggernaut, Ravager, Boss, Acid Spitter)
  let telegraphRing: THREE.Mesh | null = null;
  let telegraphLine: THREE.Mesh | null = null;
  if (
    kind === 'brute' ||
    kind === 'breacher' ||
    kind === 'juggernaut' ||
    kind === 'ravager' ||
    kind === 'boss' ||
    kind === 'spitter'
  ) {
    const innerR =
      kind === 'boss'
        ? 2.35
        : kind === 'spitter'
          ? 0.95
          : kind === 'juggernaut'
            ? 1.7
            : 1.55;
    const outerR =
      kind === 'boss'
        ? 2.8
        : kind === 'spitter'
          ? 1.35
          : kind === 'juggernaut'
            ? 2.08
            : 1.9;
    const ringGeo = getSharedGeo(
      `z-tele-ring-${kind}`,
      () => new THREE.RingGeometry(innerR, outerR, 28),
    );
    const ringMat = new THREE.MeshBasicMaterial({
      color: kind === 'boss' ? 0xf43f5e : 0xef4444,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    telegraphRing = new THREE.Mesh(ringGeo, ringMat);
    telegraphRing.rotation.x = -Math.PI / 2;
    telegraphRing.position.y = 0.045;
    telegraphRing.visible = false;
    root.add(telegraphRing);

    if (kind === 'spitter' || kind === 'juggernaut') {
      const beamGeo = getSharedGeo('z-spit-line', () => {
        const g = new THREE.BoxGeometry(0.14, 0.04, 1);
        g.translate(0, 0, -0.5);
        return g;
      });
      const beamMat = new THREE.MeshBasicMaterial({
        color: kind === 'juggernaut' ? 0xf59e0b : 0xef4444,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
      });
      telegraphLine = new THREE.Mesh(beamGeo, beamMat);
      telegraphLine.position.y = kind === 'juggernaut' ? 0.05 : 0.65;
      telegraphLine.visible = false;
      root.add(telegraphLine);
    }
  }

  // Elite Mutation / Necromancer Overshield Halo Ring (hidden by default)
  const eliteRingMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const eliteRing = new THREE.Mesh(
    getSharedGeo(`z-elite-ring-${kind}`, () =>
      new THREE.RingGeometry(0.68 * scale, 0.84 * scale, 26),
    ),
    eliteRingMat,
  );
  eliteRing.rotation.x = -Math.PI / 2;
  eliteRing.position.y = 0.036;
  eliteRing.visible = false;
  root.add(eliteRing);

  // Boss Phase 2 Invulnerable Shield Dome
  let bossShieldSphere: THREE.Mesh | null = null;
  let bossShieldMat: THREE.MeshBasicMaterial | null = null;
  if (kind === 'boss') {
    bossShieldMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      wireframe: true,
      depthWrite: false,
    });
    bossShieldSphere = new THREE.Mesh(
      getSharedGeo('z-boss-shield-dome', () => new THREE.SphereGeometry(1.95, 16, 12)),
      bossShieldMat,
    );
    bossShieldSphere.position.y = 1.45;
    bossShieldSphere.visible = false;
    root.add(bossShieldSphere);
  }

  // World-space miniature HP bar (hidden until damaged, always shown on boss)
  const hpBarGroup = new THREE.Group();
  hpBarGroup.position.set(
    0,
    kind === 'boss'
      ? 3.25
      : kind === 'brute' || kind === 'breacher' || kind === 'juggernaut' || kind === 'matriarch'
        ? 2.45
        : 1.82,
    0,
  );
  hpBarGroup.visible = kind === 'boss';
  const barW =
    kind === 'boss'
      ? 2.1
      : kind === 'brute' || kind === 'breacher' || kind === 'juggernaut' || kind === 'matriarch'
        ? 1.25
        : 0.78;
  const barH = kind === 'boss' ? 0.16 : 0.12;
  const fillH = kind === 'boss' ? 0.1 : 0.07;
  const hpBg = new THREE.Mesh(
    getSharedGeo(
      `z-hpbg-${kind}`,
      () => new THREE.PlaneGeometry(barW + 0.08, barH),
    ),
    new THREE.MeshBasicMaterial({
      color: 0x090d16,
      side: THREE.DoubleSide,
      depthTest: false,
    }),
  );
  const fillGeo = getSharedGeo(`z-hpfill-${kind}`, () => {
    const g = new THREE.PlaneGeometry(barW, fillH);
    g.translate(barW / 2, 0, 0);
    return g;
  });
  const hpBarFill = new THREE.Mesh(
    fillGeo,
    new THREE.MeshBasicMaterial({
      color:
        kind === 'boss' || kind === 'ravager'
          ? 0xf43f5e
          : kind === 'brute' || kind === 'breacher' || kind === 'juggernaut'
            ? 0xf59e0b
            : kind === 'spitter' || kind === 'matriarch' || kind === 'crawler'
              ? 0x84cc16
              : kind === 'stalker' || kind === 'necromancer'
                ? 0xc084fc
                : 0xef4444,
      side: THREE.DoubleSide,
      depthTest: false,
    }),
  );
  hpBarFill.position.set(-barW / 2, 0, 0.01);
  hpBarGroup.add(hpBg, hpBarFill);
  root.add(hpBarGroup);

  return {
    root,
    bodyGroup,
    leftArm,
    rightArm,
    hitFlashMaterials,
    stalkerMaterials: isStalker ? stalkerMaterials : undefined,
    auraRing,
    eliteRing,
    eliteRingMat,
    bossShieldSphere,
    bossShieldMat,
    bossCoreMat,
    bossAuraMat,
    telegraphRing,
    telegraphLine,
    hpBarGroup,
    hpBarFill,
  };
}

export function applyBossPhase2Glow(rig: ZombieRig): void {
  if (rig.bossCoreMat) {
    rig.bossCoreMat.color.setHex(0xff7b00);
    rig.bossCoreMat.emissive.setHex(0xf97316);
    rig.bossCoreMat.emissiveIntensity = 4.2;
  }
  if (rig.bossAuraMat) {
    rig.bossAuraMat.color.setHex(0xf97316);
    rig.bossAuraMat.opacity = 0.72;
  }
  rig.bodyGroup.scale.set(1.09, 1.07, 1.09);
}

export function buildCarMesh(
  variant: number,
  halfW: number,
  halfD: number,
  shadowTex: THREE.CanvasTexture,
): THREE.Group {
  const group = new THREE.Group();
  const isVertical = halfD > halfW;
  const length = (isVertical ? halfD : halfW) * 2;
  const width = (isVertical ? halfW : halfD) * 2;

  const carBody = new THREE.Group();
  if (isVertical) {
    carBody.rotation.y = Math.PI / 2;
  }
  group.add(carBody);

  const shadow = buildContactShadow(shadowTex, Math.max(halfW, halfD) * 1.18, 0.68);
  shadow.scale.set(
    (halfW * 2.2) / (Math.max(halfW, halfD) * 2.3),
    (halfD * 2.2) / (Math.max(halfW, halfD) * 2.3),
    1,
  );
  group.add(shadow);

  // 0 = Police Cruiser (dark slate + white door/roof), 1 = Abandoned Taxi (amber), 2 = Dark Sedan
  const paintColors = [0x1e293b, 0xb45309, 0x3f4756];
  const paintMat = new THREE.MeshStandardMaterial({
    color: paintColors[variant % paintColors.length],
    roughness: 0.36,
    metalness: 0.62,
  });
  const trimWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.42,
    metalness: 0.35,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0b1320,
    roughness: 0.1,
    metalness: 0.9,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.92,
    metalness: 0.05,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.25,
    metalness: 0.88,
  });
  const bumperMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.68,
    metalness: 0.35,
  });

  // 1. Extruded sloped sedan silhouette (side profile extruded across width)
  const L = length * 0.47;
  const profile = new THREE.Shape();
  profile.moveTo(-L, 0.26);
  profile.lineTo(L, 0.26);
  profile.lineTo(L * 0.98, 0.66); // front nose
  profile.lineTo(L * 0.45, 0.78); // sloped hood
  profile.lineTo(L * 0.16, 1.24); // sloped windshield
  profile.lineTo(-L * 0.38, 1.24); // roof
  profile.lineTo(-L * 0.66, 0.8); // rear window
  profile.lineTo(-L * 0.98, 0.74); // trunk deck
  profile.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(profile, {
    depth: width * 0.82,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 2,
  });
  bodyGeo.translate(0, 0, -(width * 0.82) / 2);
  const hullMesh = new THREE.Mesh(bodyGeo, paintMat);
  hullMesh.castShadow = true;
  hullMesh.receiveShadow = true;
  carBody.add(hullMesh);

  // 2. Inset cabin glass greenhouse + A/B/C window pillars
  const cabinGlass = new THREE.Mesh(
    new THREE.BoxGeometry(length * 0.48, 0.42, width * 0.87),
    glassMat,
  );
  cabinGlass.position.set(-length * 0.05, 0.99, 0);
  carBody.add(cabinGlass);

  const bPillar = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.44, width * 0.89),
    paintMat,
  );
  bPillar.position.set(-length * 0.05, 1.0, 0);
  carBody.add(bPillar);

  // Police cruiser white door stripe, push bar & roof lightbar, or Taxi cab roof sign
  if (variant % 3 === 0) {
    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(length * 0.36, 0.38, width * 0.93),
      trimWhiteMat,
    );
    doorPanel.position.set(-length * 0.04, 0.54, 0);
    carBody.add(doorPanel);

    const bullBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.34, width * 0.44),
      bumperMat,
    );
    bullBar.position.set(L + 0.14, 0.46, 0);
    carBody.add(bullBar);

    const barRed = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.1, width * 0.26),
      new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 1.85,
      }),
    );
    barRed.position.set(-length * 0.06, 1.32, -width * 0.14);
    const barBlue = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.1, width * 0.26),
      new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        emissive: 0x3b82f6,
        emissiveIntensity: 1.85,
      }),
    );
    barBlue.position.set(-length * 0.06, 1.32, width * 0.14);
    carBody.add(barRed, barBlue);
  } else if (variant % 3 === 1) {
    const taxiSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.14, 0.44),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.45,
      }),
    );
    taxiSign.position.set(-length * 0.04, 1.34, 0);
    carBody.add(taxiSign);
  } else {
    // Roof rack bars on civilian dark sedan
    for (const rz of [-width * 0.26, width * 0.26]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(length * 0.32, 0.06, 0.06),
        bumperMat,
      );
      rail.position.set(-length * 0.08, 1.29, rz);
      carBody.add(rail);
    }
  }

  // 3. Front grille + Front & rear bumpers + side mirrors
  const grille = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.2, width * 0.46),
    bumperMat,
  );
  grille.position.set(L + 0.03, 0.5, 0);
  carBody.add(grille);

  const bumperGeo = new THREE.BoxGeometry(0.16, 0.18, width * 0.94);
  const frontBumper = new THREE.Mesh(bumperGeo, bumperMat);
  frontBumper.position.set(L + 0.04, 0.32, 0);
  const rearBumper = new THREE.Mesh(bumperGeo, bumperMat);
  rearBumper.position.set(-L - 0.04, 0.32, 0);
  carBody.add(frontBumper, rearBumper);

  const mirrorGeo = new THREE.BoxGeometry(0.12, 0.09, 0.16);
  for (const side of [-1, 1]) {
    const m = new THREE.Mesh(mirrorGeo, paintMat);
    m.position.set(L * 0.32, 0.88, side * (width * 0.5));
    carBody.add(m);
  }

  // 4. Four wheels with rims
  const wheelGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.21, 16);
  const rimGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.23, 10);
  const wx = length * 0.31;
  const wz = width * 0.45;
  const wheelPositions: [number, number][] = [
    [wx, wz],
    [wx, -wz],
    [-wx, wz],
    [-wx, -wz],
  ];
  for (const [x, z] of wheelPositions) {
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    tire.rotation.x = Math.PI / 2;
    tire.position.set(x, 0.31, z);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, 0.31, z);
    carBody.add(tire, rim);
  }

  // 5. Headlights & taillights + soft amber ground headlight pool
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.15,
    roughness: 0.2,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.9,
    roughness: 0.25,
  });
  const lightGeo = new THREE.BoxGeometry(0.08, 0.13, 0.24);
  for (const side of [-1, 1]) {
    const hl = new THREE.Mesh(lightGeo, headMat);
    hl.position.set(L + 0.02, 0.56, side * width * 0.33);
    const tl = new THREE.Mesh(lightGeo, tailMat);
    tl.position.set(-L - 0.02, 0.62, side * width * 0.33);
    carBody.add(hl, tl);
  }

  // Headlight dual glow wedges on ground in front of car
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfde68a,
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  for (const side of [-1, 1]) {
    const beam = new THREE.Mesh(
      new THREE.CircleGeometry(2.35, 14, -0.34, 0.68),
      beamMat,
    );
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(L + 0.08, 0.025, side * width * 0.31);
    carBody.add(beam);
  }

  return group;
}

export function buildCrateCluster(
  halfW: number,
  halfD: number,
  height: number,
  crateTex: TexturedSurfaceSet,
  shadowTex: THREE.CanvasTexture,
  hazardTex?: THREE.CanvasTexture,
): THREE.Group {
  const group = new THREE.Group();
  group.add(buildContactShadow(shadowTex, Math.max(halfW, halfD) * 1.18, 0.58));

  const crateMat = new THREE.MeshStandardMaterial({
    map: crateTex.map,
    bumpMap: crateTex.bumpMap,
    bumpScale: 0.035,
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.08,
  });
  const strapMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.35,
    metalness: 0.78,
  });
  const palletMat = new THREE.MeshStandardMaterial({
    color: 0x453221,
    roughness: 0.9,
    metalness: 0.02,
  });

  // Wooden pallet base underneath main crate
  const mainW = halfW * 1.32;
  const mainD = halfD * 1.82;
  const pallet = new THREE.Mesh(
    new THREE.BoxGeometry(mainW + 0.14, 0.1, mainD + 0.12),
    palletMat,
  );
  pallet.position.set(-halfW * 0.25, 0.05, 0);
  pallet.receiveShadow = true;
  group.add(pallet);

  // Main wooden supply crate
  const main = new THREE.Mesh(
    new THREE.BoxGeometry(mainW, height - 0.08, mainD),
    crateMat,
  );
  main.position.set(-halfW * 0.25, (height - 0.08) / 2 + 0.08, 0);
  main.castShadow = true;
  main.receiveShadow = true;
  group.add(main);

  // Non-coplanar upper steel collar below top face
  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(mainW + 0.06, 0.12, mainD + 0.06),
    strapMat,
  );
  rim.position.set(-halfW * 0.25, height - 0.1, 0);
  group.add(rim);

  // Ribbed hazard steel barrel (LatheGeometry) alongside crate
  const barrelRadius = Math.min(halfW, halfD) * 0.45;
  const barrelH = height * 0.88;
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(barrelRadius, 0),
    new THREE.Vector2(barrelRadius, barrelH * 0.28),
    new THREE.Vector2(barrelRadius * 1.08, barrelH * 0.31),
    new THREE.Vector2(barrelRadius, barrelH * 0.34),
    new THREE.Vector2(barrelRadius, barrelH * 0.66),
    new THREE.Vector2(barrelRadius * 1.08, barrelH * 0.69),
    new THREE.Vector2(barrelRadius, barrelH * 0.72),
    new THREE.Vector2(barrelRadius, barrelH),
    new THREE.Vector2(0, barrelH),
  ];
  const barrelGeo = new THREE.LatheGeometry(pts, 16);
  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0x9a3412,
    roughness: 0.42,
    metalness: 0.58,
  });
  const barrel = new THREE.Mesh(barrelGeo, barrelMat);
  barrel.position.set(halfW * 0.58, 0, halfD * 0.2);
  barrel.castShadow = true;
  barrel.receiveShadow = true;
  group.add(barrel);

  if (hazardTex) {
    const hazardBand = new THREE.Mesh(
      new THREE.CylinderGeometry(
        barrelRadius * 1.04,
        barrelRadius * 1.04,
        barrelH * 0.22,
        16,
        1,
        true,
      ),
      new THREE.MeshStandardMaterial({
        map: hazardTex,
        roughness: 0.5,
        metalness: 0.2,
      }),
    );
    hazardBand.position.set(halfW * 0.58, barrelH * 0.5, halfD * 0.2);
    group.add(hazardBand);
  }

  // Small top ammo box stacked cleanly on top of crate (non-coplanar)
  const topBox = new THREE.Mesh(
    new THREE.BoxGeometry(mainW * 0.46, 0.28, mainD * 0.36),
    strapMat,
  );
  topBox.position.set(-halfW * 0.25, height + 0.14, -mainD * 0.14);
  topBox.rotation.y = 0.22;
  topBox.castShadow = true;
  group.add(topBox);

  return group;
}

export interface StreetLampRig {
  group: THREE.Group;
  pointLight: THREE.PointLight | null;
  bulbMat: THREE.MeshStandardMaterial;
  coneMat: THREE.MeshBasicMaterial;
  poolMat: THREE.MeshBasicMaterial;
}

export function buildStreetLamp(
  lightPoolTex: THREE.CanvasTexture,
  addPointLight: boolean,
): StreetLampRig {
  const group = new THREE.Group();
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.82,
  });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.4,
    roughness: 0.2,
  });

  // Fluted cast-iron base plinth
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.4, 0.78, 8),
    ironMat,
  );
  base.position.y = 0.39;
  base.castShadow = true;
  group.add(base);

  // Tapered pole
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.14, 4.7, 8),
    ironMat,
  );
  pole.position.y = 3.0;
  pole.castShadow = true;
  group.add(pole);

  // Diagonal outreach arm + decorative collar bracket toward courtyard center
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.25), ironMat);
  arm.position.set(0, 5.25, 0.55);
  arm.rotation.x = -0.18;
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.78), ironMat);
  brace.position.set(0, 4.92, 0.34);
  brace.rotation.x = 0.62;
  group.add(arm, brace);

  // Lamp hood & finial
  const hood = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.42, 0.26, 10),
    ironMat,
  );
  hood.position.set(0, 5.34, 1.12);
  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.24, 8), ironMat);
  finial.position.set(0, 5.58, 1.12);
  group.add(hood, finial);

  // Glowing sodium-vapor bulb
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), bulbMat);
  bulb.position.set(0, 5.16, 1.12);
  group.add(bulb);

  // Translucent downward volumetric light cone
  const coneGeo = new THREE.CylinderGeometry(0.28, 3.6, 5.1, 16, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.055,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.set(0, 2.6, 1.12);
  group.add(cone);

  // Warm ground light pool decal
  const poolMat = new THREE.MeshBasicMaterial({
    map: lightPoolTex,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(12.5, 12.5),
    poolMat,
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.025, 0.9);
  group.add(pool);

  let pointLight: THREE.PointLight | null = null;
  if (addPointLight) {
    pointLight = new THREE.PointLight(0xffb347, 18, 18, 1.75);
    pointLight.position.set(0, 4.9, 1.12);
    group.add(pointLight);
  }

  return {
    group,
    pointLight,
    bulbMat,
    coneMat,
    poolMat,
  };
}

export function buildDumpster(shadowTex: THREE.CanvasTexture): THREE.Group {
  const group = new THREE.Group();
  group.add(buildContactShadow(shadowTex, 1.35, 0.6));

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a2f,
    roughness: 0.72,
    metalness: 0.35,
  });
  const lidMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.85,
    metalness: 0.1,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.15, 1.15), bodyMat);
  body.position.y = 0.62;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const lid = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.14, 1.22), lidMat);
  lid.position.y = 1.26;
  lid.rotation.x = 0.06;
  group.add(lid);

  const pocketGeo = new THREE.BoxGeometry(0.14, 0.25, 0.3);
  const pL = new THREE.Mesh(pocketGeo, lidMat);
  pL.position.set(-1.1, 0.65, 0);
  const pR = new THREE.Mesh(pocketGeo, lidMat);
  pR.position.set(1.1, 0.65, 0);
  group.add(pL, pR);

  return group;
}

export function buildPickupCrate(
  kind: CrateKind,
  shadowTex: THREE.CanvasTexture,
): THREE.Group {
  const group = new THREE.Group();
  group.add(buildContactShadow(shadowTex, 0.58, 0.55));

  const accent =
    kind === 'health' ? 0x22c55e : kind === 'ammo' ? 0xf59e0b : 0xef4444;

  const boxGroup = new THREE.Group();
  boxGroup.name = 'pickup-body';
  group.add(boxGroup);

  const shellMat = new THREE.MeshStandardMaterial({
    color: kind === 'health' ? 0xe2e8f0 : 0x1e293b,
    roughness: 0.42,
    metalness: 0.4,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: accent,
    emissive: accent,
    emissiveIntensity: 1.65,
    roughness: 0.25,
    metalness: 0.2,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), shellMat);
  body.position.y = 0.44;
  body.castShadow = true;
  boxGroup.add(body);

  const band = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.1, 0.74), glowMat);
  band.position.y = 0.44;
  boxGroup.add(band);

  if (kind === 'health') {
    const crossA = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.12), glowMat);
    crossA.position.y = 0.72;
    const crossB = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.36), glowMat);
    crossB.position.y = 0.72;
    boxGroup.add(crossA, crossB);
  } else {
    const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), glowMat);
    crest.position.y = 0.82;
    boxGroup.add(crest);
  }

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.46, 0.58, 20),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  group.add(ring);

  return group;
}

export function buildCornerBrazier(
  shadowTex: THREE.CanvasTexture,
  addPointLight: boolean,
): { group: THREE.Group; emberMesh: THREE.Mesh; pointLight: THREE.PointLight | null } {
  const group = new THREE.Group();
  group.add(buildContactShadow(shadowTex, 0.72, 0.65));

  const drumMat = new THREE.MeshStandardMaterial({
    color: 0x3b261d,
    roughness: 0.78,
    metalness: 0.52,
  });
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0xff6b2b,
    emissive: 0xff4d00,
    emissiveIntensity: 2.3,
    roughness: 0.4,
  });

  const drum = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.38, 0.96, 12),
    drumMat,
  );
  drum.position.y = 0.48;
  drum.castShadow = true;
  group.add(drum);

  const emberMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.32, 0.14, 12),
    emberMat,
  );
  emberMesh.position.y = 0.95;
  group.add(emberMesh);

  // Glowing perforated fire slots around barrel upper third
  for (let k = 0; k < 4; k++) {
    const angle = (k * Math.PI) / 2;
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.05), emberMat);
    slot.position.set(Math.sin(angle) * 0.39, 0.76, Math.cos(angle) * 0.39);
    slot.rotation.y = angle;
    group.add(slot);
  }

  let pointLight: THREE.PointLight | null = null;
  if (addPointLight) {
    pointLight = new THREE.PointLight(0xff6b2b, 9, 10, 1.8);
    pointLight.position.set(0, 1.35, 0);
    group.add(pointLight);
  }

  return { group, emberMesh, pointLight };
}

export function buildJerseyBarrier(hazardTex: THREE.CanvasTexture): THREE.Group {
  const group = new THREE.Group();
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x3f4752,
    roughness: 0.9,
    metalness: 0.05,
  });
  const stripeMat = new THREE.MeshStandardMaterial({
    map: hazardTex,
    roughness: 0.65,
    metalness: 0.1,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.34, 0.56), concreteMat);
  base.position.y = 0.17;
  base.receiveShadow = true;
  base.castShadow = true;
  const stem = new THREE.Mesh(new THREE.BoxGeometry(2.56, 0.48, 0.32), concreteMat);
  stem.position.y = 0.54;
  stem.castShadow = true;
  const capStripe = new THREE.Mesh(
    new THREE.BoxGeometry(2.58, 0.12, 0.34),
    stripeMat,
  );
  capStripe.position.y = 0.78;
  group.add(base, stem, capStripe);
  return group;
}

export function buildProximityMineMesh(
  shadowTex: THREE.CanvasTexture,
): ProximityMineRig {
  const root = new THREE.Group();
  root.add(buildContactShadow(shadowTex, 0.42, 0.5));

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.42,
    metalness: 0.75,
  });
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xef4444,
    emissiveIntensity: 2.0,
    roughness: 0.2,
  });

  const disc = new THREE.Mesh(
    getSharedGeo('gear-mine-disc', () => new THREE.CylinderGeometry(0.28, 0.34, 0.12, 12)),
    bodyMat,
  );
  disc.position.y = 0.06;
  const cap = new THREE.Mesh(
    getSharedGeo('gear-mine-cap', () => new THREE.CylinderGeometry(0.1, 0.14, 0.08, 10)),
    ledMat,
  );
  cap.position.y = 0.15;

  const ringMesh = new THREE.Mesh(
    getSharedGeo('gear-mine-ring', () => new THREE.RingGeometry(0.55, 0.65, 24)),
    new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.03;

  root.add(disc, cap, ringMesh);
  return { root, ledMat, ringMesh };
}

export function buildDeployableTurretRig(
  shadowTex: THREE.CanvasTexture,
): DeployableTurretRig {
  const root = new THREE.Group();
  root.add(buildContactShadow(shadowTex, 0.58, 0.58));

  const tripodMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.48,
    metalness: 0.72,
  });
  const gunMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.32,
    metalness: 0.85,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });

  // Tripod base legs
  const legGeo = getSharedGeo(
    'gear-turret-leg',
    () => new THREE.BoxGeometry(0.1, 0.56, 0.12),
  );
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const leg = new THREE.Mesh(legGeo, tripodMat);
    leg.position.set(Math.sin(a) * 0.25, 0.24, Math.cos(a) * 0.25);
    leg.rotation.y = a;
    leg.rotation.x = 0.42;
    root.add(leg);
  }
  const hub = new THREE.Mesh(
    getSharedGeo('gear-turret-hub', () => new THREE.CylinderGeometry(0.16, 0.2, 0.32, 10)),
    tripodMat,
  );
  hub.position.y = 0.48;
  root.add(hub);

  // Rotating turret head facing -Z
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.72, 0);
  root.add(headGroup);

  const housing = new THREE.Mesh(
    getSharedGeo('gear-turret-head', () => new THREE.BoxGeometry(0.42, 0.28, 0.48)),
    gunMat,
  );
  housing.castShadow = true;
  const sensor = new THREE.Mesh(
    getSharedGeo('gear-turret-sensor', () => new THREE.BoxGeometry(0.24, 0.08, 0.14)),
    accentMat,
  );
  sensor.position.set(0, 0.16, -0.1);
  const barrelGeo = getSharedGeo(
    'gear-turret-barrel',
    () => new THREE.CylinderGeometry(0.032, 0.032, 0.54, 8),
  );
  const bL = new THREE.Mesh(barrelGeo, tripodMat);
  bL.rotation.x = Math.PI / 2;
  bL.position.set(-0.11, 0.02, -0.45);
  const bR = new THREE.Mesh(barrelGeo, tripodMat);
  bR.rotation.x = Math.PI / 2;
  bR.position.set(0.11, 0.02, -0.45);
  headGroup.add(housing, sensor, bL, bR);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.02, -0.74);
  headGroup.add(muzzlePoint);

  const muzzleFlash = new THREE.Mesh(
    getSharedGeo('gear-turret-flash', () => new THREE.OctahedronGeometry(0.15, 0)),
    new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  muzzleFlash.position.copy(muzzlePoint.position);
  muzzleFlash.visible = false;
  headGroup.add(muzzleFlash);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const baseRing = new THREE.Mesh(
    getSharedGeo('gear-turret-ring', () => new THREE.RingGeometry(0.55, 0.65, 24)),
    ringMat,
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = 0.03;
  root.add(baseRing);

  return { root, headGroup, muzzlePoint, muzzleFlash, ringMat };
}

export function buildAcidPuddleMesh(): {
  mesh: THREE.Group;
  mat: THREE.MeshBasicMaterial;
  ringMat: THREE.MeshBasicMaterial;
} {
  const mesh = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0x65a30d,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const pool = new THREE.Mesh(
    getSharedGeo('acid-puddle-disc', () => new THREE.CircleGeometry(1.85, 22)),
    mat,
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.026;

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xbef264,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const rim = new THREE.Mesh(
    getSharedGeo('acid-puddle-rim', () => new THREE.RingGeometry(1.7, 1.88, 22)),
    ringMat,
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.028;

  mesh.add(pool, rim);
  return { mesh, mat, ringMat };
}

export function buildConcretePillar(
  halfW: number,
  halfD: number,
  height: number,
  shadowTex: THREE.CanvasTexture,
  hazardTex?: THREE.CanvasTexture,
): THREE.Group {
  const group = new THREE.Group();
  group.add(buildContactShadow(shadowTex, Math.max(halfW, halfD) * 1.28, 0.65));

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.88,
    metalness: 0.08,
  });
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.9,
    metalness: 0.12,
  });

  const col = new THREE.Mesh(
    new THREE.BoxGeometry(halfW * 1.9, height, halfD * 1.9),
    concreteMat,
  );
  col.position.y = height / 2;
  col.castShadow = true;
  col.receiveShadow = true;
  group.add(col);

  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(halfW * 2.02, 0.42, halfD * 2.02),
    baseMat,
  );
  plinth.position.y = 0.21;
  group.add(plinth);

  if (hazardTex) {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(halfW * 1.96, 0.28, halfD * 1.96),
      new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.65 }),
    );
    band.position.y = 1.15;
    group.add(band);
  }

  return group;
}

export interface ExplosiveBarrelRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  capMat: THREE.MeshStandardMaterial;
  ringMat: THREE.MeshBasicMaterial;
}

export function buildExplosiveBarrel(
  shadowTex: THREE.CanvasTexture,
  hazardTex?: THREE.CanvasTexture,
): ExplosiveBarrelRig {
  const root = new THREE.Group();
  root.add(buildContactShadow(shadowTex, 0.56, 0.55));

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const drumMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.38,
    metalness: 0.55,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 1.5,
    roughness: 0.3,
  });

  const drum = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.44, 1.12, 14),
    drumMat,
  );
  drum.position.y = 0.56;
  drum.castShadow = true;
  bodyGroup.add(drum);

  const hazardBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.24, 14),
    hazardTex
      ? new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.45 })
      : capMat,
  );
  hazardBand.position.y = 0.62;
  bodyGroup.add(hazardBand);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 10), capMat);
  cap.position.y = 1.14;
  bodyGroup.add(cap);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.72, 22), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  root.add(ring);

  return { root, bodyGroup, capMat, ringMat };
}

export interface FloodlightGeneratorRig {
  root: THREE.Group;
  beaconMat: THREE.MeshStandardMaterial;
  ringMat: THREE.MeshBasicMaterial;
  spotLight: THREE.PointLight | null;
  poolMat: THREE.MeshBasicMaterial;
}

export function buildFloodlightGenerator(
  shadowTex: THREE.CanvasTexture,
  lightPoolTex: THREE.CanvasTexture,
  enablePointLight: boolean,
): FloodlightGeneratorRig {
  const root = new THREE.Group();
  root.add(buildContactShadow(shadowTex, 0.8, 0.6));

  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.55,
    metalness: 0.65,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.4,
    metalness: 0.45,
  });
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    emissive: 0x475569,
    emissiveIntensity: 0.5,
    roughness: 0.25,
  });

  const unit = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.76, 0.78), chassisMat);
  unit.position.y = 0.38;
  unit.castShadow = true;
  root.add(unit);

  const cage = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.14, 0.84), accentMat);
  cage.position.y = 0.74;
  root.add(cage);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.7, 8), chassisMat);
  mast.position.set(0, 1.9, 0);
  mast.castShadow = true;
  root.add(mast);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.26, 0.24), beaconMat);
  head.position.set(0, 3.25, 0);
  root.add(head);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.35, 2.55, 36), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.032;
  root.add(ring);

  const poolMat = new THREE.MeshBasicMaterial({
    map: lightPoolTex,
    color: 0xbae6fd,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.025;
  root.add(pool);

  let spotLight: THREE.PointLight | null = null;
  if (enablePointLight) {
    spotLight = new THREE.PointLight(0xe0f2fe, 0, 24, 1.45);
    spotLight.position.set(0, 3.6, 0);
    root.add(spotLight);
  }

  return { root, beaconMat, ringMat, spotLight, poolMat };
}

export function buildRiskSupplyCrate(
  shadowTex: THREE.CanvasTexture,
): THREE.Group {
  const group = new THREE.Group();
  group.add(buildContactShadow(shadowTex, 0.85, 0.62));

  const crateMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.55,
  });
  const amberGlow = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.62, 0.95), crateMat);
  body.position.y = 0.38;
  body.castShadow = true;
  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 1.0), amberGlow);
  trim.position.y = 0.42;

  const beaconPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.09, 2.2, 8),
    new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  beaconPole.position.y = 1.4;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 0.95, 24),
    new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.032;

  group.add(body, trim, beaconPole, ring);
  return group;
}

export function buildLaserTripmine(
  shadowTex: THREE.CanvasTexture,
): THREE.Group {
  const root = new THREE.Group();
  root.add(buildContactShadow(shadowTex, 0.38, 0.45));
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.2, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 }),
  );
  body.position.y = 0.14;
  const laserMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.85,
  });
  const laserBeam = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.045, 0.045), laserMat);
  laserBeam.position.y = 0.22;
  root.add(body, laserBeam);
  return root;
}

export function buildDecoyFlare(shadowTex: THREE.CanvasTexture): THREE.Group {
  const root = new THREE.Group();
  root.add(buildContactShadow(shadowTex, 0.44, 0.5));
  const canister = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.42, 10),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.6,
    }),
  );
  canister.position.y = 0.22;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.68, 0.82, 24),
    new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  root.add(canister, ring);
  return root;
}

export function buildBarbedWireMesh(
  shadowTex: THREE.CanvasTexture,
): THREE.Group {
  const root = new THREE.Group();
  root.add(buildContactShadow(shadowTex, 1.4, 0.35));
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.38,
    metalness: 0.85,
  });
  for (let i = -2; i <= 2; i++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 6, 14), steelMat);
    coil.position.set(i * 0.42, 0.28, (i % 2) * 0.14);
    coil.rotation.y = 0.3 * i;
    root.add(coil);
  }
  const zoneRing = new THREE.Mesh(
    new THREE.RingGeometry(2.55, 2.75, 28),
    new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  zoneRing.rotation.x = -Math.PI / 2;
  zoneRing.position.y = 0.028;
  root.add(zoneRing);
  return root;
}

export function buildMortarTargetRing(radius: number): {
  group: THREE.Group;
  fillMat: THREE.MeshBasicMaterial;
} {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.92, radius, 32),
    new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  outer.rotation.x = -Math.PI / 2;
  outer.position.y = 0.04;

  const fillMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const fill = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.9, 32), fillMat);
  fill.rotation.x = -Math.PI / 2;
  fill.position.y = 0.035;

  group.add(outer, fill);
  return { group, fillMat };
}

export interface CombatDroneRig {
  root: THREE.Group;
  coreMat: THREE.MeshStandardMaterial;
  haloMesh: THREE.Mesh;
}

export function buildCombatDroneRig(droneId: Exclude<DroneId, 'none'>): CombatDroneRig {
  const spec = DRONE_SPECS[droneId];
  const root = new THREE.Group();

  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.78,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: spec.colorHex,
    emissive: spec.colorHex,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });

  const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), chassisMat);
  body.scale.set(1.15, 0.65, 1.3);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), coreMat);
  eye.position.set(0, 0, -0.18);

  const wingGeo = new THREE.BoxGeometry(0.56, 0.04, 0.14);
  const wings = new THREE.Mesh(wingGeo, chassisMat);
  wings.position.set(0, 0.04, 0.04);

  const haloMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.34, 20),
    new THREE.MeshBasicMaterial({
      color: spec.colorHex,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  haloMesh.rotation.x = -Math.PI / 2;
  haloMesh.position.y = 0.08;

  root.add(body, eye, wings, haloMesh);
  return { root, coreMat, haloMesh };
}

export function buildNanoShieldDomeMesh(): THREE.Group {
  const group = new THREE.Group();
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.35, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.56),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      wireframe: false,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(2.37, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
    new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.38,
      wireframe: true,
      depthWrite: false,
    }),
  );
  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(2.22, 2.42, 32),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = 0.04;
  group.add(sphere, wire, baseRing);
  group.visible = false;
  return group;
}

export function buildSingularityVortexMesh(): THREE.Group {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 14, 12),
    new THREE.MeshBasicMaterial({
      color: 0x1e1b4b,
    }),
  );
  core.position.y = 0.85;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 2.1, 28),
    new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.58,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.08, 8, 22),
    new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.72,
    }),
  );
  halo.rotation.x = Math.PI / 2.4;
  halo.position.y = 0.85;
  group.add(core, ring, halo);
  return group;
}

export function buildCryoCanister(shadowTex: THREE.CanvasTexture): THREE.Group {
  const root = new THREE.Group();
  root.add(buildContactShadow(shadowTex, 0.62, 0.62));
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.44, 1.18, 12),
    new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.75,
      roughness: 0.3,
      metalness: 0.45,
    }),
  );
  body.position.y = 0.62;
  body.castShadow = true;
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.22, 12),
    new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.9,
    }),
  );
  band.position.y = 0.64;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.76, 20),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  root.add(body, band, ring);
  return root;
}

export function buildTacticalPadStation(
  kind: 'auto_turret' | 'overcharge_light',
  shadowTex: THREE.CanvasTexture,
): { root: THREE.Group; ringMat: THREE.MeshBasicMaterial } {
  const root = new THREE.Group();
  root.add(buildContactShadow(shadowTex, 1.5, 0.45));
  const accent = kind === 'auto_turret' ? 0xf59e0b : 0x38bdf8;
  const basePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 1.85, 0.08, 24),
    new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.65,
    }),
  );
  basePlate.position.y = 0.04;
  const ringMat = new THREE.MeshBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const outerRing = new THREE.Mesh(new THREE.RingGeometry(1.85, 2.08, 28), ringMat);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.045;

  const kiosk = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 1.35, 0.42),
    new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.42,
      metalness: 0.72,
    }),
  );
  kiosk.position.set(0, 0.72, -1.55);
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 8),
    new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 2.2,
    }),
  );
  beacon.position.set(0, 1.54, -1.55);
  root.add(basePlate, outerRing, kiosk, beacon);
  return { root, ringMat };
}

export function buildSubwayTrainMesh(): THREE.Group {
  const root = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.35,
    metalness: 0.78,
  });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.85,
  });
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(16.5, 2.85, 3.65), hullMat);
  body.position.y = 1.65;
  body.castShadow = true;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.36, 3.72), stripeMat);
  stripe.position.y = 1.45;
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.4, 3.4), hullMat);
  nose.position.set(8.6, 1.5, 0);
  const lightL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.38, 0.55), headlightMat);
  lightL.position.set(9.18, 1.5, -1.05);
  const lightR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.38, 0.55), headlightMat);
  lightR.position.set(9.18, 1.5, 1.05);
  const rearLight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 2.4), tailMat);
  rearLight.position.set(-8.3, 1.5, 0);

  root.add(body, stripe, nose, lightL, lightR, rearLight);
  return root;
}

export function buildBiolabGlassPod(
  halfW: number,
  halfD: number,
  height: number,
  shadowTex: THREE.CanvasTexture,
): THREE.Group {
  const group = new THREE.Group();
  const radius = Math.max(0.75, Math.min(halfW, halfD) * 0.92);
  group.add(buildContactShadow(shadowTex, radius * 1.1, 0.6));

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.36,
    metalness: 0.8,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x0891b2,
    emissiveIntensity: 0.95,
    transparent: true,
    opacity: 0.48,
    roughness: 0.14,
  });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.08, 0.42, 16), metalMat);
  base.position.y = 0.21;
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.86, radius * 0.86, height - 0.72, 16),
    glassMat,
  );
  tube.position.y = height * 0.5;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.02, radius, 0.36, 16), metalMat);
  cap.position.y = height - 0.18;
  group.add(base, tube, cap);
  return group;
}

export function buildTechPillarMesh(
  halfW: number,
  halfD: number,
  height: number,
  shadowTex: THREE.CanvasTexture,
  accentColor = 0xf59e0b,
): THREE.Group {
  const group = new THREE.Group();
  group.add(buildContactShadow(shadowTex, Math.max(halfW, halfD) * 1.25, 0.65));
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(halfW * 2, height, halfD * 2),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.72 }),
  );
  body.position.y = height * 0.5;
  body.castShadow = true;
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(halfW * 2.06, 0.2, halfD * 2.06),
    new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 1.8,
    }),
  );
  strip.position.y = height * 0.78;
  group.add(body, strip);
  return group;
}

export function buildToxicVentMesh(): {
  root: THREE.Group;
  ringMat: THREE.MeshBasicMaterial;
} {
  const root = new THREE.Group();
  const grate = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.2, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.7 }),
  );
  grate.position.y = 0.04;
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const aura = new THREE.Mesh(new THREE.RingGeometry(1.15, 2.85, 24), ringMat);
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.042;
  root.add(grate, aura);
  return { root, ringMat };
}

export function buildOrbitalPodMesh(shadowTex: THREE.CanvasTexture): {
  root: THREE.Group;
  ringMat: THREE.MeshBasicMaterial;
} {
  const root = new THREE.Group();
  root.add(buildContactShadow(shadowTex, 1.15, 0.65));
  const pod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.78, 1.55, 8),
    new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.82,
    }),
  );
  pod.position.y = 0.78;
  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 0.24, 8),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.5,
    }),
  );
  glow.position.y = 0.9;
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const zone = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.55, 36), ringMat);
  zone.rotation.x = -Math.PI / 2;
  zone.position.y = 0.04;
  root.add(pod, glow, zone);
  return { root, ringMat };
}

export function buildBreakerSwitchMesh(shadowTex: THREE.CanvasTexture): THREE.Group {
  const root = new THREE.Group();
  root.add(buildContactShadow(shadowTex, 0.8, 0.5));
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 1.35, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.75 }),
  );
  box.position.y = 0.68;
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 10),
    new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 2.6,
    }),
  );
  beacon.position.y = 1.58;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 1.68, 28),
    new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  root.add(box, beacon, ring);
  return root;
}

export function buildBossPowerPylon(shadowTex: THREE.CanvasTexture): THREE.Group {
  const root = new THREE.Group();
  root.add(buildContactShadow(shadowTex, 0.88, 0.65));
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.72, 0.45, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 }),
  );
  base.position.y = 0.225;
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.52, 0),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 2.5,
      roughness: 0.15,
    }),
  );
  crystal.position.y = 1.45;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.18, 24),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  root.add(base, crystal, ring);
  return root;
}

export function applyWeaponCamoToGroup(
  group: THREE.Group,
  camoId: WeaponCamoId,
): void {
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const rawMat = mesh.material;
    if (Array.isArray(rawMat) || !(rawMat instanceof THREE.MeshStandardMaterial)) {
      return;
    }

    if (!mesh.userData.camoBaseMat) {
      mesh.userData.camoBaseMat = rawMat;
      mesh.userData.camoMatClone = rawMat.clone();
    }

    const baseMat = mesh.userData.camoBaseMat as THREE.MeshStandardMaterial;
    const mat = mesh.userData.camoMatClone as THREE.MeshStandardMaterial;
    mesh.material = mat;

    // Copy pristine baseline parameters every time before applying camo finish
    mat.color.copy(baseMat.color);
    mat.emissive.copy(baseMat.emissive);
    mat.emissiveIntensity = baseMat.emissiveIntensity;
    mat.roughness = baseMat.roughness;
    mat.metalness = baseMat.metalness;

    const isAccentGlow = baseMat.emissiveIntensity > 0.4;
    if (camoId === 'none' || isAccentGlow) {
      return;
    }

    if (camoId === 'carbon_fiber') {
      mat.color.setHex(0x1f2937);
      mat.roughness = 0.28;
      mat.metalness = 0.82;
      mat.emissive.setHex(0x334155);
      mat.emissiveIntensity = 0.16;
    } else if (camoId === 'tactical_gold') {
      mat.color.setHex(0xf59e0b);
      mat.roughness = 0.2;
      mat.metalness = 0.94;
      mat.emissive.setHex(0x78350f);
      mat.emissiveIntensity = 0.24;
    } else if (camoId === 'reactive_neon') {
      mat.color.setHex(0x06b6d4);
      mat.roughness = 0.16;
      mat.metalness = 0.88;
      mat.emissive.setHex(0x22d3ee);
      mat.emissiveIntensity = 1.45;
    }
  });
}

export function buildSiegeReactorCoreMesh(shadowTex: THREE.CanvasTexture): {
  group: THREE.Group;
  coreMat: THREE.MeshStandardMaterial;
  crystal: THREE.Mesh;
  ring: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.add(buildContactShadow(shadowTex, 1.85, 0.72));

  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.36,
    metalness: 0.82,
  });
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.38, 0.56, 8),
    pedestalMat,
  );
  base.position.y = 0.28;
  base.castShadow = true;
  base.receiveShadow = true;

  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 1.05, 0.22, 8),
    new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.32,
      metalness: 0.86,
    }),
  );
  collar.position.y = 0.66;

  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x06b6d4,
    emissiveIntensity: 2.3,
    roughness: 0.15,
    metalness: 0.5,
  });
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.68, 1), coreMat);
  crystal.position.y = 1.65;
  crystal.castShadow = true;

  const cap = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.075, 8, 24),
    pedestalMat,
  );
  cap.rotation.x = Math.PI / 2;
  cap.position.y = 1.65;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.52, 1.72, 32),
    new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;

  group.add(base, collar, crystal, cap, ring);
  return { group, coreMat, crystal, ring };
}

export function buildExtractionZoneRig(): {
  root: THREE.Group;
  ringMat: THREE.MeshBasicMaterial;
  chopper: THREE.Group;
  rotor: THREE.Group;
  beaconMat: THREE.MeshBasicMaterial;
} {
  const root = new THREE.Group();

  const padDisk = new THREE.Mesh(
    new THREE.CircleGeometry(3.15, 36),
    new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  padDisk.rotation.x = -Math.PI / 2;
  padDisk.position.y = 0.03;

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const outerRing = new THREE.Mesh(new THREE.RingGeometry(3.05, 3.35, 40), ringMat);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.04;

  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const flarePillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.55, 6.5, 12, 1, true),
    beaconMat,
  );
  flarePillar.position.set(2.3, 3.25, -2.1);

  // Lightweight armored extraction chopper hovering overhead
  const chopper = new THREE.Group();
  chopper.position.set(0, 7.2, 0);
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.78,
  });
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.15, 3.6), hullMat);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 2.8), hullMat);
  tail.position.set(0, 0.25, 2.8);
  const cockpit = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 0.65, 1.1),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    }),
  );
  cockpit.position.set(0, 0.1, -1.75);
  const beaconLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x34d399 }),
  );
  beaconLight.position.set(0, -0.62, 0);

  const rotor = new THREE.Group();
  rotor.position.set(0, 0.78, 0);
  const bladeMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.78,
  });
  const blade1 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.04, 0.24), bladeMat);
  const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 5.6), bladeMat);
  rotor.add(blade1, blade2);

  chopper.add(cabin, tail, cockpit, beaconLight, rotor);
  root.add(padDisk, outerRing, flarePillar, chopper);
  return { root, ringMat, chopper, rotor, beaconMat };
}



