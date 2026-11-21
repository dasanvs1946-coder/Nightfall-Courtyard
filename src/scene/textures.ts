import * as THREE from 'three';

export interface TexturedSurfaceSet {
  map: THREE.CanvasTexture;
  roughnessMap?: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

export function createAsphaltTextures(maxAnisotropy: number): TexturedSurfaceSet {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  // Base dark wet urban asphalt
  ctx.fillStyle = '#171d27';
  ctx.fillRect(0, 0, size, size);

  rCtx.fillStyle = '#c8c8c8';
  rCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Subtle paver/stone joint grid
  const tile = 64;
  ctx.strokeStyle = 'rgba(7, 10, 16, 0.55)';
  ctx.lineWidth = 2;
  bCtx.strokeStyle = '#303030';
  bCtx.lineWidth = 3;

  for (let y = 0; y <= size; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(size, y);
    bCtx.stroke();
  }
  for (let x = 0; x <= size; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(x, 0);
    bCtx.lineTo(x, size);
    bCtx.stroke();
  }

  // Deterministic aggregate speckle for tactile asphalt grain
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 3200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1 + rand() * 2.0;
    const v = 18 + Math.floor(rand() * 28);
    ctx.fillStyle = `rgb(${v}, ${v + 4}, ${v + 10})`;
    ctx.fillRect(x, y, r, r);

    const bv = 105 + Math.floor(rand() * 55);
    bCtx.fillStyle = `rgb(${bv}, ${bv}, ${bv})`;
    bCtx.fillRect(x, y, r, r);
  }

  // Subtle organic damp patches (low roughness for wet streetlamp reflections)
  for (let i = 0; i < 4; i++) {
    const px = rand() * size;
    const py = rand() * size;
    const rad = 75 + rand() * 85;
    const grad = ctx.createRadialGradient(px, py, 10, px, py, rad);
    grad.addColorStop(0, 'rgba(8, 12, 20, 0.34)');
    grad.addColorStop(1, 'rgba(8, 12, 20, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();

    const rGrad = rCtx.createRadialGradient(px, py, 10, px, py, rad);
    rGrad.addColorStop(0, '#363636');
    rGrad.addColorStop(1, 'rgba(200, 200, 200, 0)');
    rGrad.addColorStop(0.55, '#686868');
    rCtx.fillStyle = rGrad;
    rCtx.beginPath();
    rCtx.arc(px, py, rad, 0, Math.PI * 2);
    rCtx.fill();
  }

  // Jagged asphalt stress cracks for urban grit
  ctx.strokeStyle = 'rgba(6, 9, 14, 0.7)';
  ctx.lineWidth = 1.6;
  bCtx.strokeStyle = '#222222';
  bCtx.lineWidth = 2.2;
  for (let c = 0; c < 6; c++) {
    let cx = rand() * size;
    let cy = rand() * size;
    ctx.beginPath();
    bCtx.beginPath();
    ctx.moveTo(cx, cy);
    bCtx.moveTo(cx, cy);
    for (let seg = 0; seg < 6; seg++) {
      cx += (rand() - 0.5) * 44;
      cy += (rand() - 0.5) * 44;
      ctx.lineTo(cx, cy);
      bCtx.lineTo(cx, cy);
    }
    ctx.stroke();
    bCtx.stroke();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(7, 7);
  map.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(7, 7);
  roughnessMap.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(7, 7);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, roughnessMap, bumpMap };
}

export function createSidewalkTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2b323d';
  ctx.fillRect(0, 0, size, size);

