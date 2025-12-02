import { Firebase } from "./class/firebase.js";

import { Sesion } from "./class/sesion.js";

import { UI } from "./class/ui.js";

import { Formulario } from "./class/formulario.js";

//console.log("corriendo")
//VARIABLES

let formulario_SM = document.getElementById("formulario");
let correo_SM = document.getElementById("correo");
let nombreUsuario_SM = document.getElementById("nombreUsuario");
let clave_SM = document.getElementById("clave");

let firebase_SM = new Firebase();
//FUNCIONES


const registrarUsuario_SM = (correo, nombreUsuario, clave) => {
    Formulario.limpiarErrores();
    let formularioObjeto_SM = new Formulario("registro", correo, nombreUsuario, clave);
    let errores_SM = formularioObjeto_SM.validar();

    if (!errores_SM) {
        const usuario_SM =
        {
            correo: correo.value,
            nombreUsuario: nombreUsuario.value,
            clave: clave.value,
            victorias: 0,
            derrotas: 0
        }

        UI.mostrarCargando(true);

        firebase_SM.buscarUsuarioPorCredenciales(usuario_SM)
            .finally(() => UI.mostrarCargando(false))
            .then((existe) => {
                console.log(existe);
                //firebase.registrarUsuario(usuario);
                if (!existe.correo && !existe.nombreUsuario) {
                    firebase_SM.registrarUsuario(usuario_SM);
                    UI.mostrarMensaje("success", "¡Listo!", "Registrado con éxito")
                        .then(() => {
                            location.href = "../login.html";
                        });
                }
                else {
                    let errores = {};
                    if (existe.correo) {
                        errores.correo = "ya existe un usuario con este correo"
                    }

                    if (existe.nombreUsuario) {
                        errores.nombreUsuario = "Ya existe un usuario con este nombre de Usuario";
                    }

                    formularioObjeto_SM.pintarErrores(errores, formulario_SM);
                }

            });

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
        registrarUsuario_SM(correo_SM, nombreUsuario_SM, clave_SM);
    });

});