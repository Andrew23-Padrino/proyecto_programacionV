import Game from '../common/Game.js'

class GeologiaGame extends Game {
  constructor(opts = {}) {
    super({ id: 'geologia', name: 'Geología', assets: opts.assets })
  }

  async init(container) {
    await super.init(container)
    container.innerHTML = ''
    const root = document.createElement('div')
    root.className = 'game-root'
    root.innerHTML = `
      <h2 class="game-header">Geología</h2>
      <div class="game-canvas">Contenido del juego de Geología (placeholder)</div>
    `
    container.appendChild(root)
  }
}

export default new GeologiaGame()
