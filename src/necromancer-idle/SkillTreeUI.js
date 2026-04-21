import {
  buySkillNode,
  canPurchaseSkill,
  formatGameNumber,
  isSkillUnlocked,
} from './GameState.js';
import { SKILL_TREE_NODES, getSkillTreeEdges } from './SkillTreeData.js';

/**
 * SVG + DOM-Skilltree, Tab „Unterwelt“ (viewBox 0..200, kurze Labels, Voll-Infos per CSS-:hover).
 */
export function initSkillTreeUI() {
  const viewport = document.getElementById('skilltree-viewport');
  const canvas = document.getElementById('skilltree-canvas');
  const svg = document.getElementById('skilltree-svg');
  const linesG = document.getElementById('skilltree-lines');
  const nodesHost = document.getElementById('skilltree-nodes');

  if (!viewport || !canvas || !svg || !linesG || !nodesHost) {
    console.warn('[Skilltree] DOM fehlt');
    return;
  }

  if (svg) {
    svg.setAttribute('viewBox', '0 0 200 200');
  }

  const edges = getSkillTreeEdges();

  function lineState(fromId, toId) {
    const fromOk = isSkillUnlocked(fromId);
    const toOk = isSkillUnlocked(toId);
    if (fromOk && toOk) return 'owned';
    if (fromOk && canPurchaseSkill(toId)) return 'purchasable';
    return 'locked';
  }

  function renderLines() {
    linesG.replaceChildren();
    for (const { from, to } of edges) {
      const a = SKILL_TREE_NODES.find((n) => n.id === from);
      const b = SKILL_TREE_NODES.find((n) => n.id === to);
      if (!a || !b) continue;
      const st = lineState(from, to);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(a.x));
      line.setAttribute('y1', String(a.y));
      line.setAttribute('x2', String(b.x));
      line.setAttribute('y2', String(b.y));
      line.setAttribute('class', `skilltree-line skilltree-line--${st}`);
      line.dataset.from = from;
      line.dataset.to = to;
      linesG.appendChild(line);
    }
  }

  function nodeStatus(id) {
    if (isSkillUnlocked(id)) return 'bought';
    if (canPurchaseSkill(id)) return 'purchasable';
    return 'locked';
  }

  function renderNodes() {
    nodesHost.replaceChildren();
    for (const n of SKILL_TREE_NODES) {
      const st = nodeStatus(n.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `skilltree-node skilltree-node--${st}`;
      btn.dataset.nodeId = n.id;
      btn.style.left = `${(n.x / 200) * 100}%`;
      btn.style.top = `${(n.y / 200) * 100}%`;
      const shortLabel = n.labelShort || n.name;
      const inner = document.createElement('span');
      inner.className = 'skilltree-node__inner';
      inner.textContent = shortLabel;

      const tip = document.createElement('span');
      tip.className = 'skilltree-node__hovertip';
      tip.setAttribute('role', 'tooltip');
      tip.innerHTML = `<span class="skilltree-node__hovertip-name">${n.name}</span><span class="skilltree-node__hovertip-path">${n.path} · ${formatGameNumber(
        n.cost,
      )} Essenz</span><span class="skilltree-node__hovertip-fx">${n.effect || ''}</span>`;

      btn.setAttribute('aria-label', `${n.name}, ${n.path}, ${n.cost} Essenz`);
      btn.appendChild(inner);
      btn.appendChild(tip);

      btn.addEventListener('click', () => {
        if (canPurchaseSkill(n.id)) {
          buySkillNode(n.id);
        }
      });

      nodesHost.appendChild(btn);
    }
  }

  function refresh() {
    renderLines();
    renderNodes();
  }

  refresh();
  document.addEventListener('necro-state-changed', refresh);
}
