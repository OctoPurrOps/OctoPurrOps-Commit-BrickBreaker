export const GITHUB_URL = "https://github.com/OctoPurrOps";
export const GITHUB_LABEL = "OctoPurrOps";

export const VW = 480;
export const VH = 280;

export const ROWS = 7;
export const COLS = 52;
export const TOTAL = ROWS * COLS;

export const C = {
  panel:"#0d1117",
  border:"#30363d",
  text:"#c9d1d9",
  muted:"#8b949e",
  aim:"rgba(88,166,255,0.55)",
  ghost:"rgba(88,166,255,0.18)",
  g:["#161b22","#0e4429","#006d32","#26a641","#39d353"],
  paint:"rgba(57,211,83,0.95)",
  erase:"rgba(248,81,73,0.95)",
  platform:"rgba(148,163,184,0.18)",
  gold:"rgba(250,204,21,0.85)"
};

export const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
export const hypot = (x,y)=>Math.hypot(x,y);
export const lerp  = (a,b,t)=>a+(b-a)*t;
export const rnd   = (a,b)=>a+Math.random()*(b-a);

export function highGet(){ return Number(localStorage.getItem("cb_high") || "0"); }
export function highSet(v){ localStorage.setItem("cb_high", String(v)); }
export function bestComboGet(){ return Number(localStorage.getItem("cb_best_combo") || "0"); }
export function bestComboSet(v){ localStorage.setItem("cb_best_combo", String(v)); }

function dayKey(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
}
function hashStr(s){
  let h = 2166136261;
  for(let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h>>>0);
}

const FONT5x7 = {
  "A":["01110","10001","10001","11111","10001","10001","10001"],
  "B":["11110","10001","10001","11110","10001","10001","11110"],
  "C":["01111","10000","10000","10000","10000","10000","01111"],
  "D":["11110","10001","10001","10001","10001","10001","11110"],
  "E":["11111","10000","10000","11110","10000","10000","11111"],
  "F":["11111","10000","10000","11110","10000","10000","10000"],
  "G":["01111","10000","10000","10111","10001","10001","01111"],
  "H":["10001","10001","10001","11111","10001","10001","10001"],
  "I":["11111","00100","00100","00100","00100","00100","11111"],
  "J":["00001","00001","00001","00001","10001","10001","01110"],
  "K":["10001","10010","10100","11000","10100","10010","10001"],
  "L":["10000","10000","10000","10000","10000","10000","11111"],
  "M":["10001","11011","10101","10101","10001","10001","10001"],
  "N":["10001","11001","10101","10011","10001","10001","10001"],
  "O":["01110","10001","10001","10001","10001","10001","01110"],
  "P":["11110","10001","10001","11110","10000","10000","10000"],
  "Q":["01110","10001","10001","10001","10101","10010","01101"],
  "R":["11110","10001","10001","11110","10100","10010","10001"],
  "S":["01111","10000","10000","01110","00001","00001","11110"],
  "T":["11111","00100","00100","00100","00100","00100","00100"],
  "U":["10001","10001","10001","10001","10001","10001","01110"],
  "V":["10001","10001","10001","10001","01010","01010","00100"],
  "W":["10001","10001","10001","10101","10101","11011","10001"],
  "X":["10001","01010","00100","00100","00100","01010","10001"],
  "Y":["10001","01010","00100","00100","00100","00100","00100"],
  "Z":["11111","00001","00010","00100","01000","10000","11111"],
  "0":["01110","10001","10011","10101","11001","10001","01110"],
  "1":["00100","01100","00100","00100","00100","00100","01110"],
  "2":["01110","10001","00001","00010","00100","01000","11111"],
  "3":["11110","00001","00001","01110","00001","00001","11110"],
  "4":["00010","00110","01010","10010","11111","00010","00010"],
  "5":["11111","10000","10000","11110","00001","00001","11110"],
  "6":["01110","10000","10000","11110","10001","10001","01110"],
  "7":["11111","00001","00010","00100","01000","01000","01000"],
  "8":["01110","10001","10001","01110","10001","10001","01110"],
  "9":["01110","10001","10001","01111","00001","00001","01110"],
  "-":["00000","00000","00000","11111","00000","00000","00000"],
};

const WORDS = [
  "LGTM","SHIPIT","APPROVE","REVIEW","MERGE","REBASE","SQUASH",
  "WIP","NIT","RFC","TODO","FIX","BUG","CI","PR","DOCS","TESTS",
  "HOTFIX","SECURITY","CODEOWNERS","COMMUNITY","OPEN-SOURCE","PULL-REQUEST"
];

function makeWordBmp(word, variant){
  const chars = word.toUpperCase().split("");
  const glyphW = 5, space = 1;
  const fullW = chars.length * (glyphW + space) - space;

  const bmp = Array.from({length:7}, () => "0".repeat(COLS).split(""));
  const start = Math.max(0, Math.floor((COLS - fullW)/2));
  let x0 = start;

  for(const ch of chars){
    const g = FONT5x7[ch] || FONT5x7["-"];
    for(let r=0;r<7;r++){
      for(let x=0;x<glyphW;x++){
        if(g[r][x] === "1"){
          let val = 4;
          if(variant === 1) val = 3;
          if(variant === 2) val = 2 + ((x0+x) % 3);
          const X = x0 + x;
          if(X>=0 && X<COLS) bmp[r][X] = String(val);
        }
      }
    }
    x0 += glyphW + space;
  }
  return bmp.map(row => row.join(""));
}

function buildLevels(){
  const out = [];
  for(const w of WORDS){
    out.push({ name: w,     bmp: makeWordBmp(w, 0), ammo: 95 });
    out.push({ name: w+"+", bmp: makeWordBmp(w, 1), ammo: 85 });
    out.push({ name: w+"*", bmp: makeWordBmp(w, 2), ammo: 75 });
  }
  return out;
}

export const LEVELS = buildLevels();

export function targetFor(level, r, c){
  const s = LEVELS[level].bmp[r] || "";
  const ch = s[c] || "0";
  return clamp(Number(ch), 0, 4);
}

export function pickDailyIndex(){
  const h = hashStr("cb:" + dayKey());
  return h % LEVELS.length;
}
