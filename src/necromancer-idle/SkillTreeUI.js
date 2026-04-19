import {
  GameState,
  buySkillNode,
  canPurchaseSkill,
  formatGameNumber,
  isSkillUnlocked,
} from './GameState.js';
import { SKILL_TREE_NODES, getSkillTreeEdges } from './SkillTreeData.js';

/**
 * SVG + DOM-Skilltree im Tab „Unterwelt“.
 */
export function initSkillTreeUI() {
  const viewport = document.getElementById('skilltree-viewport');
  const canvas = document.getElementById('skilltree-canvas');
  const svg = document.getElementById('skilltree-svg');
  const linesG = document.getElementById('skilltree-lines');
  const nodesHost = document.getElementById('skilltree-nodes');
  const tooltip = document.getElementById('skilltree-tooltip');

  if (!viewport || !canvas || !svg || !linesG || !nodesHost) {
    console.warn('[Skilltree] DOM fehlt');
    return;
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

  function showTooltip(/** @type {MouseEvent} */ e, id) {
    if (!tooltip) return;
    const n = SKILL_TREE_NODES.find((x) => x.id === id);
    if (!n) return;
    const st = nodeStatus(id);
    let statusText = 'Gesperrt';
    if (st === 'bought') statusText = 'Freigeschaltet';
    else if (st === 'purchasable') statusText = 'Kaufbar';
    tooltip.hidden = false;
    const effectHtml = n.effect
      ? `<span class="skilltree-tip-effect">${n.effect}</span><br>`
      : '';
    tooltip.innerHTML = `<strong>${n.name}</strong><br><span class="skilltree-tip-path">${n.path}</span><br>${effectHtml}Welten-Essenz: ${formatGameNumber(n.cost)}<br>Status: ${statusText}`;
    const pad = 12;
    let x = e.clientX + pad;
    let y = e.clientY + pad;
    const tr = tooltip.getBoundingClientRect();
    if (x + tr.width > window.innerWidth - 8) x = e.clientX - tr.width - pad;
    if (y + tr.height > window.innerHeight - 8) y = e.clientY - tr.height - pad;
    tooltip.style.left = `${Math.max(8, x)}px`;
    tooltip.style.top = `${Math.max(8, y)}px`;
  }

  function hideTooltip() {
    if (tooltip) tooltip.hidden = true;
  }

  function renderNodes() {
    nodesHost.replaceChildren();
    for (const n of SKILL_TREE_NODES) {
      const st = nodeStatus(n.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `skilltree-node skilltree-node--${st}`;
      btn.dataset.nodeId = n.id;
      btn.style.left = `${n.x}%`;
      btn.style.top = `${n.y}%`;
      btn.setAttribute('aria-label', `${n.name}, ${n.path}`);
      const inner = document.createElement('span');
      inner.className = 'skilltree-node__inner';
      inner.textContent = n.name.length > 14 ? `${n.name.slice(0, 12)}…` : n.name;
      btn.appendChild(inner);

      btn.addEventListener('mouseenter', (ev) => showTooltip(ev, n.id));
      btn.addEventListener('mousemove', (ev) => showTooltip(ev, n.id));
      btn.addEventListener('mouseleave', hideTooltip);

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
