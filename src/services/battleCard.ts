import { ARENA_SPECS, GAME_MODE_SPECS } from '../game/arenas';
import { SKIN_SPECS } from '../game/career';
import { ArenaId, GameModeId, SkinId } from '../game/types';
import { APP_VERSION } from '../game/version';

export interface BattleCardInput {
  callsign: string;
  clanTag?: string;
  skinId: SkinId;
  mode: GameModeId;
  arena: ArenaId;
  wave: number;
  kills: number;
  bossesKilled: number;
  score: number;
  isNewHighScore: boolean;
}

export async function generateBattleCardBlob(
  input: BattleCardInput,
): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;

  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const skin = SKIN_SPECS[input.skinId];
  const arena = ARENA_SPECS[input.arena];
  const mode = GAME_MODE_SPECS[input.mode];
  const accent = skin.previewAccentHex || '#F59E0B';

  // Background
  ctx.fillStyle = '#090A0F';
  ctx.fillRect(0, 0, width, height);

  // Subtle ambient vignette glow
  const grad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.25,
    40,
    width * 0.5,
    height * 0.28,
    640,
  );
  grad.addColorStop(0, `${accent}33`);
  grad.addColorStop(0.55, '#0F172A44');
  grad.addColorStop(1, '#090A0F00');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Tactical diagonal grid lines
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= width; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 90) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Outer tactical frame
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.lineWidth = 4;
  ctx.strokeRect(42, 42, width - 84, height - 84);

  // Corner L-brackets
  const corners: Array<[number, number, number, number]> = [
    [42, 42, 1, 1],
    [width - 42, 42, -1, 1],
    [42, height - 42, 1, -1],
    [width - 42, height - 42, -1, -1],
  ];
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 7;
  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + sy * 44);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + sx * 44, cy);
    ctx.stroke();
  }

  // Header strip
  ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
  ctx.fillRect(76, 86, width - 152, 64);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(76, 86, width - 152, 64);

  ctx.fillStyle = '#F59E0B';
  ctx.font = '900 26px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(`AFTER-ACTION BATTLE CARD · v${APP_VERSION.replace(/^v/i, '')}`, 102, 118);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '800 24px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('DRGROUP', width - 102, 118);
  ctx.textAlign = 'left';

  // Main Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 72px system-ui, -apple-system, sans-serif';
  ctx.fillText('NIGHTFALL', 76, 224);
  ctx.fillStyle = '#F59E0B';
  ctx.fillText('COURTYARD', 76, 298);

  // Callsign + Skin block
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fillRect(76, 368, width - 152, 180);
  ctx.strokeStyle = `${accent}AA`;
  ctx.lineWidth = 3;
  ctx.strokeRect(76, 368, width - 152, 180);

  // Skin accent stripe
  ctx.fillStyle = accent;
  ctx.fillRect(76, 368, 16, 180);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('SURVIVOR CALLSIGN', 120, 412);

  const cleanClan = (input.clanTag ?? '').trim().toUpperCase();
  const displayCallsign = cleanClan
    ? `[${cleanClan}] ${input.callsign.toUpperCase()}`
    : input.callsign.toUpperCase();

  ctx.fillStyle = '#FFFFFF';
  ctx.font =
    displayCallsign.length > 18
      ? '900 42px monospace'
      : '900 52px monospace';
  ctx.fillText(displayCallsign, 120, 466);

  ctx.fillStyle = accent;
  ctx.font = '800 26px system-ui, -apple-system, sans-serif';
  ctx.fillText(`OPERATIVE SKIN: ${skin.name.toUpperCase()}`, 120, 516);

  // Mode & Arena Row
  const halfCardW = (width - 152 - 24) / 2;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fillRect(76, 574, halfCardW, 128);
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(76, 574, halfCardW, 128);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 20px system-ui, -apple-system, sans-serif';
  ctx.fillText('COMBAT MODE', 102, 610);
  ctx.fillStyle = mode.accentHex;
  ctx.font = '900 32px system-ui, -apple-system, sans-serif';
  ctx.fillText(mode.shortLabel, 102, 658);

  const arenaCardX = 76 + halfCardW + 24;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fillRect(arenaCardX, 574, halfCardW, 128);
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.7)';
  ctx.strokeRect(arenaCardX, 574, halfCardW, 128);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 20px system-ui, -apple-system, sans-serif';
  ctx.fillText('ARENA ZONE', arenaCardX + 26, 610);
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '900 30px system-ui, -apple-system, sans-serif';
  ctx.fillText(arena.shortLabel, arenaCardX + 26, 658);

  // KPI 2x2 Grid
  const kpis: Array<{ label: string; value: string; color: string }> = [
    { label: 'WAVE REACHED', value: String(input.wave), color: '#38BDF8' },
    { label: 'TOTAL KILLS', value: input.kills.toLocaleString(), color: '#F8FAFC' },
    { label: 'BOSSES SLAIN', value: String(input.bossesKilled), color: '#EF4444' },
    {
      label: input.isNewHighScore ? 'NEW RECORD SCORE' : 'FINAL SCORE',
      value: input.score.toLocaleString(),
      color: '#F59E0B',
    },
  ];

  const kpiTop = 732;
  const kpiH = 210;
  for (let i = 0; i < kpis.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 76 + col * (halfCardW + 24);
    const y = kpiTop + row * (kpiH + 22);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fillRect(x, y, halfCardW, kpiH);
    ctx.strokeStyle =
      i === 3 ? 'rgba(245, 158, 11, 0.75)' : 'rgba(51, 65, 85, 0.8)';
    ctx.lineWidth = i === 3 ? 3 : 2;
    ctx.strokeRect(x, y, halfCardW, kpiH);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '800 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(kpis[i].label, x + 28, y + 48);

    ctx.fillStyle = kpis[i].color;
    ctx.font = '900 70px monospace';
    ctx.fillText(kpis[i].value, x + 28, y + 136);
  }

  // Footer
  ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
  ctx.fillRect(76, height - 144, width - 152, 68);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(76, height - 144, width - 152, 68);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '700 24px monospace';
  ctx.fillText('PLAY NOW: nightfallcourtyard.lovable.app', 102, height - 110);

  ctx.fillStyle = '#F59E0B';
  ctx.font = '900 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('SURVIVE THE BLACKOUT', width - 102, height - 110);
  ctx.textAlign = 'left';

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export async function shareOrDownloadBattleCard(
  input: BattleCardInput,
): Promise<'shared' | 'downloaded' | 'failed'> {
  const blob = await generateBattleCardBlob(input);
  if (!blob) return 'failed';

  const cleanTag = (input.clanTag ?? '').trim().toUpperCase();
  const shareName = cleanTag ? `[${cleanTag}] ${input.callsign}` : input.callsign;
  const summaryText = `Nightfall Courtyard v${APP_VERSION.replace(/^v/i, '')} — ${shareName} survived to Wave ${input.wave} (${input.kills} kills, ${input.score.toLocaleString()} pts) on ${ARENA_SPECS[input.arena].name} [${GAME_MODE_SPECS[input.mode].shortLabel}]! Play at https://nightfallcourtyard.lovable.app`;
  const file = new File(
    [blob],
    `nightfall-battle-card-w${input.wave}.png`,
    { type: 'image/png' },
  );

  try {
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
    };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({
        title: 'Nightfall Courtyard — Battle Card',
        text: summaryText,
        files: [file],
      });
      return 'shared';
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return 'failed';
    }
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nightfall-battle-card-w${input.wave}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(summaryText).catch(() => {});
    }
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
