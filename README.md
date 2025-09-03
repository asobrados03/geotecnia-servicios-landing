# Documentación del proyecto web "Geotecnia y Servicios"

## Introducción

**Geotecnia y Servicios** es una aplicación web tipo *landing page* desarrollada para una empresa de ingeniería geotécnica, con el objetivo de convertir visitantes en clientes potenciales (generación de
*leads*). La página presenta información sobre los servicios ofrecidos (estudios geotécnicos, sondeos, ensayos, etc.) y cuenta con un formulario de contacto mediante el cual los usuarios pueden solicitar
presupuestos o más información. Esta solicitud de contacto activa un flujo automatizado que guarda los datos del cliente y notifica por correo electrónico al responsable de la empresa, a la vez que envía una
confirmación al cliente.
El proyecto está construido con tecnologías web modernas: **React 18** con **TypeScript** para la interfaz de usuario, empaquetado con **Vite** y estilizado con **Tailwind CSS**. Emplea componentes UI de la librería
**shadcn/ui** (basada en Radix UI) para lograr una apariencia consistente. En el navegador se utiliza** React Router DOM** para manejar las rutas (actualmente la aplicación es esencialmente de una sola página
con anclajes a secciones). Para la gestión de estado del formulario se integra **Zod** (validación de esquemas) y **React Hook Form** (aunque la implementación final del formulario utiliza manejo manual
de eventos). El sitio está pensado para despliegue en Vercel, aprovechando sus *functions* sin servidor para implementar la lógica del formulario de contacto. Además, el proyecto integra servicios externos:
**Google reCAPTCHA v3** para protección anti-spam, **Supabase** como base de datos para almacenar las solicitudes de contacto, y **Resend** como servicio de envío de correos electrónicos de notificación.
En las secciones siguientes se detalla la arquitectura general, la estructura del código, la documentación de la API de contacto (POST `/api/contact` ), instrucciones de despliegue/uso y consideraciones sobre
seguridad, rendimiento y posibles mejoras.

---

## Arquitectura del sistema

*Figura: Diagrama de la arquitectura de la aplicación.* La aplicación sigue una arquitectura tipo Jamstack, separando el front-end estático del back-end sin servidor, con integración de servicios de terceros. Los
principales componentes y el flujo de datos son los siguientes:

- **Frontend (Cliente web)**: Una aplicación React SPA (Single Page Application) construida con Vite. Se sirve como archivos estáticos (HTML, CSS, JS) desde Vercel. Cuando un usuario rellena el
formulario de contacto y lo envía, el navegador ejecuta lógica JavaScript para validar los datos y obtener un token de reCAPTCHA v3 del servicio de Google (con la clave de sitio pública) .
Si la validación es correcta, el cliente envía una solicitud HTTP POST al endpoint `*/api/contact* ` incluido en el mismo dominio.

