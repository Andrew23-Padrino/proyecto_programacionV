export class UI 
{



    static mostrarMensaje(icono, titulo, mensaje)
    {
        return Swal.fire({
            icon: icono,
            title: titulo,
            text: mensaje,
            confirmButtonText: "Aceptar",
            allowOutsideClick: false
        });
    }

    static mostrarConfirmacion(icono, titulo, mensaje)
    {
        return Swal.fire({
            icon: icono,
            iconColor: "#3fc3ee",
            title: titulo,
            text: mensaje,
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            cancelButtonText: "Salir",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#218838"
        });
    }
    
    static mostrarCargando(estado)
    {
        if(estado == true)
        {
            Swal.fire({
                title: 'Cargando',
                html: 'Por favor espere...',
                timerProgressBar: true,
                allowOutsideClick: false,
                didOpen: ()=> swal.showLoading()
            })
        }

        else
        {
            Swal.close();
        }
    }

    static mostrarBarraAlerta()
    {
        let seccion_SM = document.getElementById("seccion-formulario");
        let alerta_SM = document.createElement("div");
        alerta_SM.classList.add("barra-alerta");
        alerta_SM.innerText = "Correo o Contraseña Inválidos";
        alerta_SM.id = "barraAlerta";

        seccion_SM.insertBefore(alerta_SM, seccion_SM.firstChild);
    }


    static eliminarAlerta()
    {
        let alerta_SM = document.getElementById("barraAlerta");
        if(alerta_SM)
        {
            alerta_SM.remove();
        }
    }

}