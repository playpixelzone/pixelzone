/**
 * Pixel-Jump: hochauflösende Pixel-Sprites (24×24), prozedural erzeugt.
 * Wird vor game.js geladen → window.PJ_SPRITES
 */
(function () {
  const G = 24;
  function mk() {
    return Array.from({ length: G }, () => Array(G).fill(0));
  }
  function fillEl(g, cx, cy, rx, ry, v) {
    for (let y = 0; y < G; y++) {
      for (let x = 0; x < G; x++) {
        const nx = (x - cx) / rx;
        const ny = (y - cy) / ry;
        if (nx * nx + ny * ny <= 1) g[y][x] = v;
      }
    }
  }
  function rect(g, x0, y0, w, h, v) {
    for (let y = y0; y < y0 + h && y < G; y++) {
      for (let x = x0; x < x0 + w && x < G; x++) {
        if (x >= 0 && y >= 0) g[y][x] = v;
      }
    }
  }
  function lineThick(g, x0, y0, x1, y1, v, th) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) + 1;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(x0 + (x1 - x0) * t);
      const y = Math.round(y0 + (y1 - y0) * t);
      for (let dy = -th; dy <= th; dy++) {
        for (let dx = -th; dx <= th; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= 0 && xx < G && yy >= 0 && yy < G) g[yy][xx] = v;
        }
      }
    }
  }

  // ── 0 Wolkenball (weich, rund) ──
  const s0 = mk();
  fillEl(s0, 12, 11, 9, 8, 1);
  fillEl(s0, 8, 10, 5, 5, 2);
  fillEl(s0, 15, 9, 5, 5, 2);
  fillEl(s0, 12, 13, 6, 5, 3);

  // ── 1 Tropfen ──
  const s1 = mk();
  for (let y = 4; y < 18; y++) {
    const w = Math.floor((y - 4) * 0.45) + 3;
    for (let x = 12 - w; x <= 12 + w; x++) if (x >= 0 && x < G) s1[y][x] = y < 14 ? 1 : 3;
  }
  fillEl(s1, 12, 17, 4, 3, 2);

  // ── 2 Stern-Silhouette ──
  const s2 = mk();
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 - Math.PI / 2;
    lineThick(s2, 12, 12, 12 + Math.cos(ang) * 10, 12 + Math.sin(ang) * 10, 1, 1);
  }
  fillEl(s2, 12, 12, 3, 3, 2);

  // ── 3 Pilz ──
  const s3 = mk();
  rect(s3, 10, 14, 4, 8, 3);
  fillEl(s3, 12, 9, 10, 6, 1);
  for (let x = 4; x < 20; x++) {
    const d = Math.abs(x - 12);
    if (d < 7) s3[6 + Math.floor(d / 3)][x] = 2;
  }

  // ── 4 Würfel (isometrisch angedeutet) ──
  const s4 = mk();
  rect(s4, 8, 12, 10, 8, 1);
  lineThick(s4, 8, 12, 4, 8, 3, 0);
  lineThick(s4, 18, 12, 14, 8, 3, 0);
  lineThick(s4, 4, 8, 14, 4, 2, 0);
  rect(s4, 10, 6, 8, 6, 2);

  // ── 5 Blitz-Körper ──
  const s5 = mk();
  lineThick(s5, 14, 4, 8, 12, 1, 1);
  lineThick(s5, 8, 12, 16, 12, 1, 1);
  lineThick(s5, 16, 12, 10, 22, 1, 1);
  fillEl(s5, 11, 13, 2, 2, 2);

  // ── 6 Blume ──
  const s6 = mk();
  for (let p = 0; p < 6; p++) {
    const a = (p / 6) * Math.PI * 2;
    fillEl(s6, 12 + Math.cos(a) * 5, 10 + Math.sin(a) * 4, 3.5, 3, 1);
  }
  fillEl(s6, 12, 11, 2.5, 2.5, 3);
  rect(s6, 11, 14, 2, 6, 3);

  // ── 7 Kiesel / Bruchstück ──
  const s7 = mk();
  const pts = [
    [12, 8], [9, 11], [15, 10], [8, 15], [16, 14], [11, 18], [14, 19],
  ];
  for (let k = 0; k < pts.length; k++) {
    fillEl(s7, pts[k][0], pts[k][1], 2.2, 2.2, k % 2 ? 2 : 1);
  }
  lineThick(s7, 8, 20, 16, 16, 3, 1);

  // ── 8 Tim: 16×16 in 24×24 zentriert (Original-Muster) ──
  const TIM16 = [
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 3, 3, 3, 3, 3, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 3, 3, 1, 1, 1, 3, 3, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 3, 2, 1, 1, 1, 2, 3, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 3, 3, 3, 3, 3, 3, 3, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 3, 3, 3, 3, 3, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 4, 4, 4, 4, 4, 4, 4, 1, 0, 0, 0, 0, 0],
    [0, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 0, 0, 0, 0],
    [0, 1, 4, 4, 4, 3, 3, 4, 4, 4, 4, 1, 0, 0, 0, 0],
    [0, 1, 4, 4, 3, 3, 3, 3, 4, 4, 4, 1, 0, 0, 0, 0],
    [0, 0, 1, 4, 4, 4, 4, 4, 4, 4, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  ];
  const s8 = mk();
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (TIM16[y][x]) s8[y + 4][x + 4] = TIM16[y][x];
    }
  }

  // ── 9 Krake / Rund mit Armen ──
  const s9 = mk();
  fillEl(s9, 12, 13, 7, 6, 1);
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    lineThick(s9, 12 + Math.cos(ang) * 3, 13 + Math.sin(ang) * 3, 12 + Math.cos(ang) * 9, 13 + Math.sin(ang) * 9, 3, 0);
  }
  fillEl(s9, 10, 11, 2, 2, 2);
  fillEl(s9, 14, 11, 2, 2, 2);

  // ── 10 Komet ──
  const s10 = mk();
  fillEl(s10, 10, 11, 8, 5, 1);
  for (let i = 0; i < 6; i++) rect(s10, 3 + i, 12 + (i % 2), 2, 2, 2 - (i % 2));
  lineThick(s10, 4, 13, 18, 12, 3, 0);

  // ── 11 Glitch-Block ──
  const s11 = mk();
  for (let b = 0; b < 12; b++) {
    const x = 4 + (b * 7) % 14;
    const y = 5 + (b * 3) % 12;
    rect(s11, x, y, 3 + (b % 2), 2, b % 3 ? 1 : 3);
  }
  rect(s11, 9, 10, 6, 8, 2);

  // ── 12 Maske / Helm ──
  const s12 = mk();
  rect(s12, 7, 8, 10, 12, 1);
  rect(s12, 9, 11, 2, 2, 2);
  rect(s12, 13, 11, 2, 2, 2);
  lineThick(s12, 7, 8, 5, 6, 3, 0);
  lineThick(s12, 17, 8, 19, 6, 3, 0);
  rect(s12, 10, 15, 4, 2, 3);

  // ── 13 Phantom (Kapuze) ──
  const s13 = mk();
  fillEl(s13, 12, 11, 8, 9, 1);
  rect(s13, 8, 6, 8, 5, 3);
  fillEl(s13, 9, 14, 2, 2, 2);
  fillEl(s13, 15, 14, 2, 2, 2);
  rect(s13, 10, 17, 4, 3, 3);

  // ── 14 Obsidian-Kristall ──
  const s14 = mk();
  lineThick(s14, 12, 4, 6, 18, 1, 1);
  lineThick(s14, 12, 4, 18, 18, 1, 1);
  lineThick(s14, 6, 18, 18, 18, 1, 1);
  fillEl(s14, 12, 11, 4, 5, 2);
  for (let i = 0; i < 5; i++) s14[7 + i][11 + (i % 2)] = 5;

  // ── 15 Sternen-Avatar (mythisch) ──
  const s15 = mk();
  fillEl(s15, 12, 12, 8, 10, 1);
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    lineThick(s15, 12, 12, 12 + Math.cos(ang) * 11, 12 + Math.sin(ang) * 11, 5, 0);
  }
  fillEl(s15, 12, 10, 3, 3, 2);
  fillEl(s15, 12, 14, 2, 2, 3);

  // ── 16 Kosmos-Urahn (legendär, Ringe) ──
  const s16 = mk();
  fillEl(s16, 12, 12, 6, 8, 1);
  for (let ring = 0; ring < 3; ring++) {
    const r = 7 + ring * 2;
    for (let a = 0; a < 32; a++) {
      const ang = (a / 32) * Math.PI * 2;
      const x = Math.round(12 + Math.cos(ang) * r);
      const y = Math.round(12 + Math.sin(ang) * r * 0.85);
      if (x >= 0 && x < G && y >= 0 && y < G) s16[y][x] = ring === 1 ? 5 : 4;
    }
  }
  fillEl(s16, 12, 11, 3, 4, 2);
  s16[5][12] = 6;
  s16[18][11] = 6;
  s16[10][6] = 6;

  window.PJ_SPRITES = [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16];
  window.PJ_SKIN_GRID = G;
})();
