
import { Imagen } from "./imagen.js";
import { Bala } from "./bala.js";
export class Nave extends Imagen {
    constructor(x, y, width, height, src) {
        super(x, y, width, height, src);
        this.balas = [];
        this.municion = 3;
        this.vidas = 3;
    }


    mover(tecla, limiteIzq, limiteDer) {

        //IZQUIERDA
        if (tecla == 37) {
            if (this.x - 10 > limiteIzq) {
                //console.log('si')
                this.x = this.x - 10;
            }
        }

        //DERECHA
        else if (tecla == 39) {

            if (this.x + this.width + 10 < limiteDer) {
                this.x = this.x + 10;
            }
        }

        this.calcularLimites();
    }

    disparar() {
        if (this.municion > 0) {
            console.log(this.x);
            console.log(this.width);
            const x = (this.x + this.width) - (this.width / 2) - 5;
            //console.log(x);
            const bala = new Bala(x, this.y, 10, 10, '/src/games/GALAGA/img/fireball.png', 'arriba', -20);
            //console.log(bala);
            bala.imagen.onload = function () {
                bala.imagen_cargada = true;
            }
            this.balas.push(bala);

            //sonido al disparar
            let sonido = new Audio('/src/games/GALAGA/audio/disparo_nave.wav');
            sonido.play();

            this.municion -= 1;
            console.log(this.municion);
        }

        else {
            let sonido = new Audio('/src/games/GALAGA/audio/sin_balas.wav');
            sonido.play();
        }
    }

    //Remueve las balas que ya se salieron del mapa despues de ser disparadas
    removerBalas() {
        this.balas = this.balas.filter((bala) => bala.moviendose);
    }

    recargarMunicion() {
        if (this.municion < 3) {
            this.municion += 1;
        }
    }
}
