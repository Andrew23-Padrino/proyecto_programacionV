let cv,ctx,w,h,ship,enemies,bullets,explosions,keys,score,lives,phase,overlayShown
function rnd(a,b){return Math.random()*(b-a)+a}
function init(){cv=document.getElementById('galaga-canvas');ctx=cv.getContext('2d');w=cv.width;h=cv.height;keys={};score=0;lives=3;phase=1;overlayShown=false;ship={x:w/2,y:h-60,w:40,h:20,spd:4,cool:0};enemies=[];bullets=[];explosions=[];spawnWave();updateHUD();}
function spawnWave(){enemies=[];const rows=3+phase,cols=8;for(let r=0;r<rows;r++){for(let c=0;c<cols;c++){const ex=120+c*60,ey=80+r*40;enemies.push({x:ex,y:ey,w:28,h:18,dx: (Math.random()<0.5?1:-1)*(0.6+phase*0.05),dy:0,alive:true});}}}
function updateHUD(){const sc=document.getElementById('galaga-score');const lv=document.getElementById('galaga-lives');if(sc) sc.textContent='Puntos: '+score; if(lv) lv.textContent='Vidas: '+lives}
function key(e,v){keys[e.code]=v}
function shoot(){if(ship.cool>0) return; bullets.push({x:ship.x,y:ship.y-ship.h/2,v:-6}); ship.cool=10}
function step(){if(overlayShown) return; ship.cool=Math.max(0,ship.cool-1); if(keys['ArrowLeft']) ship.x-=ship.spd; if(keys['ArrowRight']) ship.x+=ship.spd; if(keys['Space']) shoot(); ship.x=Math.max(30,Math.min(w-30,ship.x)); for(const b of bullets){b.y+=b.v} bullets=bullets.filter(b=>b.y>-20)
  for(const e of enemies){e.x+=e.dx; if(e.x<40||e.x>w-40) e.dx*= -1; if(Math.random()<0.005+phase*0.0005){explosions.push({x:e.x,y:e.y,t:10})}}
  for(const e of enemies){if(!e.alive) continue; for(const b of bullets){if(Math.abs(b.x-e.x)<(e.w/2) && Math.abs(b.y-e.y)<(e.h/2)){e.alive=false; b.y=-999; score+=10; explosions.push({x:e.x,y:e.y,t:12})}}}
  enemies=enemies.filter(e=>e.alive)
  if(Math.random()<0.01*phase){const hit=Math.abs(ship.x-rnd(0,w))<50; if(hit){lives--; explosions.push({x:ship.x,y:ship.y,t:16}); if(lives<=0){showOverlay('Fin de la partida','Has perdido.'); return} updateHUD()}}
  if(enemies.length===0){phase++; spawnWave();}
  draw(); requestAnimationFrame(step)
}
function draw(){ctx.clearRect(0,0,w,h);ctx.fillStyle='#0b1023';ctx.fillRect(0,0,w,h);for(let i=0;i<150;i++){ctx.fillStyle='rgba(255,255,255,'+(0.1+rnd(0,0.2))+')';ctx.fillRect(rnd(0,w),rnd(0,h),1,1)}
  ctx.save();ctx.translate(ship.x,ship.y);ctx.fillStyle='#2dd4bf';ctx.beginPath();ctx.moveTo(0,-ship.h/2);ctx.lineTo(ship.w/2,ship.h/2);ctx.lineTo(-ship.w/2,ship.h/2);ctx.closePath();ctx.fill();ctx.restore();
  ctx.fillStyle='#f43f5e';for(const e of enemies){ctx.save();ctx.translate(e.x,e.y);ctx.fillRect(-e.w/2,-e.h/2,e.w,e.h);ctx.restore()}
  ctx.fillStyle='#eab308';for(const b of bullets){ctx.fillRect(b.x-2,b.y-8,4,12)}
  for(const ex of explosions){ctx.save();ctx.translate(ex.x,ex.y);ctx.fillStyle='rgba(255,200,80,'+(ex.t/16)+')';ctx.beginPath();ctx.arc(0,0,18-ex.t,0,Math.PI*2);ctx.fill();ctx.restore();ex.t--;}
  explosions=explosions.filter(e=>e.t>0)
}
function showOverlay(t,m){overlayShown=true;const ov=document.getElementById('overlay');const ot=document.getElementById('ov-title');const om=document.getElementById('ov-msg');const ob=document.getElementById('ov-btn');if(ot) ot.textContent=t;if(om) om.textContent=m;if(ov) ov.style.display='flex';if(ob) ob.onclick=()=>{if(ov) ov.style.display='none';init();overlayShown=false;requestAnimationFrame(step)}}
function start(){init();draw();requestAnimationFrame(step)}
document.addEventListener('keydown',e=>key(e,true));document.addEventListener('keyup',e=>key(e,false));document.getElementById('galaga-restart')?.addEventListener('click',()=>{init()});document.addEventListener('DOMContentLoaded',start)

