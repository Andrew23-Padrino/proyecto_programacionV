import { Nave } from '/src/games/GALAGA/js/class/nave.js'
import { Alien } from '/src/games/GALAGA/js/class/alien.js'
import { UI } from '/src/games/GALAGA/js/class/ui.js'
let canvas, ctx, nave, aliens, nivel, jugando, pausado
function crearAliens(){ let x=130,y=100,vidas,src; switch(nivel){ case 1: vidas=3; src='/src/games/GALAGA/img/alien-magenta.png'; break; case 2: vidas=4; src='/src/games/GALAGA/img/alien-yellow.png'; break; case 3: vidas=5; src='/src/games/GALAGA/img/alien-cyan.png'; break; default: vidas=3; src='/src/games/GALAGA/img/alien.png'; }
  aliens=[]; for(let i=1;i<=4;i++){ const a=new Alien(x,y,64,32,src,vidas); a.imagen.onload=()=>a.setImagenCargada(true); aliens.push(a); x+=80 } aliens.forEach(a=>{ setInterval(()=>a.disparar(),2000) }) }
function moverAliens(){ let derecha=false, cambio=false; if(!derecha){ for(const a of aliens){ cambio=a.mover(0,canvas.width); if(cambio){ aliens.forEach(al=>al.cambiarDireccion()); a.mover(0,canvas.width); derecha=true; cambio=false; return } } } else { for(let i=aliens.length-1;i>=0;i--){ const a=aliens[i]; cambio=a.mover(0,canvas.width); if(cambio){ aliens.forEach(al=>al.cambiarDireccion()); derecha=false; cambio=false; return } } } }
function mostrarDatos(){ document.getElementById('vidas').innerText='Vidas: '+nave.vidas; document.getElementById('municion').innerText='Munición: '+nave.municion; document.getElementById('nivel').innerText='Nivel: '+nivel }
async function terminar(mensaje){ await UI.mostrarMensaje('info','Galaga',mensaje); location.reload() }
function update(){
  if(pausado){ requestAnimationFrame(update); return }
  ctx.clearRect(0,0,canvas.width,canvas.height);
  nave.dibujar(ctx); nave.removerBalas();
  nave.balas.forEach(b=>{ b.dibujar(ctx); b.mover(); b.detectarColision(aliens) });
  aliens=aliens.filter(a=>a.vidas>0);
  if(!(aliens.length>0)){
    nivel++;
    if(nivel>3){ jugando=false; terminar('¡Has Ganado!'); return }
    crearAliens()
  }
  aliens.forEach(a=>{ a.dibujar(ctx); a.removerBalas(); a.balas.forEach(b=>{ b.dibujar(ctx); b.mover(); b.detectarColision(false,nave) }) });
  if(nave.vidas===0){ jugando=false; terminar('¡Has perdido!'); return }
  moverAliens(); mostrarDatos();
  if(jugando) requestAnimationFrame(update)
}
function start(){
  canvas=document.getElementById('canvas'); ctx=canvas.getContext('2d');
  nave=new Nave(200, canvas.height-100, 50, 50, '/src/games/GALAGA/img/player.png');
  nivel=1; jugando=true; pausado=false;
  nave.imagen.addEventListener('load', ()=>nave.setImagenCargada(true));
  document.addEventListener('keydown', e=>{
    if(e.code==='KeyP'){ togglePause(); return }
    nave.mover(e.keyCode,0,canvas.width)
  });
  document.addEventListener('keyup', e=>{ if(e.keyCode==32) nave.disparar(e.keyCode) });
  const pauseBtn=document.getElementById('btn-pause'); if(pauseBtn) pauseBtn.onclick=()=> togglePause();
  crearAliens(); setInterval(()=>nave.recargarMunicion(),2000);
  requestAnimationFrame(update)
}
function togglePause(){ pausado=!pausado; const el=document.getElementById('btn-pause'); if(el) el.textContent = pausado ? 'Reanudar' : 'Pausar' }
document.addEventListener('DOMContentLoaded', async ()=>{ const r=await UI.mostrarConfirmacion('info','¡Bienvenido!','Haz click en ACEPTAR para empezar a jugar'); if(!r.isConfirmed){ location.href='/' } else { start() } })
