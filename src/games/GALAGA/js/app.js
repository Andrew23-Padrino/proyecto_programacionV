
import { Nave } from "./class/nave.js";
import { Alien } from "./class/alien.js";
import { Sesion } from "./class/sesion.js";
import { Firebase } from "./class/firebase.js";
import { UI } from "./class/ui.js";
import { comentarios, cargarComentarios } from "./api.js";
let usuario_SM = Sesion.obtenerSesion();
const firebase = new Firebase();

if (!usuario_SM) {
    Sesion.cerrarSesion();
}

console.log(usuario_SM);
//import { Bala } from "./clases/bala.js";
const canvas = document.getElementById('canvas');
const nave = new Nave(200, canvas.height - 100, 50, 50, "./img/player.png");
let aliens = [];

let secuenciaAliens;
let derecha = false;
let cambioDireccion = false;
let nivel = 1;
let jugando = true;
const ctx = canvas.getContext('2d');
const vidas = document.getElementById('vidas');
const municion = document.getElementById('municion');
const nivel_p = document.getElementById('nivel');


const update = async () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //console.log('dibujando');
    nave.dibujar(ctx);
    nave.removerBalas();
    nave.balas.forEach((bala) => {
        bala.dibujar(ctx);
        bala.mover();
        bala.detectarColision(aliens);
    });

    //OBTENER SOLO LOS ALIENS QUE ESTAN VIVOS
    aliens = aliens.filter((alien) => alien.vidas > 0);

    if (!(aliens.length > 0)) {
        nivel++;
        if (nivel > 3) {
            jugando = false;
            let id = usuario_SM.id;
            usuario_SM.data.victorias += 1;
            await firebase.actualizarEstadisticas(id, usuario_SM.data.victorias, usuario_SM.data.derrotas);
            Sesion.crearSesion(usuario_SM);
            terminarJuego('¡Has Ganado!', 'warning', 'Victoria');
            return;
        }
        crearAliens();
    }
    aliens.forEach((alien) => {
        alien.dibujar(ctx);
        alien.removerBalas();
        alien.balas.forEach((bala) => {
            bala.dibujar(ctx);
            bala.mover();
            bala.detectarColision(false, nave);
        });
    });

    if (nave.vidas === 0) {
        jugando = false;
        let id = usuario_SM.id;
        usuario_SM.data.derrotas += 1;
        await firebase.actualizarEstadisticas(id, usuario_SM.data.victorias, usuario_SM.data.derrotas);
        Sesion.crearSesion(usuario_SM);
        terminarJuego('¡Has perdido!', 'warning', 'Derrota');
        return;
    }
    moverAliens();

    mostrarDatos(nave.vidas, nave.municion);
    if (jugando) {
        requestAnimationFrame(update);
    }
}

const crearAliens = () => {
    let x = 130;
    let y = 100;
    let vidas;
    let src;
    switch (nivel) {
        case 1:
            vidas = 3;
            src = './img/alien-magenta.png';
            break;

        case 2:
            vidas = 4;
            src = './img/alien-yellow.png';
            break;

        case 3:
            vidas = 5;
            src = './img/alien-cyan.png';
            break;

        default:
            break;
    }
    for (let i = 1; i <= 4; i++) {
        console.log(src);
        let alien = new Alien(x, y, 64, 32, src, vidas);
        alien.imagen.onload = () => alien.setImagenCargada(true);
        aliens.push(alien);
        x += 80;
    }

    //PROGRAMAR DISPAROS DE LOS ALIENS CADA 2 SEGUNDOS
    aliens.forEach((alien) => {
        setInterval(() => alien.disparar(), 2000)
    });
}

const moverAliens = () => {
    if (!derecha) {
        //console.log("derecha no existe");
        aliens.forEach((alien) => {

            cambioDireccion = alien.mover(0, canvas.width);
            if (cambioDireccion) {
                //clearInterval(secuenciaAliens);
                //console.log("cambiando a derecha");
                cambiarDireccionAliens();
                alien.mover(0, canvas.width);
                derecha = true;
                cambioDireccion = false;
                return;
            }
        });

    }

    else {
        //console.log("existe derecha");
        for (let i = aliens.length - 1; i >= 0; i--) {
            let alien = aliens[i];
            cambioDireccion = alien.mover(0, canvas.width);
            if (cambioDireccion) {
                //clearInterval(secuenciaAliens);
                //console.log("cambiando a izquierda");
                cambiarDireccionAliens();
                //alien.mover(0, canvas.width);
                derecha = false;
                cambioDireccion = false;
                return;
            }
        }
    }


    /*if(cambioDireccion)
    {
        aliens.forEach((alien)=> alien.cambiarDireccion());
        aliens.reverse();
    }*/
}


const cambiarDireccionAliens = () => {
    aliens.forEach((alien) => alien.cambiarDireccion());

}

const mostrarDatos = (vidasNave, balas) => {
    vidas.innerText = `Vidas: ${vidasNave}`;
    municion.innerText = `Munición: ${balas}`;
    nivel_p.innerText = `Nivel: ${nivel}`;
}


const terminarJuego = async (mensaje, icono, titulo) => {
    await UI.mostrarMensaje(icono, titulo, mensaje);
    location.reload();
}

const mostrarEstadisticas = () => {
    document.getElementById('victorias').innerText = `Victorias: ${usuario_SM.data.victorias}`;
    document.getElementById('derrotas').innerText = `Derrotas: ${usuario_SM.data.derrotas}`;
}





//EVENTOS

document.addEventListener("DOMContentLoaded", async () => {
    cargarComentarios();
})

document.addEventListener('DOMContentLoaded', async () => {

    cargarComentarios();
    mostrarEstadisticas();
    nave.imagen.addEventListener('load', () => nave.setImagenCargada(true));

    //alien.imagen.addEventListener('load', ()=> alien.setImagenCargada(true));
    //explosion.imagen.addEventListener('load', ()=> explosion.setImagenCargada(true));

    // Use capture on window to intercept key events before browser default handlers
    const keyDownHandler = (e) => {
        try{
            const keyIsSpace = e.key === ' ' || e.code === 'Space' || e.keyCode === 32;
            const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
            const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable);
            if (keyIsSpace && !isEditable) {
                e.preventDefault();
                if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            }
        }catch(_){ }
        // mover la nave con las teclas
        try{ nave.mover(e.keyCode || 0, 0, canvas.width); }catch(_){ }
    };

    const keyUpHandler = (e) => {
        try{
            const keyIsSpace = e.key === ' ' || e.code === 'Space' || e.keyCode === 32;
            const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
            const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable);
            if (keyIsSpace && !isEditable) {
                e.preventDefault();
                if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                try{ nave.disparar(e.keyCode || 32); }catch(_){ }
            }
        }catch(_){
            try{ if (e.keyCode == 32) { e.preventDefault(); nave.disparar(e.keyCode); } }catch(_){ }
        }
    };

    window.addEventListener('keydown', keyDownHandler, { capture: true });
    window.addEventListener('keyup', keyUpHandler, { capture: true });
    let respuesta = await UI.mostrarConfirmacion('info', `¡Bienvenido ${usuario_SM.data.nombreUsuario}!`, 'Haz click en ACEPTAR para empezar a jugar');
    if (!respuesta.isConfirmed) {
        Sesion.cerrarSesion();
        location.href = './login.html';
    }
    crearAliens();
    //nave.recargarMunicion();

    setInterval(() => nave.recargarMunicion(), 2000);
    requestAnimationFrame(update);

    //secuenciaAliens = setInterval(moverAliens, 100);
});



