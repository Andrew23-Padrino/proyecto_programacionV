export function mountFooter(container) {
  if (!container) return
  container.innerHTML = `
    <style>
      /* Scoped footer styles to ensure correct layout even if Tailwind isn't available */
      .nc-footer { background: linear-gradient(90deg,#1E6F5C,#163f3a); color: white; padding: 2.5rem 0; }
      .nc-footer .nc-container { max-width: 1100px; margin: 0 auto; padding: 0 1rem; }
      .nc-footer .nc-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
      @media(min-width:768px){ .nc-footer .nc-grid { grid-template-columns: repeat(4,1fr); } }
      .nc-footer h3 { color: white; margin-bottom: 0.75rem; font-size: 1.125rem; }
      .nc-footer p, .nc-footer a { color: #d1d5db; font-size: 0.95rem; }
      .nc-footer a:hover { color: #ffffff; }
      .nc-newsletter { display: flex; gap: 0; }
      .nc-newsletter input[type="email"]{ flex: 1; padding: 0.5rem 0.9rem; border: none; border-radius: 6px 0 0 6px; background: #ffffff; color: #111827; }
      .nc-newsletter input[type="email"]::placeholder{ color:#9ca3af; }
      .nc-newsletter input[type="email"]:focus{ outline: 2px solid rgba(30,111,92,0.12); }
      .nc-newsletter button{ background:#1E6F5C; color:white; padding:0.5rem 0.9rem; border:none; border-radius:0 6px 6px 0; cursor:pointer; }
      .nc-footer .nc-bottom { border-top: 1px solid rgba(255,255,255,0.08); margin-top: 2rem; padding-top: 1rem; text-align:center; color:#c7d2d9; }
    </style>
    <footer class="nc-footer" role="contentinfo">
      <div class="nc-container">
        <div class="nc-grid">
          <div>
            <h3>NovaCiencia academy</h3>
            <p>Plataforma educativa especializada en ciencias naturales para estudiantes de todos los niveles.</p>
          </div>
          <div>
            <h3>Enlaces rápidos</h3>
            <ul style="list-style:none; padding:0; margin:0;">
              <li><a href="#inicio">Inicio</a></li>
              <li><a href="#cursos">Juegos</a></li>
              <li><a href="#recursos">Recursos</a></li>
              <li><a href="#contacto">Contacto</a></li>
            </ul>
          </div>
          <div>
            <h3>Políticas</h3>
            <ul style="list-style:none; padding:0; margin:0;">
              <li><a href="#">Términos y condiciones</a></li>
              <li><a href="#">Política de privacidad</a></li>
              <li><a href="#">Política de cookies</a></li>
            </ul>
          </div>
          <div>
            <h3>Boletín informativo</h3>
            <p class="mb-4">Suscríbete para recibir actualizaciones sobre nuevos juegos y recursos educativos gratuitos.</p>
            <form id="newsletter-form" class="nc-newsletter">
              <input type="email" placeholder="Tu correo electrónico" aria-label="Tu correo electrónico" />
              <button type="submit">Suscribirse</button>
            </form>
              <div id="emailjs-debug" style="display:none;margin-top:8px;">
                <label style="font-size:13px;color:#d1d5db;display:block;margin-bottom:6px">Prueba EmailJS (solo localhost)</label>
                <div style="display:flex;gap:6px">
                  <input id="emailjs-test-email" type="email" placeholder="tu@correo.test" style="flex:1;padding:6px;border-radius:6px;border:1px solid #e5e7eb" />
                  <button id="emailjs-test-send" type="button" style="padding:6px 10px;border-radius:6px;background:#0b74de;color:#fff;border:none">Enviar prueba</button>
                </div>
                <div id="emailjs-test-status" style="margin-top:6px;font-size:13px;color:#c7d2d9"></div>
              </div>
          </div>
        </div>
        <div class="nc-bottom">
          <p>&copy; 2023 NovaCiencia academy - Universidad Nueva Esparta. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  `
}

export function unmountFooter(container) {
  if (!container) return
  container.innerHTML = ''
}
