import Game from '../common/Game.js'

class BiologiaGame extends Game {
  constructor(opts = {}) {
    super({ id: 'biologia', name: 'Biología', assets: opts.assets })
  }

  async init(container) {
    await super.init(container)
    container.innerHTML = ''
    const root = document.createElement('div')
    root.className = 'game-root'
    root.innerHTML = `
      <h2 class="game-header">Juego de Memoria - Biología</h2>
      <div class="game-canvas">Contenido del juego de Biología (placeholder)</div>
    `
    container.appendChild(root)
  }
}

export default new BiologiaGame()
