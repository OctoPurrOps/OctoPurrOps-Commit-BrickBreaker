import {VW,VH,ROWS,COLS,TOTAL,C,clamp,hypot,lerp,rnd,LEVELS,targetFor,bestComboGet,bestComboSet,highGet,highSet,pickDailyIndex} from "./data.js";

export const MODE = { BOOT:"BOOT", ATTRACT:"ATTRACT", PLAY:"PLAY", PAUSE:"PAUSE", HELP:"HELP", CLEAR:"CLEAR", FAIL:"FAIL" };

export const S = {
  env:null,
  mode: MODE.BOOT,
  tick: 0,

  level: 0,
  showGhost: true,

  grid: new Array(TOTAL).fill(0),
  waterTile: new Array(TOTAL).fill(false),

  px: VW/2,
  platformY: 262,
  waterLevel: 0,

  aimX: VW/2,
  aimY: VH/2,

  windT: 0,
  bobT: 0,
  recoil: 0,
  cooldown: 0,

  shots: 0,
  ammo: 0,

  bullets: [],
  drops: [],
  streams: [],
  shootAnim: 0,

  combo: 0,
  mult: 1,
  power: null,
  powerT: 0,

  particles: [],
  shake: 0,

  dailyIndex: 0,
  dailyName: "",
  lastError: "",

  hoverLink: false,
  keys: new Set(),
  audioOn: true,
  AC: null
};

export function initGame(env){
  S.env = env;
  S.dailyIndex = pickDailyIndex();
  S.dailyName = LEVELS[S.dailyIndex].name;
  resetLevel(S.dailyIndex);
  setMode(MODE.BOOT);
}

export function setMode(m){ S.mode = m; }

export function rcToIdx(r,c){ return c*ROWS + r; }

export const UI = {
  tile: 6,
  gap: 2,
  gridTop: 64,
  platformW: 230,
  platformH: 10,
  basePlatformY: 262
};

export function gridW(){ return COLS*(UI.tile+UI.gap)-UI.gap; }
export function gridL(){ return Math.floor((VW - gridW())/2); }

export function tileRect(r,c){
  const x = gridL() + c*(UI.tile+UI.gap);
  const y = UI.gridTop + r*(UI.tile+UI.gap);
  return {x,y,w:UI.tile,h:UI.tile};
}

export function scoreNow(){
  const base = Math.max(0, 2600 - S.shots*14 - Math.floor(S.waterLevel)*4);
  return Math.floor(base * S.mult);
}

export function beep(freq=440, dur=0.05, type="square", gain=0.03){
  if(!S.audioOn) return;
  try{
    S.AC ??= new (window.AudioContext || window.webkitAudioContext)();
    const o = S.AC.createOscillator();
    const g = S.AC.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(S.AC.destination);
    o.start();
    o.stop(S.AC.currentTime + dur);
  }catch{}
}

export function resetLevel(i){
  S.level = ((i % LEVELS.length) + LEVELS.length) % LEVELS.length;

  S.grid.fill(0);
  S.waterTile.fill(false);

  for(let c=0;c<COLS;c++){
    for(let r=0;r<ROWS;r++){
      const idx = rcToIdx(r,c);
      const density = 0.06 + Math.min(0.10, S.level*0.0005);
      S.waterTile[idx] = Math.random() < density;
    }
  }

  S.px = VW/2;
  S.platformY = UI.basePlatformY;
  S.waterLevel = 0;

  S.windT = 0;
  S.bobT = 0;
  S.recoil = 0;
  S.cooldown = 0;

  S.shots = 0;
  S.ammo = LEVELS[S.level].ammo ?? 90;

  S.bullets.length = 0;
  S.drops.length = 0;
  S.streams.length = 0;
  S.shootAnim = 0;

  S.combo = 0;
  S.mult = 1;
  S.power = null;
  S.powerT = 0;

  S.particles.length = 0;
  S.shake = 0;
}

export function solved(){
  for(let c=0;c<COLS;c++){
    for(let r=0;r<ROWS;r++){
      const idx = rcToIdx(r,c);
      if(S.grid[idx] !== targetFor(S.level,r,c)) return false;
    }
  }
  return true;
}

export const OCT_SCALE = 3;
export const OCT_SIZE = 32 * OCT_SCALE;
export const OCT_CENTER_Y = 18 * OCT_SCALE;

