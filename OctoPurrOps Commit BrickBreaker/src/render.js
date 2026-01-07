import {VW,VH,ROWS,COLS,C,clamp,rnd,highGet,bestComboGet,targetFor,GITHUB_LABEL} from "./data.js";
import {S,MODE,UI,gridL,tileRect,octoPose,aimWobbleX,OCT_SCALE} from "./game.js";

function roundedRect(ctx,x,y,w,h,r){
  const rr = Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr,y);
  ctx.arcTo(x+w,y,x+w,y+h,rr);
  ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr);
  ctx.arcTo(x,y,x+w,y,rr);
  ctx.closePath();
}
function text(ctx,x,y,t,color,size,align="left"){
  ctx.fillStyle = color;
  ctx.font = `${size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillText(t,x,y);
}

export function githubBadgeRect(){
  return { x: 18, y: 30, w: 210, h: 16 };
}

const GH_ICON_9 = [
  "001111100",
  "011111110",
  "111001111",
  "111111111",
  "111111111",
  "111111111",
  "011111110",
  "001111100",
  "000110000"
];

function drawPixelIcon9(ctx,x,y,scale,fill,stroke){
  if(stroke){
    ctx.fillStyle = stroke;
    for(let yy=0; yy<9; yy++){
      for(let xx=0; xx<9; xx++){
        if(GH_ICON_9[yy][xx] === "1"){
          ctx.fillRect(x + (xx*scale)-1, y + (yy*scale), scale, scale);
          ctx.fillRect(x + (xx*scale)+1, y + (yy*scale), scale, scale);
          ctx.fillRect(x + (xx*scale), y + (yy*scale)-1, scale, scale);
          ctx.fillRect(x + (xx*scale), y + (yy*scale)+1, scale, scale);
        }
      }
    }
  }
  ctx.fillStyle = fill;
  for(let yy=0; yy<9; yy++){
    for(let xx=0; xx<9; xx++){
      if(GH_ICON_9[yy][xx] === "1"){
        ctx.fillRect(x + xx*scale, y + yy*scale, scale, scale);
      }
    }
  }
}

function pxCircle(ctx,cx,cy,r,color){
  ctx.fillStyle = color;
  for(let y=-r; y<=r; y++){
    for(let x=-r; x<=r; x++){
      if(x*x + y*y <= r*r) ctx.fillRect((cx+x)|0, (cy+y)|0, 1, 1);
    }
  }
}
function pxOutline(ctx,drawFn,outlineColor){
  const off = [[-1,0],[1,0],[0,-1],[0,1]];
  for(const [dx,dy] of off){
    ctx.save(); ctx.translate(dx,dy); drawFn(outlineColor); ctx.restore();
  }
}
function drawOctoPlush(ctx,frame){
  const OUT = "#061018";
  const B1  = "#36c8ff";
  const B2  = "#1690c9";
  const P1  = "#a855f7";
  const P2  = "#7c3aed";
  const W   = "#e2f2ff";
  const K   = "#0b0f14";

  const cx = 16, cy = 14;
  const wig = Math.sin(frame * 0.22) * 1.0;

  const silhouette = (col) => {
    pxCircle(ctx,cx, cy, 10, col);
    for(let i=0;i<8;i++){
      const a = (i/8) * Math.PI * 2;
      const tx = cx + Math.cos(a) * (11 + (i%2?0.5:-0.5));
      const ty = cy + 9 + Math.sin(a) * (4.5 + wig);
      pxCircle(ctx,tx, ty, 4, col);
    }
  };

  pxOutline(ctx,silhouette, OUT);

  pxCircle(ctx,cx, cy, 10, B1);
  pxCircle(ctx,cx+2, cy+2, 8, B2);

  pxCircle(ctx,cx, cy+10, 6, P1);
  pxCircle(ctx,cx+1, cy+11, 5, P2);

  for(let i=0;i<8;i++){
    const a = (i/8) * Math.PI * 2;
    const tx = cx + Math.cos(a) * (11 + (i%2?0.5:-0.5));
    const ty = cy + 9 + Math.sin(a) * (4.5 + wig);
    pxCircle(ctx,tx, ty, 4, B1);
    pxCircle(ctx,tx + (Math.cos(a)>0?1:-1), ty+1, 2, P1);
  }

  const blink = (Math.floor(frame) % 120) < 8;
  if(!blink){
    pxCircle(ctx,cx-4, cy-1, 2, K);
    pxCircle(ctx,cx+4, cy-1, 2, K);
    ctx.fillStyle = W;
    ctx.fillRect(cx-5, cy-2, 1, 1);
    ctx.fillRect(cx+3, cy-2, 1, 1);
  }else{
    ctx.fillStyle = K;
    ctx.fillRect(cx-6, cy-1, 4, 1);
    ctx.fillRect(cx+2, cy-1, 4, 1);
  }

  ctx.fillStyle = K;
  ctx.fillRect(cx-1, cy+1, 2, 1);
  ctx.fillRect(cx-2, cy+2, 1, 1);
  ctx.fillRect(cx+1, cy+2, 1, 1);
}

function drawCabinetBG(ctx){
  ctx.clearRect(0,0,VW,VH);
  ctx.fillStyle = C.panel;
  ctx.fillRect(0,0,VW,VH);

  const g = ctx.createLinearGradient(0,0,0,VH);
  g.addColorStop(0, "rgba(22,27,34,0.95)");
  g.addColorStop(1, "rgba(11,18,32,0.95)");
  ctx.fillStyle = g;
  ctx.fillRect(6,6,VW-12,VH-12);

  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  roundedRect(ctx,6,6,VW-12,VH-12,10);
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,0.12)";
  for(let y=8;y<VH-8;y+=3) ctx.fillRect(8,y,VW-16,1);
}

function drawGithubBadge(ctx){
  const r = githubBadgeRect();
  ctx.fillStyle = S.hoverLink ? "rgba(88,166,255,0.14)" : "rgba(148,163,184,0.10)";
  roundedRect(ctx,r.x, r.y, r.w, r.h, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(48,54,61,0.85)";
  ctx.lineWidth = 1;
  ctx.stroke();

  drawPixelIcon9(ctx,r.x+6, r.y+3, 1, "#c9d1d9", "#0b0f14");
  text(ctx,r.x + 20, r.y + 3, `github.com/${GITHUB_LABEL}`, C.text, 9, "left");
}

function drawTopHUD(ctx){
  ctx.fillStyle = "rgba(13,17,23,0.85)";
  roundedRect(ctx,12,10,VW-24,44,8);
  ctx.fill();
  ctx.strokeStyle = "rgba(48,54,61,0.9)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  roundedRect(ctx,12,10,VW-24,44,8);
  ctx.clip();

  text(ctx,22,16,"COMMIT BRICKBREAKER", C.text, 12, "left");

  const line1 = `L:${S.level+1}/${S.env.levelCount}  Ammo:${S.ammo}  Score:${S.env.score()}`;
  const line2 = `x${S.mult} C:${S.combo}  ${S.power ? "PWR:"+S.power : "PWR:-"}  High:${highGet()}`;
  text(ctx,VW-22,16,line1,C.muted,9,"right");
  text(ctx,VW-22,28,line2,C.muted,9,"right");

  drawGithubBadge(ctx);

  ctx.restore();
}

function drawLegend(ctx,x,y){
  text(ctx,x, y, "Less", C.muted, 9, "left");
  const s = 7, g = 3;
  for(let i=1;i<=4;i++){
    ctx.fillStyle = C.g[i];
    roundedRect(ctx,x + 28 + (i-1)*(s+g), y+1, s, s, 2);
    ctx.fill();
  }
  text(ctx,x + 28 + 4*(s+g) + 3, y, "More", C.muted, 9, "left");
}

function drawGrid(ctx){
  text(ctx,gridL(),56,"Contributions",C.muted,9,"left");
  drawLegend(ctx,gridL() + 120, 56);

  for(let c=0;c<COLS;c++){
    for(let r=0;r<ROWS;r++){
      const idx = c*ROWS + r;
      const tr = tileRect(r,c);
      const val = S.grid[idx];

      ctx.fillStyle = C.g[val];
      roundedRect(ctx,tr.x,tr.y,tr.w,tr.h,2);
      ctx.fill();

      if(val === 0){
        ctx.strokeStyle = "rgba(48,54,61,0.9)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if(S.mode === MODE.PLAY && S.waterTile[idx]){
        ctx.fillStyle = "rgba(56,189,248,0.35)";
        ctx.fillRect(tr.x + tr.w - 2, tr.y + 1, 1, 1);
      }

      if(S.showGhost && (S.mode===MODE.PLAY || S.mode===MODE.PAUSE)){
        const t = targetFor(S.level,r,c);
        if(t > 0){
          ctx.fillStyle = C.ghost;
          roundedRect(ctx,tr.x+1,tr.y+1,tr.w-2,tr.h-2,2);
          ctx.fill();
        }
      }
    }
  }
}

function drawPlatform(ctx){
  ctx.fillStyle = C.platform;
  roundedRect(ctx,VW/2 - UI.platformW/2, S.platformY, UI.platformW, UI.platformH, 5);
  ctx.fill();

  const fill = clamp(S.waterLevel/100, 0, 1);
  ctx.fillStyle = "rgba(56,189,248,0.18)";
  roundedRect(ctx,VW/2 - UI.platformW/2, S.platformY, Math.floor(UI.platformW*fill), UI.platformH, 5);
  ctx.fill();
}

function drawAim(ctx){
  if(S.mode !== MODE.PLAY) return;
  const o = octoPose();
  const wob = aimWobbleX();
  const ax = S.aimX + wob;
  const ay = Math.min(S.aimY, o.cy - 10);

  ctx.strokeStyle = C.aim;
  ctx.lineWidth = 2;
  ctx.setLineDash([6,6]);
  ctx.beginPath();
  ctx.moveTo(o.cx, o.cy);
  ctx.lineTo(ax, ay);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.arc(ax, ay, 5, 0, Math.PI*2);
  ctx.stroke();
}

function drawBullets(ctx){
  for(const b of S.bullets){
    ctx.fillStyle = (b.mode==="paint") ? C.paint : C.erase;
    ctx.beginPath();
    ctx.arc(b.x,b.y,2.2,0,Math.PI*2);
    ctx.fill();
  }
}

function drawWaterFX(ctx){
  for(const s of S.streams){
    ctx.strokeStyle = "rgba(56,189,248,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + Math.sin(S.tick*0.15)*2, s.y + 30);
    ctx.stroke();
  }

  for(const d of S.drops){
    ctx.fillStyle = `rgba(56,189,248,${0.18 + 0.75*d.a})`;
    ctx.beginPath();
    ctx.arc(d.x, d.y, 1.8, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawParticles(ctx){
  for(const p of S.particles){
    ctx.fillStyle = "rgba(250,204,21,0.75)";
    ctx.fillRect(p.x|0, p.y|0, 1, 1);
  }
}

function drawOctopus(ctx){
  const o = octoPose();

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(S.px, S.platformY - 2, 26, 8, 0, 0, Math.PI*2);
  ctx.fill();

  if(S.shootAnim > 0){
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.arc(o.cx, o.cy, 3.2, 0, Math.PI*2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(o.sx, o.sy);
  ctx.scale(OCT_SCALE, OCT_SCALE);
  drawOctoPlush(ctx, S.tick);
  ctx.restore();
}

function drawBottomHints(ctx){
  text(ctx,14, VH-26, "A/D move | Click/Space paint | Shift/RightClick erase", C.muted, 8, "left");
  text(ctx,14, VH-14, "Enter check/start | P pause | G ghost | H help | Esc menu | M sound", C.muted, 8, "left");
}

function drawOverlay(ctx){
  if(S.lastError){
    text(ctx,VW/2,108,"ERROR",C.text,18,"center");
    text(ctx,VW/2,132,S.lastError.slice(0,46),C.muted,10,"center");
    text(ctx,VW/2,150,"Open DevTools Console for details",C.muted,10,"center");
    return;
  }

  if(S.mode === MODE.BOOT){
    text(ctx,VW/2,118,"BOOTING ARCADE BOARD...",C.text,14,"center");
    if(S.tick > 110) text(ctx,VW/2,138,"INSERT COIN: CLICK / PRESS ENTER",C.muted,10,"center");
    return;
  }

  if(S.mode === MODE.ATTRACT){
    text(ctx,VW/2,104,"INSERT COIN",C.text,18,"center");
    if((Math.floor(S.tick/20)%2)===0) text(ctx,VW/2,128,"PRESS ENTER / CLICK TO START",C.muted,10,"center");
    text(ctx,VW/2,146,`DAILY: ${S.dailyName}`,C.muted,10,"center");
    text(ctx,VW/2,162,`HIGH: ${highGet()}  |  BEST COMBO: ${bestComboGet()}`,C.muted,10,"center");
    text(ctx,VW/2,180,"H: HELP  |  M: SOUND  |  G: GHOST",C.muted,10,"center");
    return;
  }

  if(S.mode === MODE.HELP){
    text(ctx,VW/2,100,"HOW TO PLAY",C.text,18,"center");
    const lines = [
      "Goal: match the word on the contributions grid.",
      "Paint raises intensity (0..4). Erase lowers it.",
      "Combo gives multiplier. Powerups: BURST / SLOW / BOMB.",
      "ENTER checks the pattern (no timer)."
    ];
    let y = 126;
    for(const ln of lines){ text(ctx,VW/2,y,ln,C.text,10,"center"); y += 14; }
    text(ctx,VW/2,y+10,"PRESS ENTER / H TO RETURN",C.muted,10,"center");
    return;
  }

  if(S.mode === MODE.PAUSE){
    text(ctx,VW/2,118,"PAUSED",C.text,18,"center");
    text(ctx,VW/2,142,"PRESS P TO RESUME",C.muted,10,"center");
    return;
  }

  if(S.mode === MODE.CLEAR){
    text(ctx,VW/2,108,"STAGE CLEAR",C.text,18,"center");
    text(ctx,VW/2,132,`SCORE: ${S.env.score()}  |  HIGH: ${highGet()}`,C.muted,10,"center");
    text(ctx,VW/2,150,"PRESS ENTER (NEXT LEVEL)",C.muted,10,"center");
    return;
  }

  if(S.mode === MODE.FAIL){
    text(ctx,VW/2,108,"OUT OF AMMO",C.text,18,"center");
    text(ctx,VW/2,132,"PRESS ENTER TO RETRY",C.muted,10,"center");
    return;
  }
}

export function present(){
  const ctx2 = S.env.ctx;

  drawCabinetBG(ctx2);

  ctx2.save();
  if(S.shake > 0) ctx2.translate(rnd(-S.shake, S.shake), rnd(-S.shake, S.shake));

  drawTopHUD(ctx2);
  drawGrid(ctx2);
  drawAim(ctx2);
  drawWaterFX(ctx2);
  drawBullets(ctx2);
  drawParticles(ctx2);
  drawPlatform(ctx2);
  drawOctopus(ctx2);
  drawBottomHints(ctx2);
  drawOverlay(ctx2);

  ctx2.restore();

  const screen = S.env.screen;
  screen.save();
  screen.imageSmoothingEnabled = false;
  screen.clearRect(0,0,S.env.canvas.width,S.env.canvas.height);
  screen.drawImage(S.env.buf, 0, 0, S.env.canvas.width, S.env.canvas.height);
  screen.restore();
}
