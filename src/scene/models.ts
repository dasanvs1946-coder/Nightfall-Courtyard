import * as THREE from 'three';
import { CrateKind, WeaponId, ZombieKind } from '../game/types';
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
}

export interface ZombieRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  hitFlashMaterials: THREE.MeshStandardMaterial[];
  telegraphRing: THREE.Mesh | null;
  hpBarGroup: THREE.Group;
  hpBarFill: THREE.Mesh;
}

export function buildContactShadow(
  shadowTex: THREE.CanvasTexture,
  radius: number,
  opacity = 0.55,
): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(radius * 2.2, radius * 2.2);
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

  // Subtle tactical locator ring around survivor's boots
  const footRing = new THREE.Mesh(
    new THREE.RingGeometry(0.54, 0.62, 28),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  footRing.rotation.x = -Math.PI / 2;
  footRing.position.y = 0.025;
  root.add(footRing);

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

  // Shoulder pads
  const padGeo = new THREE.BoxGeometry(0.19, 0.17, 0.31);
  const leftPad = new THREE.Mesh(padGeo, armorMat);
  leftPad.position.set(-0.35, 1.0, 0);
  const rightPad = new THREE.Mesh(padGeo, armorMat);
  rightPad.position.set(0.35, 1.0, 0);
  bodyGroup.add(leftPad, rightPad);

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
    },
    muzzlePoint,
    muzzleFlash,
    flashLight,
    flashlightSpot,
    flashlightCone,
  };
}

