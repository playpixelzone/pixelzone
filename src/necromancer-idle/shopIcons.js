import { UPGRADE_DEFINITIONS } from './upgrades.js';

/** Basis-URL (absolut, wie andere Assets im Spiel) */
export const SHOP_ASSET_BASE = '/src/necromancer-idle/assets';

/** Fallback, falls neue Upgrades ohne Eintrag hinzukommen */
const PPS_FALLBACK_POOL = [
  'sceleton.png',
  'icon-ghoul-head.png',
  'icon-golem-head.png',
  'skull-top.png',
  'runestone-texture.png',
];

const PPC_FALLBACK_POOL = [
  'icon-bone-blades.png',
  'icon-bone-blades1.png',
  'icon-bone.png',
  'icon-confirm.png',
  'runestone-texture.png',
];

/**
 * Thematische Zuordnung: Generatoren (Untote, Kolosse, Magie, …) /
 * Klick-Upgrades (Waffen, Rituale, Siegel, …).
 */
const OVERRIDES = {
  // —— PPS Kern ——
  skeletonScraper: 'sceleton.png',
  ghoul: 'icon-ghoul-head.png',
  boneGolem: 'icon-golem-head.png',
  // —— PPS spät ——
  bansheeChoir: 'skull-top.png',
  bloodMage: 'runestone-texture.png',
  necropolis: 'icon-confirm.png',
  soulReaper: 'skull-bottom.png',
  shadowDragon: 'icon-golem-head.png',
  lichKing: 'skull-top.png',
  boneTitan: 'icon-golem-head.png',
  graveWarden: 'sceleton.png',
  boneWurm: 'icon-bone-blades.png',
  soulLantern: 'icon-confirm.png',
  wailLegion: 'icon-ghoul-head.png',
  ashPriest: 'runestone-texture.png',
  tombColossus: 'icon-golem-head.png',
  starCorpse: 'skull-bottom.png',
  abyssCatalyst: 'runestone-texture.png',
  worldRot: 'icon-ghoul-head.png',
  elderLich: 'skull-top.png',
  boneDeity: 'icon-golem-head.png',
  voidHerald: 'runestone-texture.png',
  catacombHeart: 'icon-bone.png',
  ossuaryThrone: 'skull-top.png',
  endBone: 'icon-confirm.png',
  // —— PPC Kern ——
  boneBlade: 'icon-bone-blades.png',
  soulFocus: 'icon-bone.png',
  // —— PPC spät ——
  ritualDagger: 'icon-bone-blades1.png',
  bloodPact: 'icon-bone.png',
  curseOfWeakness: 'icon-ghoul-head.png',
  necronomiconPage: 'runestone-texture.png',
  ghostGauntlet: 'sceleton.png',
  essenceSiphon: 'icon-confirm.png',
  marrowCrown: 'skull-top.png',
  fingerBone: 'icon-bone.png',
  graveSigil: 'runestone-texture.png',
  soulShred: 'icon-ghoul-head.png',
  brittleHex: 'skull-bottom.png',
  ossuaryKey: 'icon-bone-blades1.png',
  wailFocus: 'icon-confirm.png',
  ashCircle: 'runestone-texture.png',
  tombBrand: 'skull-bottom.png',
  starGrasp: 'icon-bone-blades.png',
  abyssTouch: 'icon-ghoul-head.png',
  voidNail: 'icon-bone-blades1.png',
  worldBite: 'icon-golem-head.png',
  elderMark: 'runestone-texture.png',
  boneScript: 'icon-bone.png',
  throneEdge: 'icon-bone-blades1.png',
  endClick: 'icon-confirm.png',
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
