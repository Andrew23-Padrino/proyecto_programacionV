//VARIABLES
let contenedorComentarios_SM = document.getElementById("comentarios");

export let comentarios = 
        ["¡Este juego tiene gráficos espectaculares! Las explosiones se ven tan reales que casi puedes sentir la onda expansiva.",
        "El diseño de las naves es increíblemente detallado. Me encanta personalizar mi nave con diferentes colores y armas.",
        "Las misiones son bastante desafiantes, pero eso es lo que hace que el juego sea tan adictivo. ¡Nunca sé qué esperar a continuación!",
        "El sistema de mejora de naves es genial, pero creo que sería aún mejor si hubiera más opciones para modificar las armas.",
        "El multijugador es una pasada. Las batallas en equipo son intensas y realmente ponen a prueba tus habilidades.",
        "Me parece que la música del juego encaja perfectamente con el ambiente espacial. Es épica y te mantiene en tensión.",
        "A veces los enemigos son un poco predecibles, pero el juego compensa con su dinámica de combate y variedad de niveles.",
        "El modo historia es fascinante, pero me gustaría ver más profundidad en el desarrollo de personajes y trama.",
        "Las actualizaciones recientes han añadido nuevas naves y misiones que realmente han mejorado la experiencia de juego.",
        "Me encanta el modo de supervivencia. Ver cuánto tiempo puedes durar en medio de oleadas interminables de enemigos es muy entretenido." ];

    export const cargarComentarios = async ()=>
    {
        let usuarios_SM = [];           
        comentarios.sort(() => Math.random() - 0.5);

        for (let i = 0;  i <= 9; i++) {
            let peticion = await fetch("https://randomuser.me/api/");
            let persona = await peticion.json();
            
    
            console.log(persona);
            const usuario_SM = 
            {
                nombreUsuario: persona.results[0].login.username,
                imagen: persona.results[0].picture.thumbnail,
                comentario: comentarios[i]
            }
            usuarios_SM.push(usuario_SM);
        }
    
    
        mostrarComentarios(usuarios_SM);
    }


    const mostrarComentarios = (usuarios)=>
    {
        while (contenedorComentarios_SM.firstChild) {
            contenedorComentarios_SM.firstChild.remove();            
        }
        usuarios.forEach((usuario)=>{
            const {nombreUsuario, imagen, comentario} = usuario;
            contenedorComentarios_SM.innerHTML+=
            `<div class = "max-w-[300px] mb-5">
                <div class = "flex gap-4 ">
                    <img src="${imagen}" class = "object-cover rounded-full" width="30px" height="30px" alt="">
                    <p class = "text-white font-bold">${nombreUsuario}</p>
                </div>
                <p class = "p-2 text-white">${comentario}</p>
            </div>`
        })
    }


    