export function buildZombieRig(
  kind: ZombieKind,
  shadowTex: THREE.CanvasTexture,
): ZombieRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const hitFlashMaterials: THREE.MeshStandardMaterial[] = [];

  const scale =
    kind === 'boss'
      ? 1.95
      : kind === 'brute'
        ? 1.48
        : kind === 'runner'
          ? 0.94
          : 1.0;
  root.add(buildContactShadow(shadowTex, 0.54 * scale, 0.62));

  const skinColor =
    kind === 'boss'
      ? 0x3b1d2e
      : kind === 'runner'
        ? 0xb91c1c
        : kind === 'brute'
          ? 0x4b5563
          : 0x6b7f5e;
  const clothesColor =
    kind === 'boss'
      ? 0x18181b
      : kind === 'runner'
        ? 0x450a0a
        : kind === 'brute'
          ? 0x1f2937
          : 0x2f3b33;
  const eyeColor =
    kind === 'boss'
      ? 0xf43f5e
      : kind === 'runner'
        ? 0xff2e2e
        : kind === 'brute'
          ? 0xff7b00
          : 0xd9f99d;

  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.72,
    metalness: kind === 'boss' ? 0.18 : 0.04,
  });
  const clothMat = new THREE.MeshStandardMaterial({
    color: clothesColor,
    roughness: 0.85,
    metalness: kind === 'boss' ? 0.3 : 0.05,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: eyeColor,
    emissive: eyeColor,
    emissiveIntensity: kind === 'boss' ? 2.6 : 2.0,
    roughness: 0.2,
  });
  hitFlashMaterials.push(skinMat, clothMat);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.2 * scale, 0.5 * scale, 0.22 * scale);
  const legL = new THREE.Mesh(legGeo, clothMat);
  legL.position.set(-0.14 * scale, 0.25 * scale, 0);
  const legR = new THREE.Mesh(legGeo, clothMat);
  legR.position.set(0.14 * scale, 0.25 * scale, 0);
  bodyGroup.add(legL, legR);

  // Torso (Runners crouch slightly forward)
  const torsoW =
    kind === 'boss'
      ? 0.78 * scale
      : kind === 'brute'
        ? 0.68 * scale
        : 0.48 * scale;
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(torsoW, 0.56 * scale, 0.36 * scale),
    clothMat,
  );
  torso.position.set(0, 0.78 * scale, 0);
  if (kind === 'runner') {
    torso.rotation.x = 0.22;
  }
  torso.castShadow = true;
  bodyGroup.add(torso);

  if (kind === 'runner') {
    // Glowing crimson dorsal spine nodes on Runners
    for (let s = 0; s < 3; s++) {
      const node = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.08), eyeMat);
      node.position.set(0, (0.64 + s * 0.14) * scale, 0.18 * scale);
      bodyGroup.add(node);
    }
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

    const pauldronGeo = new THREE.BoxGeometry(0.34, 0.3, 0.46);
    const pL = new THREE.Mesh(pauldronGeo, armorPlateMat);
    pL.position.set(-0.56, 1.38, 0);
    const pR = new THREE.Mesh(pauldronGeo, armorPlateMat);
    pR.position.set(0.56, 1.38, 0);
    const chestPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.74, 0.44, 0.46),
      armorPlateMat,
    );
    chestPlate.position.set(0, 1.18, -0.05);
    bodyGroup.add(pL, pR, chestPlate);

    // Rebar/concrete club attached to right hand
    const rebarShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1.15, 8),
      rebarMat,
    );
    rebarShaft.rotation.x = Math.PI / 2;
    rebarShaft.position.set(0.45, 1.15, -0.78);
    const concreteHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.28, 0.38),
      rebarMat,
    );
    concreteHead.position.set(0.45, 1.15, -1.25);
    bodyGroup.add(rebarShaft, concreteHead);
  }

  // Boss Overlord Dread Armor, Furnace Core, Spiked Pauldrons & Siege Gauntlets
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
    hitFlashMaterials.push(bossArmorMat, bossTrimMat);

    // Armored breastplate + glowing reactor core
    const breastplate = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.86, 0.78),
      bossArmorMat,
    );
    breastplate.position.set(0, 1.56, -0.04);
    breastplate.castShadow = true;
    const chestCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      coreMat,
    );
    chestCore.position.set(0, 1.58, -0.44);
    bodyGroup.add(breastplate, chestCore);

    // Spiked shoulder pauldrons
    const spikeGeo = new THREE.ConeGeometry(0.11, 0.44, 6);
    for (const side of [-1, 1]) {
      const pauldron = new THREE.Mesh(
        new THREE.BoxGeometry(0.54, 0.42, 0.68),
        bossArmorMat,
      );
      pauldron.position.set(side * 0.92, 1.92, 0);
      pauldron.rotation.z = -side * 0.16;
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(0.58, 0.1, 0.72),
        bossTrimMat,
      );
      trim.position.set(side * 0.92, 1.78, 0);
      const spikeA = new THREE.Mesh(spikeGeo, bossTrimMat);
      spikeA.position.set(side * 0.88, 2.3, -0.14);
      spikeA.rotation.z = -side * 0.25;
      const spikeB = new THREE.Mesh(spikeGeo, bossTrimMat);
      spikeB.position.set(side * 0.98, 2.26, 0.16);
      spikeB.rotation.z = -side * 0.35;
      bodyGroup.add(pauldron, trim, spikeA, spikeB);
    }

    // Back spinal exhaust / crest
    for (let k = 0; k < 3; k++) {
      const vent = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.24, 0.18),
        coreMat,
      );
      vent.position.set(0, 1.25 + k * 0.32, 0.42);
      bodyGroup.add(vent);
    }

    // Crown horns on boss head
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.46, 6),
        bossTrimMat,
      );
      horn.position.set(side * 0.26, 2.68, -0.05);
      horn.rotation.z = -side * 0.55;
      horn.rotation.x = -0.25;
      bodyGroup.add(horn);
    }

    // Heavy siege gauntlets
    const gauntletGeo = new THREE.BoxGeometry(0.38, 0.38, 0.62);
    const gL = new THREE.Mesh(gauntletGeo, bossArmorMat);
    gL.position.set(-0.62, 1.56, -0.88);
    const gR = new THREE.Mesh(gauntletGeo, bossArmorMat);
    gR.position.set(0.62, 1.56, -0.88);
    bodyGroup.add(gL, gR);

    // Subtle crimson ground aura marking Boss Overlord presence
    const aura = new THREE.Mesh(
      new THREE.RingGeometry(1.12, 1.28, 36),
      new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.03;
    root.add(aura);
  }

  // Head + glowing eyes (facing -Z)
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.21 * scale, 12, 10),
    skinMat,
  );
  head.position.set(0, 1.22 * scale, kind === 'runner' ? -0.1 : 0);
  head.castShadow = true;
  bodyGroup.add(head);

  const eyeGeo = new THREE.BoxGeometry(0.065 * scale, 0.045 * scale, 0.05 * scale);
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
  const armGeo = new THREE.BoxGeometry(0.14 * scale, 0.14 * scale, 0.48 * scale);
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(-0.3 * scale, 0.88 * scale, -0.26 * scale);
  const rightArm = new THREE.Mesh(armGeo, skinMat);
  rightArm.position.set(0.3 * scale, 0.88 * scale, -0.26 * scale);
  bodyGroup.add(leftArm, rightArm);

  // Brute & Boss ground slam telegraph ring
  let telegraphRing: THREE.Mesh | null = null;
  if (kind === 'brute' || kind === 'boss') {
    const innerR = kind === 'boss' ? 2.35 : 1.55;
    const outerR = kind === 'boss' ? 2.8 : 1.88;
    const ringGeo = new THREE.RingGeometry(innerR, outerR, 32);
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
  }

  // World-space miniature HP bar (hidden until damaged, always shown on boss)
  const hpBarGroup = new THREE.Group();
  hpBarGroup.position.set(
    0,
    kind === 'boss' ? 3.25 : kind === 'brute' ? 2.45 : 1.82,
    0,
  );
  hpBarGroup.visible = kind === 'boss';
  const barW = kind === 'boss' ? 2.1 : kind === 'brute' ? 1.25 : 0.78;
  const hpBg = new THREE.Mesh(
    new THREE.PlaneGeometry(barW + 0.08, kind === 'boss' ? 0.16 : 0.12),
    new THREE.MeshBasicMaterial({
      color: 0x090d16,
      side: THREE.DoubleSide,
      depthTest: false,
    }),
  );
  const fillGeo = new THREE.PlaneGeometry(barW, kind === 'boss' ? 0.1 : 0.07);
  fillGeo.translate(barW / 2, 0, 0);
  const hpBarFill = new THREE.Mesh(
    fillGeo,
    new THREE.MeshBasicMaterial({
      color:
        kind === 'boss'
          ? 0xf43f5e
          : kind === 'brute'
            ? 0xf59e0b
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
    telegraphRing,
    hpBarGroup,
    hpBarFill,
  };
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
