# 🛍️ Tienda Educativa - NovaCiencia

Bienvenido al módulo de **Tienda Educativa** del proyecto NovaCiencia. Este módulo es una extensión completa de comercio electrónico diseñada para ofrecer productos educativos relacionados con las temáticas de los juegos (Astronomía, Biología y Geología), integrando un sistema de facturación digital adaptado a requisitos fiscales (SENIAT).

## 📋 Características Principales

- **Catálogo por Secciones**: Exploración de productos categorizados en Astronomía, Biología y Geología.
- **Carrito de Compras**: Gestión de ítems en tiempo real, persistente por usuario.
- **Sistema de Cupones**: Validación y aplicación de códigos de descuento (porcentaje o monto fijo).
- **Facturación Digital (SENIAT)**: Generación automática de facturas con número de control, serie y cálculo de IVA (16%).
- **Exportación a PDF**: Descarga de facturas en formato PDF de alta fidelidad utilizando Puppeteer.
- **Persistencia de Datos**: Base de datos SQLite local para usuarios, productos, carritos y facturas.
- **Seguridad**: Integración con autenticación de Firebase.

## 🚀 Instalación y Ejecución

Asegúrate de tener instaladas las dependencias del proyecto:

```bash
npm install
```

Para ejecutar la tienda junto con el servidor de desarrollo y el servidor de WebSockets (recomendado), utiliza el siguiente comando:

```bash
npm run dev:all
```

Este comando iniciará concurrentemente:
1.  **Vite**: Servidor de desarrollo frontend.
2.  **Store Server**: Servidor backend de la tienda (Puerto 8090 por defecto).
3.  **WebSocket Server**: Servidor para funcionalidades multijugador.

> **Nota**: Para utilizar las funcionalidades de la tienda, es necesario iniciar sesión con una cuenta de usuario (Firebase Auth).

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js & Express**: Servidor REST API.
- **Better-SQLite3**: Base de datos SQL síncrona y eficiente.
- **Puppeteer**: Motor headless Chrome para la generación de PDFs pixel-perfect.
 - **Firebase Auth (Identity Toolkit)**: Verificación de tokens de autenticación del usuario.

### Frontend
- **HTML5 / CSS3 / JavaScript**: Interfaz de usuario integrada con el estilo del juego.
- **Fetch API**: Comunicación asíncrona con el backend de la tienda.

## 📂 Estructura de Datos

La tienda utiliza una base de datos SQLite (`data/store.db`) con las siguientes tablas principales:
- `products`: Inventario de artículos.
- `sections`: Categorías de productos.
- `carts` & `cart_items`: Estado actual del carrito de compras.
- `invoices` & `invoice_items`: Registro histórico de compras y facturación.
- `coupons`: Reglas y códigos de descuento.
- `users`: Usuarios registrados sincronizados con Firebase.

## 🧾 Facturación

El sistema genera facturas que cumplen con normativas básicas de facturación digital:
- Número de Factura consecutivo.
- Número de Control único (Serie + Correlativo).
- Datos del Emisor y Receptor.
- Desglose de Base Imponible, IVA y Total.
- Firma digital (Hash) para integridad del documento.

## 🎟️ Cupones de Descuento

- Tipos soportados: `percent` (porcentaje) y `fixed` (monto fijo).
- Validaciones automáticas: existencia, estado activo, ventana de fechas (`valid_from`/`valid_to`) y límite de usos (`max_uses` vs `uses`).
- El descuento reduce la base imponible antes de calcular el IVA.

### Esquema
- Tabla `coupons` (ver `store-server.cjs:60–70`):
  - `code` (único), `type` (`percent|fixed`), `value` (número), `max_uses` (opcional), `uses`, `valid_from`, `valid_to`, `active`.
- El carrito guarda el cupón en `carts.coupon_code` (`store-server.cjs:71–79`).

### Flujo de uso
1. Usuario ingresa el código en la Tienda.
2. Frontend llama `POST /api/coupons/validate` con `{ code }` (`src/pages/tienda/tienda.js:128–135`).
3. Backend valida y guarda el cupón en el carrito activo (`store-server.cjs:273–283`).
4. Se recalculan los totales (`store-server.cjs:350–368`).

### API de Carrito y Cupones
- `GET /api/cart` — obtiene carrito activo y totales (`store-server.cjs:226–239`).
- `POST /api/cart/items` — agrega/actualiza ítem (`store-server.cjs:242–260`).
- `DELETE /api/cart/items/:id` — elimina ítem (`store-server.cjs:263–271`).
- `POST /api/coupons/validate` — valida y almacena cupón (`store-server.cjs:273–283`).
- `POST /api/checkout` — genera factura y finaliza carrito (`store-server.cjs:285–306`).

### Ejemplos de cupones
- Porcentaje 10% válido un mes:
```sql
INSERT INTO coupons (code,type,value,max_uses,valid_from,valid_to,active)
VALUES ('ASTRO10','percent',10,100,'2025-12-01T00:00:00Z','2026-01-01T00:00:00Z',1);
```
- Descuento fijo de $50, sin límites de fecha:
```sql
INSERT INTO coupons (code,type,value,active)
VALUES ('BLACK50','fixed',50,1);
```

### Pruebas rápidas
- Aplicar cupón (modo invitado):
```bash
curl -i -X POST http://localhost:8093/api/coupons/validate \
  -H "Content-Type: application/json" \
  -H "X-Guest-Id: g-test" \
  -d '{"code":"ASTRO10"}'
```
- Consultar carrito y totales:
```bash
curl -s http://localhost:8093/api/cart -H "X-Guest-Id: g-test"
```

### Límites de uso (opcional)
- Actualmente se verifica `uses` contra `max_uses`, pero no se incrementa automáticamente al finalizar compra.
- Para hacer cumplir el límite, incrementa `uses` en `checkout` justo antes de cerrar el carrito (`store-server.cjs:304`):
```js
if (cart.coupon_code) {
  db.prepare('UPDATE coupons SET uses = COALESCE(uses,0) + 1 WHERE code = ?')
    .run(cart.coupon_code);
}
```

## 🔐 Autenticación y Headers
- Autenticación vía Firebase: `Authorization: Bearer <token>` si el usuario está logueado.
- Modo invitado soportado: enviar `X-Guest-Id: <id>` para operar el carrito sin login (`store-server.cjs:170–208`).
- El frontend añade estos headers automáticamente en `apiFetch` (`src/pages/tienda/tienda.js:35–45`).

## ⚙️ Entorno y Puertos
- Backend Tienda: `http://localhost:8093` (configurable en `.env` mediante `STORE_PORT`).
- Frontend Vite: `http://localhost:5173` con proxy de `'/api'` hacia el backend (`vite.config.js`).

## 🧪 Verificación end-to-end
- Agregar ítem y aplicar cupón desde la Tienda:
  - Navega a `http://localhost:5173/src/pages/tienda/tienda.html`.
  - Selecciona una sección, agrega productos y aplica un cupón en el modal del carrito.
  - Observa la actualización de `Base`, `IVA`, `Descuento` y `Total` (`src/pages/tienda/tienda.js:119–121`).
