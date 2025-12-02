## Objetivo
- Añadir una página de "Tienda" con secciones de productos educativos.
- Requerir inicio de sesión con Firebase para usar la tienda.
- Persistir datos de tienda (carrito, compras, facturas, cupones) en SQLite.
- Generar factura PDF cumpliendo requisitos SENIAT (Venezuela) con numeración y control.

## Arquitectura Técnica
- **Frontend**: nueva página `tienda` (HTML + JS) integrada al sitio existente y protegida por auth de Firebase.
- **Backend**: servicio Node.js con Express para APIs de tienda.
  - **SQLite**: `better-sqlite3` (síncrono, estable) o `sqlite3` (alternativa). Archivos `.db` ignorados por git.
  - **Auth servidor**: verificación de ID Token de Firebase con `firebase-admin` en el backend.
- **Dev scripts**: ejecutar Vite y servidor de tienda en paralelo (similar a `dev:all`).

## Modelo de Datos (SQLite)
- `products`: id, sección, nombre, descripción, precio_base, iva_tasa, activo.
- `sections`: id, nombre, slug, activo.
- `coupons`: id, código, tipo (`percent`|`fixed`), valor, tope_descuento, válido_desde/hasta, usos_max, usos_actuales, aplicable_sección/producto/opciones, activo.
- `users`: id, firebase_uid, nombre, rif_o_ci, domicilio_fiscal, creado_en.
- `carts`: id, user_id, estado (`active`|`abandoned`|`checked_out`), creado_en, actualizado_en.
- `cart_items`: id, cart_id, product_id, qty, precio_unitario_en_compra.
- `invoices`: id, invoice_number, control_number, user_id, fecha_hora, base_imponible, iva_monto, iva_tasa, total, exentas_monto, notas, hash_integridad.
- `invoice_items`: id, invoice_id, product_id, descripcion, qty, precio_unitario, subtotal, exento (bool).
- `settings`: clave/valor (serie de factura, último número de control, datos de imprenta digital).
- `payments` (opcional futuro): método, referencia, monto, estado.

## Autenticación y Autorización
- **Frontend**: obtener ID token de Firebase tras login y enviarlo en `Authorization: Bearer <token>`.
- **Backend**: validar token con `firebase-admin`. Asociar operaciones al `firebase_uid` → `users.id`.
- **Guard**: si no hay sesión, redirigir a login; enlaces de tienda protegidos como los juegos.

## Reglas de Negocio
- **Secciones**: navegación por categorías (Biología, Astronomía, etc.).
- **Cupones**:
  - Tipos: porcentaje sobre base o monto fijo.
  - Aplicación: por defecto reduce **base imponible**; el IVA se calcula sobre la base neta (asunción estándar). Exentas no generan IVA.
  - Validaciones: vigencia, usos máximos, límites por usuario (opcional), compatibilidad por sección/producto.
- **Carrito**: un carrito activo por usuario; cálculo de totales en servidor; el cliente nunca decide totales.
- **Checkout**: operación idempotente, genera factura, incrementa `invoice_number` y `control_number`.

## Cumplimiento SENIAT (Factura Digital)
- **Encabezado**:
  - "FACTURA" visible, `invoice_number` consecutivo, `control_number` único (serie), fecha y hora.
- **Emisor** (vendedor): Nombre/Razón Social, RIF, Domicilio Fiscal (desde `settings`).
- **Receptor** (comprador): Nombre/Razón Social, RIF o CI, Domicilio Fiscal.
- **Detalle**:
  - Ítems con descripción, cantidad, precio unitario.
  - Montos: **Base Imponible**, **IVA** (ej. 16% configurable), **Total**, **Exentas/Exoneradas** por separado.
- **Pie legal / Proveedor Tecnológico**:
  - Imprenta Digital: Nombre y RIF.
  - Autorización: N° y fecha de Providencia.
  - Firma electrónica: incluir **hash** del documento y metadatos; (opcional futuro: firma PKI). Para control, se imprimirá un hash interno y un QR con verificación.

## API REST (Backend)
- `GET /api/sections` → lista de secciones.
- `GET /api/products?section=slug` → productos por sección.
- `GET /api/cart` (auth) → carrito actual del usuario (items + totales).
- `POST /api/cart/items` (auth) → añadir/actualizar ítem `{product_id, qty}`.
- `DELETE /api/cart/items/:id` (auth) → eliminar ítem.
- `POST /api/coupons/validate` (auth) → validar/aplicar cupón al carrito `{code}`; servidor recalcula totales.
- `POST /api/checkout` (auth) → genera factura; respuesta con `invoice_id` y totales.
- `GET /api/invoices/:id` (auth) → JSON de factura.
- `GET /api/invoices/:id/pdf` (auth) → descarga PDF.

## Generación de PDF
- **Plantilla HTML** accesible en servidor con estilos consistentes.
- **Render a PDF** con `puppeteer` (Chromium headless) para alta fidelidad tipográfica; alternativa `pdfkit` si se prefiere sin Chromium.
- **Contenido**: encabezado, datos emisor/receptor, tabla de ítems, desglose de impuestos, totales, pie legal, hash/QR.

## Frontend de Tienda
- Nueva página `src/pages/tienda/tienda.html` y módulo `src/pages/tienda/tienda.js`.
- **UI**:
  - Navbar con sección "Tienda".
  - Listado por secciones (grid de cards), búsqueda simple.
  - Carrito lateral/flotante con totales y campo de cupón.
  - Checkout (confirmación, resumen, botón "Imprimir factura").
- **Auth Guard**: reutilizar patrón de juegos; acceso sólo autenticado.
- **Llamadas**: fetch a APIs; enviar ID token.

## Seguridad y Calidad
- Validación en servidor: cantidades, existencia de productos, cupón, cálculo de totales, límites y vigencias.
- Idempotencia en checkout (reintentos seguros).
- Sanitización/escape de strings al render.
- Auditoría mínima: timestamps, `hash_integridad` de factura.

## Configuración
- `.env` backend: PORT, IVA_TASA (ej. 0.16), SERIE_FACTURA, CONTROL_SERIE, IMPRENTA_NOMBRE, IMPRENTA_RIF, IMPRENTA_AUTORIZACION, DB_PATH.
- Semillas iniciales: secciones y productos base.

## Tareas Principales
1. Crear servidor de tienda (Express) con verificación Firebase Admin.
2. Diseñar esquema SQLite y migraciones/seeds.
3. Implementar endpoints REST (secciones, productos, carrito, cupones, checkout, facturas).
4. Implementar numeración y control (invoice/control numbers).
5. Plantilla HTML y generación de PDF (Puppeteer), hash/QR.
6. Página de tienda (UI, carrito, cupones, checkout, descarga PDF).
7. Integración de auth guard y token en fetch.
8. Validaciones, pruebas de flujo completo y manejo de errores.

## Entregables y Validación
- Navegación a "Tienda" desde el sitio.
- Flujo: login → navegación por secciones → carrito → aplicar cupón → checkout → descarga de PDF.
- Verificación de formato de factura contra requisitos SENIAT (campos obligatorios presentes y correctos).
- BD SQLite poblada con compras, cupones, facturas y relaciones correctas.