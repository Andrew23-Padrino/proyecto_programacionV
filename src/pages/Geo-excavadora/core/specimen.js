export const SPECIMEN_IMAGE_SRC = {
  'Cuarzo Robusto': '/img/JuegoGeologia/minerales-fosiles/cuarzo.png',
  'Fósil de Trilobites (Frágil)': '/img/JuegoGeologia/minerales-fosiles/fosil.png',
  'Amatista': '/img/JuegoGeologia/minerales-fosiles/amatista.png',
  'Pirita (Frágil)': '/img/JuegoGeologia/minerales-fosiles/pirita.png',
}

export class Specimen {
  constructor(id, name, isFragile, color, cells, imageSrc){ this.id=id; this.name=name; this.isFragile=isFragile; this.color=color; this.cells=cells; this.status='hidden'; this.image=null; this.imageLoaded=false; if(imageSrc){ const img=new Image(); img.onload=()=>{ this.image=img; this.imageLoaded=true }; img.src=imageSrc } }
}
