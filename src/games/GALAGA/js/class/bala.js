import { Imagen } from "./imagen.js";
export class Bala extends Imagen
{
    constructor(x, y, width, height, src, direccion, limite)
    {
        super(x, y, width, height, src);
        this.direccion = direccion;
        this.limite = limite;
        this.velocidad = 3;
        this.moviendose = true;
    }

    /*constructor(x, y)
    {
        this.x = x;
        this.y = y,
        this.width = 5,
        this.height = 10,

    }*/

    mover()
    {
        if(this.moviendose)
        {
            let movimiento = this.direccion == 'arriba' ? this.y - this.velocidad : this.y + this.velocidad;
            
            if(this.direccion == 'arriba')
            {
                if(movimiento > this.limite)
                {
                    //console.log("bala moviendose", movimiento, this.limite);
                    this.y = movimiento;
                }
                else
                {
                    this.moviendose = false;
                }
            }

            else
            {
                if(movimiento < this.limite)
                {
                    //console.log("bala moviendose", movimiento, this.limite);
                    this.y = movimiento;
                }
                else
                {
                    this.moviendose = false;
                } 
            }

        }
        this.calcularLimites();

    }

    detectarColision(aliens = false, nave = false)
    {
        if(aliens)
        {
            aliens.forEach((alien)=>{
                if(this.limDer < alien.limDer && this.limDer > alien.x && this.limArr > alien.limArr && this.limArr < alien.limAbj)
                {
                    //console.log(alien);
                    this.moviendose = false;
    
                    alien.vidas = alien.vidas > 0 ? alien.vidas - 1 : 0;
                    console.log(alien.vidas, 'vida del alien');
                    //SONIDO AL HACER IMPACTO CON EL ALIEN
                    let sonido = new Audio('/src/games/GALAGA/audio/impacto_bala.wav');
                    sonido.play();
                }
            })
        }

        else
        {
            if(this.limDer < nave.limDer && this.limDer > nave.x && this.limArr > nave.limArr && this.limArr < nave.limAbj)
            {
                //console.log(alien);
                this.moviendose = false;

                console.log("colision con la nave");
                nave.vidas = nave.vidas > 0 ? nave.vidas - 1 : 0;
                //SONIDO AL HACER IMPACTO CON LA NAVE
                let sonido = new Audio('/src/games/GALAGA/audio/impacto_nave.wav');
                sonido.play();
            }
        }
    }

    /*dibujar(ctx)
    {
        ctx.fillStyle='blue';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
    }*/
}