export function octoPose(){
  const bob = Math.sin(S.tick * 0.10) * 2;
  const sx = Math.floor(S.px - OCT_SIZE/2);
  const sy = Math.floor(S.platformY - OCT_SIZE - 12 + bob);
  return { sx, sy, cx: sx + OCT_SIZE/2, cy: sy + OCT_CENTER_Y };
}

export function aimWobbleX(){
  const slow = (S.power === "SLOW" && S.powerT > 0) ? 0.45 : 1.0;
  const wind = Math.sin(S.windT) * 7.5 * slow;
  const bob  = Math.sin(S.bobT*1.6) * (1.0 + S.waterLevel*0.02) * slow;
  const recoil = S.recoil * 14 * slow;
  return wind + bob + recoil;
}

export function pointInRect(x,y,r){ return x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h; }

export function spawnStream(x,y){
  S.streams.push({x, y, vy: 2.6 + rnd(0,1.2), life: 64});
  for(let i=0;i<10;i++){
    S.drops.push({ x:x+rnd(-2,2), y:y+rnd(-2,2), vx:rnd(-0.8,0.8), vy:rnd(1.0,2.0), life:rnd(50,95), a:1 });
  }
}

export function addParticles(x,y,n=10){
  for(let i=0;i<n;i++){
    S.particles.push({ x, y, vx:rnd(-1.2,1.2), vy:rnd(-1.4,0.6), life:rnd(18,34) });
  }
}

export function screenShake(a){ S.shake = Math.max(S.shake, a); }

export function bulletHit(b){
  for(let c=0;c<COLS;c++){
    for(let r=0;r<ROWS;r++){
      const tr = tileRect(r,c);
      if(pointInRect(b.x,b.y,tr)){
        const idx = rcToIdx(r,c);
        b.hit = true;

        S.grid[idx] = clamp(S.grid[idx] + (b.mode==="paint"?1:-1), 0, 4);

        S.combo = Math.min(999, S.combo + 1);
        S.mult = 1 + Math.floor(S.combo/6);
        if(S.combo > bestComboGet()) bestComboSet(S.combo);

        screenShake(4);
        addParticles(tr.x + tr.w/2, tr.y + tr.h/2, 10);

        if(!S.power && Math.random() < 0.070){
          const roll = Math.random();
          S.power = roll < 0.45 ? "BURST" : (roll < 0.75 ? "SLOW" : "BOMB");
          S.powerT = (S.power === "SLOW") ? 360 : 0;
          beep(980, 0.06);
        }

        if(S.power === "BOMB"){
          for(let dc=-1; dc<=1; dc++){
            for(let dr=-1; dr<=1; dr++){
              const r2 = clamp(r+dr, 0, ROWS-1);
              const c2 = clamp(c+dc, 0, COLS-1);
              const j = rcToIdx(r2,c2);
              S.grid[j] = clamp(S.grid[j] + (b.mode==="paint"?1:-1), 0, 4);
            }
          }
          S.power = null;
          beep(740,0.05);
        }

        if(S.waterTile[idx]){
          S.waterTile[idx] = false;
          spawnStream(tr.x + tr.w/2, tr.y + tr.h);
          beep(880,0.05,"square",0.02);
        }
        return true;
      }
    }
  }
  return false;
}

export function shoot(mode){
  if(S.mode !== MODE.PLAY) return;
  if(S.cooldown > 0) return;
  if(S.ammo <= 0) { beep(120,0.06); return; }

  const o = octoPose();
  const ox = o.cx, oy = o.cy;

  const wob = aimWobbleX();
  const ax = S.aimX + wob;
  const ay = Math.min(S.aimY, oy - 10);

  let dx = ax - ox, dy = ay - oy;
  const L = hypot(dx,dy) || 1;
  dx/=L; dy/=L;
  if(dy > -0.10) dy = -0.10;

  const baseSpread = 0.095;
  const waterHelp = 1 - (S.waterLevel/100)*0.25;
  const spread = baseSpread * waterHelp;

  dx += (Math.random()*2-1)*spread;
  dy += (Math.random()*2-1)*spread;

  const L2 = hypot(dx,dy) || 1;
  dx/=L2; dy/=L2;

  const speed = 9.8 + rnd(0,0.9);
  const count = (S.power === "BURST") ? 3 : 1;

  for(let i=0;i<count;i++){
    let ddx = dx, ddy = dy;
    if(count === 3){
      const off = (i-1) * 0.10;
      ddx = dx + off;
      ddy = dy;
      const LL = hypot(ddx,ddy) || 1;
      ddx/=LL; ddy/=LL;
    }
    S.bullets.push({x:ox, y:oy, vx:ddx*speed, vy:ddy*speed, mode, life: 92, hit:false});
  }
  if(S.power === "BURST") S.power = null;

  S.ammo--;
  S.shots++;
  S.cooldown = 6;
  S.recoil = clamp(S.recoil + 0.24, 0, 1);
  S.shootAnim = 8;

  beep(mode==="paint" ? 640 : 240, 0.03, "square", 0.02);
}

