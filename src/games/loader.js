// Game loader: Single Responsibility is to dynamically load game modules
export async function loadGameModule(name) {
  try {
    const module = await import(`./${name}/index.js`)
    // módulos deben exportar por defecto un objeto con { meta, init, start, stop }
    return module.default || module
  } catch (err) {
    throw new Error(`No se pudo cargar el módulo de juego "${name}": ${err.message}`)
  }
}

export const availableGames = [
  { id: 'astronomia', label: 'Astronomía' },
  { id: 'biologia', label: 'Biología' },
  { id: 'geologia', label: 'Geología' },
  { id: 'bomba', label: 'Desactivación (Electricidad)' },
  { id: 'canion', label: 'Ángulo del Cañón' },
]

// Helpers to load original (legacy) scripts inside an iframe adapter.
export function createOriginalAdapter({ id, scriptPath, cssPaths = [], width = '100%', height = '600px' }) {
  if (!scriptPath) throw new Error('scriptPath is required')

  function buildSrcDoc() {
    const cssLinks = (cssPaths || []).map(p => `<link rel="stylesheet" href="${p}">`).join('\n')
    const bridge = `
      <script>
        (function(){
          function emit(evt){ try{ parent.postMessage({ type: 'originalGameEvent', id: '${id}', event: evt }, '*'); }catch(e){} }
          function check(){
            try{
              var d = document;
              var txt = d.body.innerText || '';
              if (txt.includes('¡Ganaste!') || txt.includes('¡Excelente!')) { emit('win'); }
              var q = d.querySelector('#question-modal');
              if (q && !q.classList.contains('hidden')){
                var t = d.querySelector('#question-text');
                if (t && (t.textContent || '').includes('¡Nivel Completo!')) emit('win');
              }
              var mt = d.querySelector('#modal-title');
              if (mt){ var m = (mt.textContent||''); if (m.includes('¡Expedición Exitosa!')) emit('win'); if (m.includes('¡DERRUMBE!')) emit('lose'); }
            }catch(e){}
          }
          var obs = new MutationObserver(check);
          obs.observe(document.body, { childList: true, subtree: true, characterData: true });
          setInterval(check, 1200);
          window.addEventListener('load', check);
        })();
      </script>
    `
    return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        ${cssLinks}
      </head>
      <body>
        <div id="app"></div>
        <script type="module" src="${scriptPath}"></script>
        ${bridge}
      </body>
    </html>`
  }

  let iframe = null

    return {
    meta: { original: true, scriptPath, id },
    async init(container) {
      if (!container) throw new Error('Container required to init original adapter')
      iframe = document.createElement('iframe')
      iframe.setAttribute('aria-label', 'Juego original')
      iframe.style.width = width
      iframe.style.height = height
      iframe.style.border = '0'
      iframe.srcdoc = buildSrcDoc()
      container.innerHTML = ''
      container.appendChild(iframe)
      // wait until iframe loads
      await new Promise((resolve) => {
        iframe.addEventListener('load', () => resolve(), { once: true })
      })
      return iframe
    },
    async start() {
      if (!iframe) throw new Error('Adapter not initialized')
      iframe.style.display = ''
    },
    async stop() {
      if (!iframe) return
      iframe.style.display = 'none'
    },
    async destroy() {
      if (!iframe) return
      iframe.remove()
      iframe = null
    }
  }
}

export function availableOriginals() {
  return [
    { id: 'astronomia', script: '/src/games/originales/juego_astronomia.js' },
    { id: 'biologia', script: '/src/games/originales/juego_biologia.js' },
    { id: 'geologia', script: '/src/games/originales/juego_geologia.js' },
    { id: 'bomba', script: '/src/games/originales/juego_bomba.js' },
    { id: 'canion', script: '/src/games/originales/juego_canion.js' },
  ]
}

export function loadOriginalById(id, opts = {}) {
  const found = availableOriginals().find(o => o.id === id)
  if (!found) throw new Error('Original game not found: ' + id)
  return createOriginalAdapter({ id, scriptPath: found.script, cssPaths: opts.cssPaths || [] })
}
