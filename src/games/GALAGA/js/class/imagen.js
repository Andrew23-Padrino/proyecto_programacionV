export class Imagen
{
    constructor(x, y, width, height, src)
    {
        this.x = x,
        this.y = y,
        this.width = width,
        this.height = height,
        this.imagen = new Image();
        this.imagen.src = src;
        //INDICA SI LA IMAGEN ESTA CARGADA O NO
        this.imagen_cargada = false;

        //limites
        this.limArr = this.y;
        this.limAbj = this.y + this.height;
        this.limIzq = this.x;
        this.limDer = this.x + this.width;

    }

    setImagenCargada(estado)
    {
        this.imagen_cargada = estado;
    }


    dibujar(ctx)
    {
        if(this.imagen_cargada)
        {
            ctx.drawImage(this.imagen, this.x, this.y, this.width, this.height);
        }
    }




    //CALCULA LOS LIMITES DE UNA IMAGEN, ESTOS SERAN UTILIZADOS PARA DETECTAR COLISIONES ENTRE DISTINTAS IMAGENES
    calcularLimites()
    {
        this.limArr = this.y;
        this.limAbj = this.y + this.height;
        this.limIzq = this.x;
        this.limDer = this.x + this.width;
    }
}