export function update(){
  S.tick++;

  if(S.mode === MODE.BOOT){
    if(S.tick === 10) beep(240,0.05);
    if(S.tick === 30) beep(360,0.05);
    if(S.tick === 50) beep(480,0.05);
    if(S.tick === 70) beep(600,0.05);
    if(S.tick > 150){
      setMode(MODE.ATTRACT);
      beep(880,0.07);
    }
  }

  if(S.power === "SLOW" && S.powerT > 0){
    S.powerT--;
    if(S.powerT === 0) S.power = null;
  }

  for(const p of S.particles){
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.06;
    p.life--;
  }
  S.particles = S.particles.filter(p => p.life > 0);

  if(S.mode === MODE.PLAY){
    const half = OCT_SIZE/2 + 4;
    let dir = 0;
    if(S.keys.has("arrowleft") || S.keys.has("a")) dir -= 1;
    if(S.keys.has("arrowright") || S.keys.has("d")) dir += 1;
    S.px = clamp(S.px + dir*5.0, half, VW-half);

    S.bobT += 0.06;
    S.windT += 0.03;
    S.recoil = lerp(S.recoil, 0, 0.08);
    if(S.cooldown > 0) S.cooldown--;
    if(S.shootAnim > 0) S.shootAnim--;

    const floatUp = clamp(S.waterLevel, 0, 100) * 0.40;
    const bob = Math.sin(S.bobT) * (1.0 + S.waterLevel*0.02);
    S.platformY = lerp(S.platformY, UI.basePlatformY - floatUp + bob, 0.12);

    for(const b of S.bullets){
      b.x += b.vx; b.y += b.vy;
      b.life--;
      if(bulletHit(b)) b.life = 0;
    }

    const before = S.bullets.length;
    const anyHit = S.bullets.some(b => b.hit);
    S.bullets = S.bullets.filter(b => b.life>0 && b.x>-40 && b.x<VW+40 && b.y>-60 && b.y<VH+90);
    if(before > 0 && S.bullets.length === 0 && !anyHit){
      S.combo = 0;
      S.mult = 1;
    }

    for(const s of S.streams){
      s.y += s.vy;
      s.life--;
      if(Math.random() < 0.55){
        S.drops.push({ x:s.x+rnd(-1,1), y:s.y, vx:rnd(-0.5,0.5), vy:rnd(0.6,1.4), life:rnd(35,65), a:1 });
      }
    }
    S.streams = S.streams.filter(s => s.life>0 && s.y < VH+40);

    for(const d of S.drops){
      d.x += d.vx;
      d.y += d.vy;
      d.vy += 0.06;
      d.life--;
      d.a = clamp(d.life/70, 0, 1);

      if(d.y >= S.platformY && d.y <= S.platformY+UI.platformH && Math.abs(d.x - VW/2) <= UI.platformW/2){
        d.life = 0;
        S.waterLevel = clamp(S.waterLevel + 2.0, 0, 100);
      }
    }
    S.drops = S.drops.filter(d => d.life>0 && d.y < VH+80);

    S.waterLevel = clamp(S.waterLevel - 0.03, 0, 100);

    if(S.ammo <= 0 && !solved()){
      setMode(MODE.FAIL);
      beep(90,0.12,"square",0.03);
    }
  }else{
    S.platformY = lerp(S.platformY, UI.basePlatformY, 0.14);
    S.waterLevel = lerp(S.waterLevel, 0, 0.07);
    if(S.shootAnim > 0) S.shootAnim--;
  }

  S.shake = Math.max(0, S.shake - 0.6);

  if(S.mode === MODE.CLEAR){
    const sc = scoreNow();
    if(sc > highGet()) highSet(sc);
  }
}
