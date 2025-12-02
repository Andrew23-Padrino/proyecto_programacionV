export const ROWS = 10
export const COLS = 10
export const CELL_SIZE = 50

export const ROCK_TYPES = {
  HARD: { name: 'Roca Dura', color: '#696969', health: 3 },
  SOFT: { name: 'Roca Blanda', color: '#D2B48C', health: 2 },
  SEDIMENT: { name: 'Sedimento', color: '#8B7355', health: 1 }
}

export class Cell {
  constructor(row, col){ this.row=row; this.col=col; this.rockType=null; this.health=0; this.specimenId=null; this.isExcavated=false }
  draw(ctx){ const x=this.col*CELL_SIZE; const y=this.row*CELL_SIZE; if (this.isExcavated){ ctx.fillStyle='#654321'; ctx.fillRect(x,y,CELL_SIZE,CELL_SIZE) } else { ctx.fillStyle=this.rockType.color; ctx.fillRect(x,y,CELL_SIZE,CELL_SIZE); ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1; ctx.beginPath(); if (this.health < this.rockType.health) ctx.moveTo(x+10,y+10); ctx.lineTo(x+CELL_SIZE-10,y+CELL_SIZE-10); if (this.health < this.rockType.health-1) ctx.moveTo(x+10,y+CELL_SIZE-10); ctx.lineTo(x+CELL_SIZE-10,y+10); ctx.stroke() } ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1; ctx.strokeRect(x,y,CELL_SIZE,CELL_SIZE) }
}

export function createGrid(){ const grid=[]; for(let r=0;r<ROWS;r++){ const row=[]; for(let c=0;c<COLS;c++){ const cell=new Cell(r,c); const rand=Math.random(); if (rand<0.33) cell.rockType=ROCK_TYPES.HARD; else if (rand<0.66) cell.rockType=ROCK_TYPES.SOFT; else cell.rockType=ROCK_TYPES.SEDIMENT; cell.health=cell.rockType.health; row.push(cell) } grid.push(row) } return grid }
