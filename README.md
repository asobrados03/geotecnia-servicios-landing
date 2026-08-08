# Geotecnia y Servicios

Landing page profesional para Geotecnia y Servicios, un geólogo autónomo especializado en servicios geotécnicos. El sitio presenta servicios, proyectos, galería de trabajos y un formulario de contacto orientado a solicitudes de presupuesto.

El proyecto está preparado para desplegarse en Vercel como una aplicación React estática con una función serverless para procesar contactos.

## Estado actual

- Frontend SPA con React, TypeScript, Vite y Tailwind CSS.
- Secciones principales: hero, servicios, galeria, proyectos, proceso y contacto.
- Galería alimentada automáticamente desde `src/assets/gallery/`.
- Formulario de contacto con validación compartida mediante Zod.
- Protección anti-spam con honeypot y Google reCAPTCHA v3.
- Endpoint `POST /api/contact` implementado como función serverless de Vercel.
- Emails transaccionales con Resend: notificacion interna y respuesta automática al cliente.
- Archivado opcional en Supabase como paso best-effort despues del envío de emails.
- Analíticas de Vercel activadas desde `src/main.tsx`.
- Tests con Vitest para utilidades, esquema de contacto y API.

## Stack

- **Node.js**: `22.22.0` (`.nvmrc` y `.node-version`)
- **React**: `19.2.8`
- **TypeScript**: `5.9.x`
- **Vite**: `7.1.x`
- **Tailwind CSS**: `4.1.x`
- **React Router**: `8.3.x` (`react-router`)
- **TanStack React Query**: `5.x`
- **Radix UI / shadcn-style components**
- **Lucide React** para iconos
- **Zod** para validacion
- **Resend** para correo
- **Supabase** para archivo de solicitudes
- **Vitest + jsdom** para pruebas

## Estructura del proyecto

```text
.
├── api/
│   ├── contact.ts          # Funcion Vercel: POST /api/contact
│   └── contact.test.ts     # Tests de la funcion de contacto
├── public/                 # Favicons, manifest, robots y assets publicos
├── src/
│   ├── assets/             # Logo, hero y galeria
│   ├── components/ui/      # Componentes UI reutilizables
│   ├── hooks/              # Hooks de toast y responsive
│   ├── lib/
│   │   ├── contact-schema.ts
│   │   ├── contact-schema.test.ts
│   │   ├── utils.ts
│   │   └── utils.test.ts
│   ├── pages/
│   │   ├── Index.tsx       # Landing principal
│   │   └── NotFound.tsx    # Ruta 404
│   ├── App.tsx             # Providers y rutas
│   ├── index.css           # Tokens, tema y estilos globales
│   └── main.tsx            # Entrada React + Vercel Analytics
├── package.json
├── tailwind.config.ts
└── vite.config.ts
```

## Desarrollo local

Instala dependencias:

```bash
pnpm install
```

Arranca Vite en desarrollo:

```bash
pnpm dev
```

Por configuracion, el servidor usa `127.0.0.1` y el puerto `8080`.

Comandos disponibles:

```bash
pnpm dev        # Servidor local
pnpm build      # Build de produccion
pnpm build:dev  # Build en modo development
pnpm preview    # Previsualizar dist
pnpm lint       # ESLint
pnpm test       # Vitest
```

> Nota: `package.json` declara `pnpm` como package manager, aunque el repositorio tambien contiene `package-lock.json` y `bun.lockb` heredados.

## Variables de entorno

### Frontend

```env
VITE_RECAPTCHA_SITE_KEY=...
```

La clave pública se usa para cargar reCAPTCHA v3 en el navegador y pedir un token con la acción `contact`.

### API serverless

```env
RECAPTCHA_SECRET_KEY=...
RESEND_API_KEY=...
CONTACT_TO_EMAIL=geotecniayservicios@gmail.com
CONTACT_FROM_EMAIL=no-reply@geotecniayservicios.es
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE=...
```

`CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` tienen valores por defecto en `api/contact.ts`, pero conviene configurarlos explícitamente en Vercel. `SUPABASE_SERVICE_ROLE` debe existir solo en servidor y no debe exponerse al cliente.

## Flujo del formulario

1. El usuario completa `nombre`, `email`, `empresa` opcional y `mensaje`.
2. El frontend descarta silenciosamente envíos que rellenan el campo honeypot `website`.
3. Los datos se validan con `contactSchema`.
4. El navegador solicita un token de reCAPTCHA v3.
5. Se envía `POST /api/contact` con los datos validados y el token.
6. La API valida método, payload y reCAPTCHA.
7. La API envía dos emails con Resend:
   - Notificación interna a `CONTACT_TO_EMAIL`.
   - Confirmación automática al email del cliente.
8. Si los emails se envían correctamente, la API intenta archivar la solicitud en Supabase.
9. Supabase es best-effort: si no esta configurado, falla o supera el timeout de 3 segundos, la solicitud sigue respondiendo `200 { "ok": true }` porque el lead ya fue enviado por email.

## Contrato de `POST /api/contact`

Payload esperado:

```json
{
  "nombre": "Juan Perez",
  "email": "juan@example.com",
  "empresa": "ACME",
  "mensaje": "Necesito un estudio geotecnico para una obra.",
  "token": "recaptcha-token"
}
```

Respuestas principales:

- `200 { "ok": true }`: contacto procesado.
- `400 { "error": "..." }`: datos inválidos, token ausente o reCAPTCHA fallido.
- `405 { "error": "Method not allowed" }`: método distinto de POST.
- `500 { "error": "..." }`: configuración critica ausente o fallo enviando emails.

## Validación de contacto

El esquema compartido esta en `src/lib/contact-schema.ts`:

- `nombre`: obligatorio, 2-100 caracteres.
- `email`: obligatorio, email valido, máximo 254 caracteres.
- `empresa`: opcional, 2-100 caracteres si se proporciona.
- `mensaje`: obligatorio, 10-1000 caracteres.

## Despliegue

El despliegue objetivo es Vercel:

- Vite genera el frontend estático con `pnpm build`.
- Vercel detecta `api/contact.ts` como funcion serverless.
- Las variables de entorno deben configurarse en el panel del proyecto.
- El remitente de Resend debe estar autorizado/verificado segun la configuracion de la cuenta.
- La tabla de Supabase esperada es `contact_requests`, con campos compatibles con:

```ts
{
  nombre: string;
  email: string;
  empresa: string | null;
  mensaje: string;
  created_at: string;
}
```

## Calidad y pruebas

La suite actual cubre:

- `contactSchema`: datos validos, email invalido, mensaje corto y empresa opcional.
- `cn`: composición de clases y resolución de conflictos Tailwind.
- `api/contact`: método invalido, payload invalido, token ausente, flujo exitoso y fallo de Supabase posterior al envío de emails.

Ejecutar:

```bash
pnpm test
pnpm lint
pnpm build
```

## Notas de mantenimiento

- Las imagenes nuevas de la galeria pueden agregarse a `src/assets/gallery/`; Vite las importa automaticamente.
- Las rutas se definen en `src/App.tsx`.
- El contenido principal de la landing vive en `src/pages/Index.tsx`.
- Los tokens visuales y estilos globales están en `src/index.css`.
- `WARP.md` conserva información histórica y puede estar desactualizado frente al código actual.
