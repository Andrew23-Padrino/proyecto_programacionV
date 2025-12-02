import { CELL_SIZE } from './grid.js'

export function spawnSpecimenToken({ specimen, canvas, bagDrop, onCollected }){
  if (!specimen || specimen.status !== 'extracted') return
  if (specimen._tokenSpawned) return
  const first = specimen.cells[0]
  const rect = canvas.getBoundingClientRect()
  const baseX = window.scrollX + rect.left + first.col * CELL_SIZE + 5
  const baseY = window.scrollY + rect.top + first.row * CELL_SIZE + 5
  const token = document.createElement('div')
  token.style.position = 'absolute'
  token.style.left = `${baseX}px`
  token.style.top = `${baseY}px`
  token.style.width = `${CELL_SIZE - 10}px`
  token.style.height = `${CELL_SIZE - 10}px`
  token.style.zIndex = '1000'
  token.style.cursor = 'grab'
  token.style.borderRadius = '6px'
  if (specimen.image && specimen.imageLoaded) { token.style.backgroundImage = `url(${specimen.image.src})`; token.style.backgroundSize = 'cover'; token.style.backgroundPosition = 'center' } else { token.style.background = specimen.color }
  let dragging=false, ox=0, oy=0
  const onDown = (e)=>{ dragging=true; token.style.cursor='grabbing'; ox=e.pageX - baseX; oy=e.pageY - baseY; window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp, { once:true }) }
  const onMove = (e)=>{ if(!dragging) return; const x=e.pageX - ox; const y=e.pageY - oy; token.style.left=`${x}px`; token.style.top=`${y}px`; const bagRect = bagDrop ? bagDrop.getBoundingClientRect() : null; if (bagRect){ const centerX = x + (CELL_SIZE-10)/2; const centerY = y + (CELL_SIZE-10)/2; const inside = centerX >= window.scrollX + bagRect.left && centerX <= window.scrollX + bagRect.right && centerY >= window.scrollY + bagRect.top && centerY <= window.scrollY + bagRect.bottom; bagDrop.classList.toggle('ring-4', inside); bagDrop.classList.toggle('ring-amber-300', inside) } }
  const onUp = (e)=>{ dragging=false; token.style.cursor='grab'; window.removeEventListener('pointermove', onMove); const bagRect = bagDrop ? bagDrop.getBoundingClientRect() : null; if (bagRect){ const x=parseFloat(token.style.left); const y=parseFloat(token.style.top); const centerX = x + (CELL_SIZE-10)/2; const centerY = y + (CELL_SIZE-10)/2; const inside = centerX >= window.scrollX + bagRect.left && centerX <= window.scrollX + bagRect.right && centerY >= window.scrollY + bagRect.top && centerY <= window.scrollY + bagRect.bottom; if (inside){ token.remove(); specimen.status='collected'; specimen._tokenSpawned=false; if (onCollected) onCollected(specimen); return } }
    token.style.left = `${baseX}px`; token.style.top = `${baseY}px`
  }
  token.addEventListener('pointerdown', onDown)
  document.body.appendChild(token)
  specimen._tokenSpawned = true
}
