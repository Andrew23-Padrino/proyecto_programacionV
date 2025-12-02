import { ROWS, COLS } from './grid.js'
import { Specimen } from './specimen.js'
import { SPECIMEN_IMAGE_SRC } from './specimen.js'

export const SPECIMEN_PATTERNS = {
  'Cuarzo Robusto': [ [ { r:0,c:0 } ] ],
  'Fósil de Trilobites (Frágil)': [ [ { r:0,c:0 },{ r:0,c:1 } ], [ { r:0,c:0 },{ r:1,c:0 } ] ],
  'Amatista': [ [ { r:0,c:0 },{ r:0,c:1 },{ r:1,c:1 } ], [ { r:0,c:0 },{ r:1,c:0 },{ r:1,c:1 } ] ],
  'Pirita (Frágil)': [ [ { r:0,c:0 } ] ],
}

export function allocatePatternRandom(pattern, occ){ const maxTries=500; for(let t=0;t<maxTries;t++){ const baseRow=Math.floor(Math.random()*ROWS); const baseCol=Math.floor(Math.random()*COLS); const cells=pattern.map(p=>({ row:baseRow+p.r, col:baseCol+p.c })); const fits=cells.every(c=>c.row>=0 && c.row<ROWS && c.col>=0 && c.col<COLS && !occ[c.row][c.col]); if(fits){ cells.forEach(c=>{ occ[c.row][c.col]=true }); return cells } } for(let r=0;r<ROWS;r++){ for(let c=0;c<COLS;c++){ if(!occ[r][c]){ occ[r][c]=true; return [ { row:r, col:c } ] } } } return [ { row:0, col:0 } ] }

export function placeSpecimens(grid){ const occ=Array.from({length:ROWS},()=>Array(COLS).fill(false)); const defs=[ { id:1, name:'Cuarzo Robusto', fragile:false, color:'#E6E6FA' }, { id:2, name:'Fósil de Trilobites (Frágil)', fragile:true, color:'#A0522D' }, { id:3, name:'Amatista', fragile:false, color:'#9966CC' }, { id:4, name:'Pirita (Frágil)', fragile:true, color:'#DAA520' } ]; const specimens=defs.map(def=>{ const list=SPECIMEN_PATTERNS[def.name] || [ [ { r:0,c:0 } ] ]; const pat=list[Math.floor(Math.random()*list.length)]; const cells=allocatePatternRandom(pat, occ); return new Specimen(def.id, def.name, def.fragile, def.color, cells, SPECIMEN_IMAGE_SRC[def.name]) }); specimens.forEach(sp=>{ sp.cells.forEach(({row,col})=>{ if(grid[row] && grid[row][col]) grid[row][col].specimenId=sp.id }) }); return specimens }
