import Game from '../common/Game.js'

class AstronomiaGame extends Game {
  constructor(opts = {}) {
    super({ id: 'astronomia', name: 'Astronomía', assets: opts.assets })
  }

  async init(container) {
    await super.init(container)
    container.innerHTML = ''
    const root = document.createElement('div')
    root.className = 'game-root'
    root.innerHTML = `
      <h2 class="game-header">Astronomía</h2>
      <div class="game-canvas">Contenido del juego de Astronomía (placeholder)</div>
    `
    container.appendChild(root)
  }

  async start() {
    await super.start()
    // lógica específica del juego (separada en servicios si crece)
  }
}

export default new AstronomiaGame()
