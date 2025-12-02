export class Sesion
{

    static crearSesion(usuario)
    {
        sessionStorage.setItem("usuario", JSON.stringify(usuario))
    }


    static obtenerSesion()
    {
        return JSON.parse(sessionStorage.getItem("usuario"));
    }


    static cerrarSesion()
    {
        sessionStorage.clear();
        location.href = "../login.html";
    }
}