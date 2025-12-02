// Base Game class: sigue SRP (iniciar, detener, cargar recursos)
export default class Game {
  constructor({ id, name, assets = [] } = {}) {
    this.id = id || 'game-' + Math.random().toString(36).slice(2, 9)
    this.name = name || 'Unnamed Game'
    this.assets = assets
    this.container = null
    this._isInitialized = false
  }

  // Single Responsibility: inicializar solo prepara el DOM/estado
  async init(container) {
    if (!container) throw new Error('Container element required to init the game')
    this.container = container
    this._isInitialized = true
  }

  // Ejecutar el loop o lógica principal (separa responsabilidades)
  async start() {
    if (!this._isInitialized) throw new Error('Game not initialized')
  }

  // Parar el juego y limpiar recursos
  async stop() {
    this._isInitialized = false
    if (this.container) this.container.innerHTML = ''
  }

  // Liberar recursos (assets, listeners)
  async destroy() {
    await this.stop()
    this.container = null
  }
}