  // Concrete slab expansion joints
  ctx.strokeStyle = 'rgba(12, 16, 23, 0.7)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= size; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  let seed = 4242;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 800; i++) {
    const v = 38 + Math.floor(rand() * 20);
    ctx.fillStyle = `rgb(${v}, ${v + 4}, ${v + 9})`;
    ctx.fillRect(rand() * size, rand() * size, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 1);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createCrateTexture(maxAnisotropy: number): TexturedSurfaceSet {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  ctx.fillStyle = '#5c462f';
  ctx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#909090';
  bCtx.fillRect(0, 0, size, size);

  const plankH = size / 4;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#684f36' : '#56412b';
    ctx.fillRect(0, i * plankH, size, plankH - 3);
    ctx.fillStyle = '#261a0f';
    ctx.fillRect(0, (i + 1) * plankH - 3, size, 3);

    bCtx.fillStyle = '#383838';
    bCtx.fillRect(0, (i + 1) * plankH - 3, size, 3);

    // Subtle wood grain lines
    ctx.strokeStyle = 'rgba(30, 20, 10, 0.25)';
    ctx.lineWidth = 1.5;
    for (let g = 0; g < 3; g++) {
      const gy = i * plankH + 12 + g * 16;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(size, gy);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = '#3f2e1d';
  ctx.lineWidth = 22;
  ctx.strokeRect(11, 11, size - 22, size - 22);
  ctx.beginPath();
  ctx.moveTo(16, 16);
  ctx.lineTo(size - 16, size - 16);
  ctx.stroke();

  bCtx.strokeStyle = '#c8c8c8';
  bCtx.lineWidth = 22;
  bCtx.strokeRect(11, 11, size - 22, size - 22);

  // Steel corner brackets
  ctx.fillStyle = '#334155';
  const b = 26;
  ctx.fillRect(0, 0, b, b);
  ctx.fillRect(size - b, 0, b, b);
  ctx.fillRect(0, size - b, b, b);
  ctx.fillRect(size - b, size - b, b, b);

  // Amber military stencil stripe
  ctx.fillStyle = 'rgba(245, 158, 11, 0.78)';
  ctx.fillRect(42, size / 2 - 10, size - 84, 20);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createBrickWallTexture(maxAnisotropy: number): TexturedSurfaceSet {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  // Mortar base
  ctx.fillStyle = '#1b1f27';
  ctx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#404040';
  bCtx.fillRect(0, 0, size, size);

  const rows = 8;
  const cols = 4;
  const rh = size / rows;
  const cw = size / cols;

  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : cw / 2;
    for (let c = -1; c <= cols; c++) {
      const shade = 46 + ((r * 7 + c * 13) % 18);
      ctx.fillStyle = `rgb(${shade + 14}, ${shade + 2}, ${shade - 4})`;
      ctx.fillRect(c * cw + offset + 2, r * rh + 2, cw - 4, rh - 4);

      bCtx.fillStyle = '#c4c4c4';
      bCtx.fillRect(c * cw + offset + 2, r * rh + 2, cw - 4, rh - 4);
    }
  }

  // Bottom damp grime gradient
  const grime = ctx.createLinearGradient(0, size * 0.6, 0, size);
  grime.addColorStop(0, 'rgba(10, 12, 16, 0)');
  grime.addColorStop(1, 'rgba(10, 12, 16, 0.55)');
  ctx.fillStyle = grime;
  ctx.fillRect(0, 0, size, size);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(8, 1.5);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(8, 1.5);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    4,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.34)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createLightPoolTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    2,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, 'rgba(255, 198, 108, 0.42)');
  grad.addColorStop(0.42, 'rgba(245, 158, 11, 0.16)');
  grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBloodSplatTexture(): THREE.CanvasTexture {
  const size = 192;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  // Deep arterial outer halo
  const outer = ctx.createRadialGradient(cx, cy, 8, cx, cy, 62);
  outer.addColorStop(0, 'rgba(135, 10, 16, 0.92)');
  outer.addColorStop(0.55, 'rgba(92, 8, 12, 0.78)');
  outer.addColorStop(0.85, 'rgba(65, 5, 8, 0.45)');
  outer.addColorStop(1, 'rgba(50, 4, 6, 0)');
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(cx, cy, 62, 0, Math.PI * 2);
  ctx.fill();

  // Organic radial lobes & satellite droplets
  ctx.fillStyle = 'rgba(110, 10, 15, 0.84)';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + (i % 2) * 0.14;
    const dist = 36 + (i % 3) * 14;
    const r = 10 + (i % 4) * 4;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine radial micro-droplets
  ctx.fillStyle = 'rgba(130, 14, 18, 0.76)';
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + 0.2;
    const dist = 58 + (i % 4) * 7;
    const r = 3 + (i % 3) * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createPlazaEmblemTexture(
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  // Subtle stone medallion ring backing
  const bg = ctx.createRadialGradient(cx, cy, 40, cx, cy, 240);
  bg.addColorStop(0, 'rgba(30, 41, 59, 0.42)');
  bg.addColorStop(0.75, 'rgba(15, 23, 42, 0.28)');
  bg.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, 240, 0, Math.PI * 2);
  ctx.fill();

  // Outer dashed tactical ring
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.36)';
  ctx.lineWidth = 8;
  ctx.setLineDash([24, 16]);
  ctx.beginPath();
  ctx.arc(cx, cy, 206, 0, Math.PI * 2);
  ctx.stroke();

