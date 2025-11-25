# Games scaffolding

Estructura creada para gestionar juegos siguiendo principios SOLID (cada módulo tiene una responsabilidad clara):

- `common/Game.js` — Clase base con ciclo de vida (`init`, `start`, `stop`, `destroy`).
- `loader.js` — Utilidad para cargar módulos de juego dinámicamente.
- `styles/games.css` — Estilos globales mínimos para los componentes de juego (usa `@apply` y será procesado por Tailwind).
- `/<game>/index.js` — Cada juego exporta por defecto una instancia con métodos `init`, `start`, `stop`.

Cómo usar (ejemplo):

```js
import { loadGameModule } from '/src/games/loader.js'

const container = document.querySelector('#game-container')
const module = await loadGameModule('astronomia')
await module.init(container)
await module.start()
```

Si quieres, puedo:
- añadir servicios separados (asset loader, audio manager)
- integrar un router para seleccionar juegos desde la UI
- crear un componente React/Vanilla para listar y cargar juegos
