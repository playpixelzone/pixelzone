import { UPGRADE_DEFINITIONS } from './upgrades.js';

/** Spiel-Root (`games/necromancer-idle/`) — Icons als `./icon_skeleton.png` o. ä. */
export const SHOP_ASSET_BASE = new URL('../', import.meta.url).href;

/** Fallback, falls neue Upgrades ohne Eintrag hinzukommen */
const PPS_FALLBACK_POOL = [
  'icon_skeleton.png',
  'icon_ghoul_head.png',
  'icon_golem_head.png',
  'skull_top.png',
  'runestone_texture.png',
];

const PPC_FALLBACK_POOL = [
  'icon_bone_blades.png',
  'icon_bone_blades1.png',
  'icon_bone.png',
  'icon_confirm.png',
  'runestone_texture.png',
];

/**
 * Thematische Zuordnung: Generatoren (Untote, Kolosse, Magie, …) /
 * Klick-Upgrades (Waffen, Rituale, Siegel, …).
 */
const OVERRIDES = {
  // —— PPS Kern ——
  skeletonScraper: 'icon_skeleton.png',
  ghoul: 'icon_ghoul_head.png',
  boneGolem: 'icon_golem_head.png',
  // —— PPS spät ——
  bansheeChoir: 'skull_top.png',
  bloodMage: 'runestone_texture.png',
  necropolis: 'icon_confirm.png',
  soulReaper: 'skull_bottom.png',
  shadowDragon: 'icon_golem_head.png',
  lichKing: 'skull_top.png',
  boneTitan: 'icon_golem_head.png',
  graveWarden: 'icon_skeleton.png',
  boneWurm: 'icon_bone_blades.png',
  soulLantern: 'icon_confirm.png',
  wailLegion: 'icon_ghoul_head.png',
  ashPriest: 'runestone_texture.png',
  tombColossus: 'icon_golem_head.png',
  starCorpse: 'skull_bottom.png',
  abyssCatalyst: 'runestone_texture.png',
  worldRot: 'icon_ghoul_head.png',
  elderLich: 'skull_top.png',
  boneDeity: 'icon_golem_head.png',
  voidHerald: 'runestone_texture.png',
  catacombHeart: 'icon_bone.png',
  ossuaryThrone: 'skull_top.png',
  endBone: 'icon_confirm.png',
  // —— PPC Kern ——
  boneBlade: 'icon_bone_blades.png',
  soulFocus: 'icon_bone.png',
  // —— PPC spät ——
  ritualDagger: 'icon_bone_blades1.png',
  bloodPact: 'icon_bone.png',
  curseOfWeakness: 'icon_ghoul_head.png',
  necronomiconPage: 'runestone_texture.png',
  ghostGauntlet: 'icon_skeleton.png',
  essenceSiphon: 'icon_confirm.png',
  marrowCrown: 'skull_top.png',
  fingerBone: 'icon_bone.png',
  graveSigil: 'runestone_texture.png',
  soulShred: 'icon_ghoul_head.png',
  brittleHex: 'skull_bottom.png',
  ossuaryKey: 'icon_bone_blades1.png',
  wailFocus: 'icon_confirm.png',
  ashCircle: 'runestone_texture.png',
  tombBrand: 'skull_bottom.png',
  starGrasp: 'icon_bone_blades.png',
  abyssTouch: 'icon_ghoul_head.png',
  voidNail: 'icon_bone_blades1.png',
  worldBite: 'icon_golem_head.png',
  elderMark: 'runestone_texture.png',
  boneScript: 'icon_bone.png',
  throneEdge: 'icon_bone_blades1.png',
  endClick: 'icon_confirm.png',
};

function buildUpgradeIconPaths() {
  const map = { ...OVERRIDES };
  let pi = 0;
  let qi = 0;
  for (const def of UPGRADE_DEFINITIONS) {
    if (map[def.id]) continue;
    if (def.type === 'PPS') {
      map[def.id] = PPS_FALLBACK_POOL[pi % PPS_FALLBACK_POOL.length];
      pi++;
    } else {
      map[def.id] = PPC_FALLBACK_POOL[qi % PPC_FALLBACK_POOL.length];
      qi++;
    }
  }
  return map;
}

export const UPGRADE_ICON_PATHS = buildUpgradeIconPaths();