- **Función API (Backend sin servidor)**: Es una función serverless desplegada en Vercel (archivo `api/contact.ts` ) que actúa como endpoint REST para el formulario. Recibe la solicitud POST
  con los datos del formulario y el token reCAPTCHA, y realiza varias tareas de manera secuencial:
    1. **Validación de entrada**: Verifica que la solicitud use el método correcto (POST) y valida el formato de los datos usando el esquema Zod definido para el formulario.
       Si algún dato requerido falta o no cumple las reglas
       (ej. email inválido, campos demasiado cortos), responde con error 400 y un mensaje descriptivo.
    2. **Verificación reCAPTCHA**: Utiliza la API secreta de Google reCAPTCHA v3 para comprobar el token enviado. El servidor envía una petición al endpoint de verificación de Google con la clave
       secreta privada (`RECAPTCHA_SECRET_KEY`) y el token del usuario . Google responde con un resultado que indica si el token es válido y el puntaje de confianza; si la verificación falla o el
       puntaje es bajo (menos de 0.5), la función aborta y devuelve error 400 ("Verificación reCAPTCHA fallida").
    3. **Almacenamiento en base de datos (Supabase)**: Si el captcha es válido, la función conecta con Supabase (usando la URL y la clave de servicio configuradas) e inserta un registro en la tabla
       `contact_requests` con los datos del contacto (nombre, email, empresa, mensaje) y una marca de tiempo . Esta operación utiliza la clave de rol de servicio de Supabase, que tiene
       permisos de escritura en la base de datos y **se mantiene secreta del lado servidor** (nunca se expone al navegador) . Si ocurre un error al guardar en la BD, se responde con un error 500
       indicando que no se pudo guardar la solicitud.
    4. **Envío de correos (Resend)**: Tras guardar los datos, la función envía dos correos electrónicos mediante la API de Resend. El primer correo es una notificación interna
       dirigida al correo del geólogo/empresa (configurado en `CONTACT_TO_EMAIL` ), con el asunto "Nueva solicitud de presupuesto de {nombre}" y el cuerpo con todos los detalles
       enviados por el cliente . El segundo correo es una respuesta automática al cliente, enviada a la dirección de email que el usuario proporcionó, confirmando que su solicitud fue
       recibida. Ambos emails usan un remitente configurado (`CONTACT_FROM_EMAIL`), que típicamente sería una dirección del dominio de la empresa. *Nota*: el envío al profesional
       incluye un encabezado Reply-To** con el email del cliente , de forma que si el profesional responde directamente al correo, dicha respuesta irá al cliente facilitando la comunicación. Si la
       operación de envío de correos falla por cualquier motivo (p. ej. falta la API key de Resend o error en el servicio), la función lo registra en los logs y devuelve un error 500 ("No se pudieron enviar
       los correos").
    6. **Respuesta al cliente**: Si todo lo anterior tiene éxito (datos válidos, captcha ok, BD ok, correos enviados), la API devuelve al frontend un resultado **200 OK** con cuerpo JSON `{ "ok": true }`.
       Esta respuesta indica que la solicitud fue procesada correctamente, y el cliente mostrará un mensaje de confirmación al usuario. En caso de cualquier error en los pasos previos, la
       respuesta habrá sido un código de error HTTP (400, 405 o 500) con un JSON `{ "error": "mensaje descriptivo" }`, para que el frontend pueda notificar al usuario del problema.
- **Servicios de terceros**: La aplicación depende de varios servicios externos:
    - *Google reCAPTCHA v3*: provee la funcionalidad de proteger el formulario contra envíos automáticos maliciosos. Se usa en dos partes: el frontend carga el script de reCAPTCHA y obtiene
      un token por cada envío de formulario (acción "contacto"), y el backend valida ese token con Google antes de proceder . La decisión de usar reCAPTCHA v3 (invisible para el usuario)
      mejora la experiencia al no requerir desafíos interactivos, aunque introduce un umbral de puntaje para filtrar bots.
    - *Supabase*: actúa como la base de datos en la nube donde se persisten las solicitudes. Es un servicio de backend como servicio (BaaS) que proporciona PostgreSQL gestionado.
      Aquí se asume que existe una tabla `contact_requests` con columnas apropiadas para almacenar al menos: nombre, email, empresa, mensaje (texto) y la fecha/hora de creación. La función de contacto
      inserta directamente en esta tabla usando la clave de servicio de Supabase, lo que simplifica la arquitectura (no se necesita mantener un servidor propio de BD).
    - *Resend*: es un servicio de envío de emails transaccionales. La aplicación lo utiliza para el envío de notificaciones y confirmaciones sin tener que configurar un servidor de correo propio. Se requiere
      una cuenta de Resend con su API Key y probablemente la verificación del dominio o remitente desde el cual se envían los correos. La integración se realiza vía la librería oficial de Resend para Node.js,
      instanciando el cliente con la API Key y llamando a `resend.emails.send` con los parámetros correspondientes.
      
En resumen, la arquitectura es altamente modular: el **front-end** se encarga de la presentación y validación básica, delegando la lógica de negocio al **back-end serverless**; este, a su vez, confía en **servicios
externos** para las tareas de verificación (captcha), persistencia (BD) y notificación (emails). Gracias a esta separación, el sistema es escalable (Vercel puede instanciar más funciones en paralelo
según la carga), y la complejidad de infraestructura propia se reduce al mínimo, apoyándose en soluciones SaaS para las partes críticas.

---

## Estructura del código fuente

El repositorio se organiza en dos partes principales: el código de la aplicación React (dentro de `src/`) y las funciones serverless (directorio `api/`). A continuación se muestra la estructura simplificada 
de directorios y archivos relevantes:

```bash
geotecnia-servicios-landing/
├── api/
│   └── contact.ts           # Función API (Vercel) para procesar el formulario de contacto:contentReference[oaicite:23]{index=23}
├── src/
│   ├── assets/              # Recursos estáticos (imágenes, logos, etc.)
│   ├── components/          # Componentes reutilizables de UI (incluyendo shadcn/ui)
│   ├── hooks/               # Hooks personalizados de React (por ejemplo, lógica de notificaciones)
│   ├── lib/                 # Utilidades y configuración (p.ej., esquema de validación Zod) 
│   ├── pages/               # Vistas o páginas de la SPA (Index, NotFound, etc.)
│   ├── index.css            # Estilos globales (Tailwind CSS)
│   ├── App.tsx              # Componente raíz de la aplicación React (define rutas):contentReference[oaicite:24]{index=24}
│   └── main.tsx             # Punto de entrada; monta React en el DOM e inicia analíticas:contentReference[oaicite:25]{index=25}
├── package.json             # Dependencias y scripts de construcción/ejecución:contentReference[oaicite:26]{index=26}
└── vite.config.ts           # Configuración de Vite (aliases, puerto dev, etc.)
```

Algunos detalles a resaltar de la estructura:

- **Página principal**: La vista de la página de inicio (`src/pages/Index.tsx`) contiene la mayor parte del contenido de la web: secciones de servicios, galería de imágenes, testimonios/proyectos, proceso y el
  formulario de **Contacto** hacia el final. Esta página se monta en la ruta raíz "/" a través del enrutador de React Router definido en `App.tsx`. Adicionalmente, `src/pages/NotFound.tsx` provee
  una página simple para rutas no existentes (error 404).
- **Componentes UI**: En `src/components/ui/` se encuentran componentes de interfaz reutilizables (botones, tarjetas, alertas, etc.), muchos de ellos generados a partir de la biblioteca
  shadcn/UI, lo que asegura consistencia en estilos y accesibilidad. Por ejemplo, el componente de **Toast/Toaster** (notificaciones emergentes) se utiliza para dar retroalimentación al usuario al
  enviar el formulario.
- **Hooks personalizados**: `src/hooks/` contiene lógica reutilizable en forma de hooks de React. Un hook importante es `use-toast` (sistema de notificaciones), que se usa para mostrar
  mensajes de éxito o error en la pantalla según la respuesta del formulario.
- **Utilidades (lib)**: En `src/lib/` residen funciones auxiliares y configuraciones generales. Destaca el archivo `contact-schema.ts`, donde se define el **esquema de validación** para el
  formulario de contacto usando Zod . Este módulo exporta tanto el esquema (`contactSchema`) como el tipo TypeScript inferido (`ContactForm`), y es utilizado tanto en el
  front-end como en el back-end para validar los datos de forma coherente.
- **Función API**: El directorio `api/` en la raíz contiene la función serverless `contact.ts` que implementa el endpoint **POST** `/api/contact`. Vercel detecta este archivo y lo despliega como
  una lambda Node.js. Dentro del archivo, además de la lógica de negocio ya descrita, se pueden ver comentarios que especifican las **variables de entorno** esperadas y algunas decisiones
  de diseño (por ejemplo, un intento de implementar limitación de tasa in-memory está comentado con recomendaciones para producción).
- **Pruebas**: Existe un archivo de pruebas unitarias `api/contact.test.ts` que valida el comportamiento de la función de contacto. Estas pruebas usan Vitest (un framework de testing) y hacen
  *mock* de las dependencias externas (Supabase, Resend, fetch para reCAPTCHA) para comprobar casos de éxito y error sin realizar llamadas reales. Por ejemplo, hay tests que
  verifican que se retorne 405 en caso de método GET, 400 si faltan campos o token, y 200 OK en el flujo completo exitoso. Esto sirve como documentación ejecutable de cómo debe
  comportarse la API en distintas situaciones.
En conjunto, la estructura busca mantener una separación clara entre la lógica de frontend (interacción de usuario) y la lógica de backend (procesamiento de solicitudes). Asimismo, aprovecha la reutilización
de código (e.g., el esquema Zod compartido) para minimizar incoherencias entre cliente y servidor.

### Detalles del formulario de contacto (Front-end)

* `src/pages/Index.tsx` → Página principal.
* `src/components/ui/` → UI reutilizable (shadcn/ui).
* `src/hooks/` → Hooks (ej. `use-toast`).
* `src/lib/contact-schema.ts` → Validación con Zod.
* `api/contact.ts` → Función serverless.
* `api/contact.test.ts` → Tests unitarios con Vitest.

---

## Formulario de contacto (Front-end)

* **Campos**: Nombre, Email, Empresa (opcional), Mensaje.
* Validación con **Zod** (reglas de longitud, formato y caracteres válidos).
* Protección anti-spam: **Honeypot** + reCAPTCHA v3.
* Feedback al usuario con toasts (errores o éxito).
* Envío POST `/api/contact`.

---

## API de contacto (Back-end)

**Ruta**: `/api/contact`
**Método**: `POST`

### Request Body

```json
{
  "nombre": "Juan Pérez",
  "email": "juan.perez@ejemplo.com",
  "empresa": "Geotec S.A.",
  "mensaje": "Texto de la solicitud...",
  "token": "reCAPTCHA_token"
}
```

### Responses

* `200 OK` → `{ "ok": true }`.
* `400 Bad Request` → Errores de validación o reCAPTCHA.
* `405 Method Not Allowed` → Método distinto de POST.
* `500 Internal Server Error` → Errores de configuración, BD o envío de correos.

Ejemplo cURL:

```bash
curl -X POST https://<tu-dominio>/api/contact \
-H "Content-Type: application/json" \
-d '{"nombre":"Ana Gómez","email":"ana.gomez@example.com","empresa":"Construcciones AG","mensaje":"Necesito un estudio","token":"XXXX"}'
```

---

## Variables de configuración

* `VITE_RECAPTCHA_SITE_KEY` → Clave pública reCAPTCHA.
* `RECAPTCHA_SECRET_KEY` → Clave secreta reCAPTCHA.
* `SUPABASE_URL`
* `SUPABASE_SERVICE_ROLE`
* `RESEND_API_KEY`
* `CONTACT_TO_EMAIL` → Correo de notificaciones.
* `CONTACT_FROM_EMAIL` → Correo remitente.

En **desarrollo**: archivo `.env`.
En **producción (Vercel)**: configurar en *Environment Variables*.

---

## Instalación y ejecución

1. Clonar repo:

   ```bash
   git clone https://github.com/asobrados03/geotecnia-servicios-landing.git
   cd geotecnia-servicios-landing
   ```
2. Crear `.env`.
3. Instalar dependencias: `npm install`.
4. Modo desarrollo: `npm run dev`.

   * Para backend: usar `vercel dev`.
5. Tests: `npm test`.
6. Build producción: `npm run build`.
7. Despliegue en Vercel: importar desde GitHub o usar `vercel --prod`.

---

## Consideraciones de diseño, seguridad y rendimiento

* Validación compartida cliente/servidor con Zod.
* Seguridad: reCAPTCHA v3 + honeypot.
* No exponer claves sensibles en cliente.
* Problema actual: guardado en BD y envío de correo no son atómicos.
* Optimización: carga rápida con Vercel CDN, lazy loading, Tailwind purga CSS.
* Escalabilidad automática vía Vercel + servicios externos.
* Posibles mejoras: rate limiting, colas asíncronas para emails, logging avanzado.

---

## Futuras funcionalidades

* Internacionalización (i18n).
* Nuevos campos en formulario → actualizar **Zod, React form, Supabase, emails**.
* Mejor feedback visual en envío.