  // Solid inner border & cardinal ticks
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.26)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 134, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(245, 158, 11, 0.34)';
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((i * Math.PI) / 2);
    ctx.beginPath();
    ctx.moveTo(0, -196);
    ctx.lineTo(-14, -162);
    ctx.lineTo(14, -162);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Subtle stenciled courtyard crosshairs
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 88, cy);
  ctx.lineTo(cx - 32, cy);
  ctx.moveTo(cx + 32, cy);
  ctx.lineTo(cx + 88, cy);
  ctx.moveTo(cx, cy - 88);
  ctx.lineTo(cx, cy - 32);
  ctx.moveTo(cx, cy + 32);
  ctx.lineTo(cx, cy + 88);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createHazardChevronTexture(
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#d97706';
  const stripeW = 32;
  for (let x = -size; x < size * 2; x += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeW, 0);
    ctx.lineTo(x + stripeW - size, size);
    ctx.lineTo(x - size, size);
    ctx.closePath();
    ctx.fill();
  }

  // Weathered grime overlay
  ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createDirectionalSplatterTexture(): THREE.CanvasTexture {
  const size = 192;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Oriented along -Y (canvas top = forward impact spray along -Z on ground plane)
  const cx = size / 2;

  // Main impact smear cone tapering toward top
  const grad = ctx.createLinearGradient(cx, size * 0.85, cx, size * 0.1);
  grad.addColorStop(0, 'rgba(128, 12, 18, 0.92)');
  grad.addColorStop(0.5, 'rgba(105, 10, 14, 0.75)');
  grad.addColorStop(1, 'rgba(72, 6, 10, 0.25)');
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.ellipse(cx, size * 0.68, 22, 34, 0, 0, Math.PI * 2);
  ctx.fill();

  // Forward spray streaks
  const streaks = [
    { x: cx - 10, y1: size * 0.66, y2: size * 0.16, w: 9 },
    { x: cx + 4, y1: size * 0.68, y2: size * 0.08, w: 11 },
    { x: cx + 16, y1: size * 0.65, y2: size * 0.22, w: 7 },
    { x: cx - 22, y1: size * 0.7, y2: size * 0.34, w: 6 },
  ];
  for (const s of streaks) {
    ctx.beginPath();
    ctx.moveTo(s.x - s.w, s.y1);
    ctx.lineTo(s.x + s.w, s.y1);
    ctx.lineTo(s.x + s.w * 0.18, s.y2);
    ctx.lineTo(s.x - s.w * 0.18, s.y2);
    ctx.closePath();
    ctx.fill();
  }

  // Forward flying micro-droplets beyond streaks
  const dots = [
    [cx - 14, size * 0.12, 4.5],
    [cx + 6, size * 0.05, 5],
    [cx + 22, size * 0.17, 4],
    [cx - 28, size * 0.28, 3.5],
    [cx + 30, size * 0.3, 3.5],
  ];
  ctx.fillStyle = 'rgba(125, 12, 18, 0.85)';
  for (const [dx, dy, dr] of dots) {
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
