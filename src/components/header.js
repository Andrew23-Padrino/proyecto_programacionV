export function mountHeader(container) {
  if (!container) return
  container.innerHTML = `
    <header style="background: linear-gradient(90deg,#1E6F5C,#289672);" class="bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button id="mobile-menu-button" class="md:hidden p-2 rounded-md hover:bg-white/10 focus:outline-none" aria-label="Abrir menú">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <img src="/img/NovaCiencia/Logo.png" alt="NovaCiencia" class="h-8 w-auto md:h-10" />
          <div>
            <h1 class="text-2xl font-bold">
              <a href="/" class="hover:text-light transition-colors">NovaCiencia academy</a>
            </h1>
          </div>
        </div>

        <nav class="hidden md:flex gap-6 items-center">
          <a href="/" class="hover:text-light transition-colors">Inicio</a>
          <a href="/index.html#cursos" class="hover:text-light transition-colors">Juegos</a>
          <a href="/src/pages/tienda/tienda.html" class="hover:text-light transition-colors">Tienda</a>
          <a href="/index.html#recursos" class="hover:text-light transition-colors">Recursos</a>
          <a href="/index.html#contacto" class="hover:text-light transition-colors">Contacto</a>
          <a href="/index.html#desarrolladores" class="hover:text-light transition-colors">Desarrollador</a>
          <div id="nav-auth" class="flex items-center gap-3">
            <a href="/src/pages/login/login.html" id="login-link" class="px-4 py-2 rounded-md border border-white text-white hover:bg-white/10 transition-colors">Iniciar sesión</a>
            <a href="/src/pages/register/registro.html" id="register-link" class="px-4 py-2 rounded-md bg-white text-primary font-semibold hover:opacity-90 transition-colors">Registrarse</a>
          </div>
          <div id="nav-user" class="hidden items-center gap-3"></div>
        </nav>

        <!-- Mobile menu -->
        <div id="mobile-menu" style="background: linear-gradient(180deg, rgba(30,111,92,0.95), rgba(40,150,114,0.95));" class="md:hidden hidden absolute top-16 left-0 right-0 bg-gradient-to-b from-primary/95 to-secondary/95 text-white z-40">
          <div class="px-4 py-4 flex flex-col gap-3">
            <a href="/index.html#inicio" class="block">Inicio</a>
            <a href="/index.html#cursos" class="block">Juegos</a>
            <a href="/src/pages/tienda/tienda.html" class="block">Tienda</a>
            <a href="/index.html#recursos" class="block">Recursos</a>
            <a href="/index.html#contacto" class="block">Contacto</a>
            <a href="/index.html#desarrolladores" class="block">Desarrollador</a>
            <div id="mobile-auth-area" class="mt-2"></div>
            <div id="mobile-user-area" class="mt-2"></div>
          </div>
        </div>
      </div>
    </header>
  `

  // behavior: toggle mobile menu and move auth/user nodes into it while open
  const btn = container.querySelector('#mobile-menu-button')
  const mobileMenu = container.querySelector('#mobile-menu')
  const navAuth = container.querySelector('#nav-auth')
  const navUser = container.querySelector('#nav-user')
  const mobileAuthArea = container.querySelector('#mobile-auth-area')
  const mobileUserArea = container.querySelector('#mobile-user-area')
  const originalAuthParent = navAuth ? navAuth.parentElement : null
  const originalUserParent = navUser ? navUser.parentElement : null
  const originalAuthNext = navAuth ? navAuth.nextSibling : null
  const originalUserNext = navUser ? navUser.nextSibling : null

  const openMobile = () => {
    mobileMenu.classList.remove('hidden')
    if (navAuth && mobileAuthArea) mobileAuthArea.appendChild(navAuth)
    if (navUser && mobileUserArea) mobileUserArea.appendChild(navUser)
  }
  const closeMobile = () => {
    mobileMenu.classList.add('hidden')
    if (navAuth && originalAuthParent) originalAuthParent.insertBefore(navAuth, originalAuthNext)
    if (navUser && originalUserParent) originalUserParent.insertBefore(navUser, originalUserNext)
  }

  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      if (mobileMenu.classList.contains('hidden')) openMobile()
      else closeMobile()
    })
  }

  // close mobile menu when clicking outside
  document.addEventListener('click', (ev) => {
    if (!container.contains(ev.target) && !mobileMenu.classList.contains('hidden')) {
      closeMobile()
    }
  })
}

export function unmountHeader(container) {
  if (!container) return
  container.innerHTML = ''
}
