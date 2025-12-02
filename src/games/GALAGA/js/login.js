
//import { Formulario, /*UI,*/ Firebase, Sesion } from "./clases.js";

import { Firebase } from "./class/firebase.js";

import { Sesion } from "./class/sesion.js";

import { UI } from "./class/ui.js";

import { Formulario } from "./class/formulario.js";

//VARIABLES

let formulario_SM = document.getElementById("formulario");

let nombreUsuario_SM = document.getElementById("nombreUsuario");
let clave_SM = document.getElementById("clave");

let firebase_SM = new Firebase();
console.log(firebase_SM);

//FUNCIONES


const iniciarSesion_SM = (nombreUsuario, clave) => {
    UI.eliminarAlerta();
    Formulario.limpiarErrores();

    //AL SER UN FORMULARIO DE INICIO DE SESION SU ATRIBUTO CORREO SERÁ NULL
    let formularioObjeto_SM = new Formulario("sesion", null, nombreUsuario, clave);
    let errores_SM = formularioObjeto_SM.validar();

    console.log(errores_SM);

    if (!errores_SM) {

        UI.mostrarCargando(true);
        firebase_SM.encontrarUsuario(nombreUsuario.value, clave.value)
            .finally(() => UI.mostrarCargando(false))
            .then((usuario) => {

                if (usuario) {
                    Sesion.crearSesion(usuario);
                    location.href = "../juego.html";

                }

                else {
                    UI.mostrarBarraAlerta();
                }
            })

    }

    else {

        formularioObjeto_SM.pintarErrores(errores_SM, formulario_SM)
    }
}









//EVENTOS
document.addEventListener("DOMContentLoaded", () => {
    if (Sesion.obtenerSesion()) {
        location.href = "../juego.html";
    }

    formulario_SM.addEventListener("submit", (e) => {
        e.preventDefault();
        iniciarSesion_SM(nombreUsuario_SM, clave_SM);
    });


});