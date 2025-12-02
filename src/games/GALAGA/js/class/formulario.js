export class Formulario
{
    constructor(tipo, correo, nombreUsuario, clave)
    {
        this.tipo = tipo,
        this.correo = correo,
        this.nombreUsuario = nombreUsuario,
        this.clave = clave
    }



    validar()
    {
        let errores_SM = {};
        const datos_SM = 
        {
            nombreUsuario: this.nombreUsuario.value,
            clave: this.clave.value
        }

        if(this.tipo == "registro")
        {
            datos_SM.correo = this.correo.value;
        }
 
        //ITERACION ATRIBUTO=>VALOR DEL OBJETO
        Object.entries(datos_SM).forEach(([key, value]) => 
        {
    
            value = value.trim();
            
            console.log(value);
            //SI EL VALOR NO ESTÁ VACÍO SE PROCEDE A EVALUAR CON SU RESPECTIVA EXPRESION REGULAR
            if(value !== "" && value !== null && value !== undefined)
            {
                let expresionRegular_SM;
                if(key == "correo")
                {
                    expresionRegular_SM = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
                    if(!expresionRegular_SM.test(value))
                    {
                        errores_SM[key] = "Introduce un correo electrónico válido";
                    }
                }

                if(key == "nombreUsuario")
                {
                    expresionRegular_SM = /^[a-zA-Z0-9]{4,20}$/;
                    if(!expresionRegular_SM.test(value))
                    {
                        if(this.tipo == "registro")
                        {
                            errores_SM[key] = "Los nombres de usuario deben poseer entre 4 y 20 caracteres. Solo se aceptan letras y números";
                        }

                        else
                        {
                            errores_SM[key] = "Usuario inválido";
                        }
                        
                    }
                }

                
                if(key == "clave")
                {
                    expresionRegular_SM = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{6,}$/;
                    if(!expresionRegular_SM.test(value))
                    {
                        if(this.tipo == "registro")
                        {
                            errores_SM[key] = "Las contraseñas deben contener mínimo 6 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial";
                        }

                        else
                        {
                            errores_SM[key] = "Contraseña inválida";
                        }

                    }
                }

                
            }

            else
            {
                errores_SM[key] = "Este campo es requerido";
            }

    });

        if(Object.keys(errores_SM).length === 0)
        {
            errores_SM = false;
        }

        console.log(errores_SM)
        return errores_SM;
    }

    pintarErrores(errores, formulario)
    {
        Object.entries(errores).forEach(([key, value])=>{
            let parrafo_SM = document.createElement("p");
            parrafo_SM.classList.add('error');
            parrafo_SM.classList.add("text-red-500");
            parrafo_SM.innerText = value;
    
            switch (key) {
                case "correo":
                    this.correo.parentElement.appendChild(parrafo_SM);    
                break;
                case "nombreUsuario":
                    let padre = this.nombreUsuario.parentElement;
                    padre.appendChild(parrafo_SM);
                break;  
                
                
                case "clave":
                    this.clave.parentElement.appendChild(parrafo_SM)
                break;  
            
            }
        });
    }

    static limpiarErrores()
    {
        let parrafosErrores_SM = document.querySelectorAll(".error");
        parrafosErrores_SM.forEach((parrafo)=>parrafo.remove());
    }
}