/**
 * Einmaliges Skript: erzeugt wordlists.js aus Hunspell + Häufigkeitsliste.
 * Aufruf: node build-wordlists.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIC_FILES = [
  '_de_DE_frami.dic',
  '_de_AT_frami.dic',
  '_de_CH_frami.dic',
].map((f) => path.join(__dirname, f));

const FREQ = path.join(__dirname, '_de_50k.txt');
const VERBOTEN_FILE = path.join(__dirname, 'verboten.txt');

function loadVerbotenFromFile() {
  if (!fs.existsSync(VERBOTEN_FILE)) return new Set();
  const raw = fs.readFileSync(VERBOTEN_FILE, 'utf8');
  const s = new Set();
  for (const line of raw.split(/\r?\n/)) {
    const w = line.split('#')[0].trim();
    if (!w || w.startsWith('#')) continue;
    if (w.length !== 5) continue;
    if (!/^[A-Za-z]{5}$/.test(w)) continue;
    s.add(w.toUpperCase());
  }
  return s;
}

// Zusätzliche typische Vornamen / Doppelungen aus dem Wörterbuch (5 Buchst., A–Z)
const NAMEN_ZUSATZ_RAW = `
AHMET AKBAR ALFIO ANIKA ANSEL ARMIN ASTRA AUGIE AVRIL BASIL BETTY BRITA BRUCE BRUNO CAREL CECEL CHLOE
CORIN CYRIL DAGNY DANNY DENIS DEREK DORIS EMILE EMILY ENRIC ERICH ERWIN FABIO FELIX FIONA FRIDA GREGO
GUIDO HEATH HOLLY JANUS JARED JENNA JONNY JOSHI KARIM KEITH LORIS LUCAS MANON MARTY MAURI MERCY MICKY
MINDY MOLLY NADIA NICKY NIKKI OLIVA OLLIE PATSY PAULO PENNY QUINN REBEC RICKY RILEY RISHI SALLY SAMMY
SANDY SELMA SHANE SHAWN SILKE STACY SUSAN TAMMY TERRY TIMMY TRACY VIOLA WAYNE
`.trim().split(/\s+/).map((w) => w.toUpperCase()).filter((w) => /^[A-Z]{5}$/.test(w));

function parseHunspell5AsciiFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const found = new Set();
  const re5 = /^[A-Za-z]{5}$/;
  for (let i = 1; i < lines.length; i++) {
    let w = lines[i].split('/')[0].split('\t')[0].trim();
    if (!w || w.length !== 5) continue;
    if (!re5.test(w)) continue;
    if (/[äöüÄÖÜß]/.test(w)) continue;
    found.add(w.toUpperCase());
  }
  return found;
}

function parseHunspell5AsciiAll() {
  const valid = new Set();
  for (const f of DIC_FILES) {
    if (!fs.existsSync(f)) continue;
    for (const w of parseHunspell5AsciiFile(f)) valid.add(w);
  }
  return valid;
}

function loadFrequencyOrder() {
  const raw = fs.readFileSync(FREQ, 'utf8');
  const words = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const w = line.split(/\s+/)[0].toLowerCase();
    if (w) words.push(w);
  }
  return words;
}

/** Alle 5-Buchstaben-A–Z-Formen aus dem Sprachkorpus (Filter gegen reine Lexikon-Eigen-/Fachwörter) */
function loadKorpus5Ascii() {
  const raw = fs.readFileSync(FREQ, 'utf8');
  const s = new Set();
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const w = line.split(/\s+/)[0].toLowerCase();
    if (!w || w.length !== 5) continue;
    if (!/^[a-z]{5}$/.test(w)) continue;
    if (/[äöüß]/.test(w)) continue;
    s.add(w.toUpperCase());
  }
  return s;
}

const VERBOTEN = loadVerbotenFromFile();
for (const w of NAMEN_ZUSATZ_RAW) VERBOTEN.add(w);

const valid = parseHunspell5AsciiAll();
valid.add('LEGAT');

const freq = loadFrequencyOrder();
const loesung = [];
const seenL = new Set();

for (const w of freq) {
  if (w.length !== 5) continue;
  if (!/^[a-z]{5}$/.test(w)) continue;
  if (/[äöüß]/.test(w)) continue;
  const W = w.toUpperCase();
  if (!valid.has(W)) continue;
  if (VERBOTEN.has(W)) continue;
  if (seenL.has(W)) continue;
  seenL.add(W);
  loesung.push(W);
  if (loesung.length >= 680) break;
}

if (!loesung.includes('LEGAT')) loesung.push('LEGAT');

const korpus5 = loadKorpus5Ascii();

// Nur Wörter, die im Korpus vorkommen UND im Hunspell stehen: weniger Eigennamen/Fachlexikon
const gueltigArr = [...valid]
  .filter((w) => korpus5.has(w) && !VERBOTEN.has(w))
  .sort();

const gueltigSetCheck = new Set(gueltigArr);
for (const w of loesung) {
  if (!gueltigSetCheck.has(w)) {
    console.error('Konsistenz: Lösungswort fehlt in GUELTIGE_WOERTER:', w);
    process.exitCode = 1;
  }
}

const verbotenArr = [...VERBOTEN].sort();

let out = `'use strict';
// Automatisch generiert (build-wordlists.mjs): Hunspell, nur 5 Buchstaben A–Z
// LOESUNGSWOERTER: Korpus + Hunspell, ohne verboten.txt
// GUELTIGE_WOERTER: (Hunspell ∩ Korpus de_50k) minus verboten.txt — keine reinen Lexikon-Sonderformen
// VERBOTENE_WOERTER: explizite Sperre + Meldung im Spiel

const LOESUNGSWOERTER = ${JSON.stringify(loesung)};

const VERBOTENE_WOERTER_ARRAY = ${JSON.stringify(verbotenArr)};
const VERBOTENE_WOERTER = new Set(VERBOTENE_WOERTER_ARRAY);

const GUELTIGE_WOERTER_ARRAY = ${JSON.stringify(gueltigArr)};
const GUELTIGE_WOERTER = new Set(GUELTIGE_WOERTER_ARRAY);
`;

fs.writeFileSync(path.join(__dirname, 'wordlists.js'), out, 'utf8');
console.log('Hunspell 5-buchstabig A–Z (roh):', valid.size);
console.log('Korpus 5 Buchst. A–Z:', korpus5.size);
console.log('Verboten:', VERBOTEN.size);
console.log('Gültige Eingaben (Hunspell ∩ Korpus − Verboten):', gueltigArr.length);
console.log('Lösungswörter:', loesung.length);
console.log('wordlists.js geschrieben.');
