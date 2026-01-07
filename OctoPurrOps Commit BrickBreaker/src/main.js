import {VW,VH,GITHUB_URL} from "./data.js";
import {S,MODE,initGame,resetLevel,setMode,shoot,solved,scoreNow,beep,update} from "./game.js";
import {present,githubBadgeRect} from "./render.js";

const canvas = document.getElementById("c");
const screen = canvas.getContext("2d");

const buf = document.createElement("canvas");
buf.width = VW; buf.height = VH;
const ctx = buf.getContext("2d");

canvas.addEventListener("contextmenu", (e) => e.preventDefault());

initGame({
  canvas,
  screen,
  buf,
  ctx,
  levelCount: 0,
  score: () => scoreNow()
});

S.env.levelCount = (await import("./data.js")).LEVELS.length;

window.addEventListener("error", (e) => {
  S.lastError = String(e.message || e.error || "Unknown error");
  setMode(MODE.ATTRACT);
});

function inRect(x,y,r){ return x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h; }

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  S.keys.add(k);
  if(["arrowleft","arrowright"," ","enter"].includes(e.key)) e.preventDefault();

  if(k === "m"){ S.audioOn = !S.audioOn; beep(S.audioOn?700:140,0.03); return; }
  if(k === "g"){ S.showGhost = !S.showGhost; beep(520,0.03); return; }
  if(k === "escape"){ if(S.mode !== MODE.BOOT) setMode(MODE.ATTRACT); return; }

  if(k === "p"){
    if(S.mode === MODE.PLAY) setMode(MODE.PAUSE);
    else if(S.mode === MODE.PAUSE) setMode(MODE.PLAY);
    beep(300,0.04);
    return;
  }

  if(k === "h"){
    if(S.mode === MODE.ATTRACT) setMode(MODE.HELP);
    else if(S.mode === MODE.HELP) setMode(MODE.ATTRACT);
    beep(420,0.04);
    return;
  }

  if(e.key === " "){
    if(S.mode === MODE.PLAY) shoot(e.shiftKey ? "erase" : "paint");
    return;
  }

  if(k === "enter"){
    if(S.mode === MODE.ATTRACT){
      resetLevel(S.dailyIndex);
      setMode(MODE.PLAY);
      beep(960,0.07);
      return;
    }
    if(S.mode === MODE.HELP){
      setMode(MODE.ATTRACT);
      beep(220,0.05);
      return;
    }
    if(S.mode === MODE.CLEAR){
      resetLevel(S.level + 1);
      setMode(MODE.PLAY);
      beep(660,0.05);
      return;
    }
    if(S.mode === MODE.FAIL){
      resetLevel(S.level);
      setMode(MODE.PLAY);
      beep(440,0.05);
      return;
    }
    if(S.mode === MODE.PLAY){
      if(solved()){
        setMode(MODE.CLEAR);
        beep(980,0.09);
      }else{
        beep(140,0.05);
      }
    }
  }
});

window.addEventListener("keyup", (e) => S.keys.delete(e.key.toLowerCase()));

canvas.addEventListener("mousemove", (e) => {
  const r = canvas.getBoundingClientRect();
  const mx = (e.clientX - r.left) * (VW / r.width);
  const my = (e.clientY - r.top) * (VH / r.height);

  S.aimX = mx;
  S.aimY = my;

  const br = githubBadgeRect();
  S.hoverLink = inRect(mx,my,br);
  canvas.style.cursor = S.hoverLink ? "pointer" : "default";
});

canvas.addEventListener("mousedown", (e) => {
  const r = canvas.getBoundingClientRect();
  const mx = (e.clientX - r.left) * (VW / r.width);
  const my = (e.clientY - r.top) * (VH / r.height);

  const br = githubBadgeRect();
  if(inRect(mx,my,br)){
    window.open(GITHUB_URL, "_blank", "noopener");
    beep(780,0.05);
    return;
  }

  if(S.mode === MODE.ATTRACT){
    resetLevel(S.dailyIndex);
    setMode(MODE.PLAY);
    beep(960,0.07);
    return;
  }

  if(S.mode === MODE.PLAY){
    shoot(e.button === 2 ? "erase" : "paint");
  }
});

function loop(){
  update();
  present();
  requestAnimationFrame(loop);
}

loop();
