
import { Imagen } from "./imagen.js";
import { Bala } from "./bala.js";

export class Alien extends Imagen {


    constructor(x, y, width, height, src, vidas) {
        super(x, y, width, height, src);
        this.direccion = 'izquierda';
        this.velocidad = 1;
        this.limArr = this.y;
        this.limAbj = this.y + this.height;
        this.limIzq = this.x;
        this.limDer = this.x + this.width;
        this.balas = [];
        this.vidas = vidas;
        console.log(this.vidas);
    }



    mover(limiteIzq, limiteDer) {
        let cambiarDireccion = false;
        let movimiento = this.direccion == 'derecha' ? this.x + this.velocidad : this.x - this.velocidad;

        if (this.direccion == 'derecha') {
            if (movimiento + this.width < limiteDer) {
                this.x = movimiento;
            }

            else {
                cambiarDireccion = true;
            }
        }

        else {
            if (movimiento > limiteIzq) {
                this.x = movimiento;
            }

            else {
                cambiarDireccion = true;
            }
        }

        this.calcularLimites();

        return cambiarDireccion;
    }


    disparar() {
        const x = (this.x + this.width) - (this.width / 2) - 5;
        //console.log(x);
        const bala = new Bala(x, this.y, 30, 30, '/src/games/GALAGA/img/laser.png', 'abajo', 512);
        //console.log(bala);
        bala.imagen.onload = function () {
            bala.imagen_cargada = true;
        }
        this.balas.push(bala);

        if (this.vidas > 0) {
            let sonido = new Audio('/src/games/GALAGA/audio/disparo_alien.wav');
            sonido.play();
        }
    }

    removerBalas() {
        this.balas = this.balas.filter((bala) => bala.moviendose);
    }


    cambiarDireccion() {
        //SI LA DIRECCION ESTABA EN DERECHA, SE CAMBIA A IZQUIERDA Y VICEVERSA
        this.direccion = this.direccion == 'derecha' ? 'izquierda' : 'derecha';
    }


}
