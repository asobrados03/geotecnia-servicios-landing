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

El formulario de contacto es una pieza clave de la página principal y su implementación enfatiza la validación, usabilidad y protección contra spam en el lado del cliente antes de enviar datos al
servidor. A continuación se explican sus características y flujo:

- **Campos del formulario**: El formulario solicita cuatro datos al usuario: **Nombre, Email, Empresa** (opcional) y **Mensaje**. Estos campos están asociados al esquema de validación definido en
  `contact-schema.ts` , que establece las siguientes reglas:
  - **Nombre ( `nombre` )** – Texto obligatorio, entre 2 y 100 caracteres. Solo se permiten letras (incluyendo acentos, eñes, diéresis), espacios, guiones y apóstrofos . Si el usuario ingresa un
    nombre muy corto o con caracteres inválidos, se mostrará un mensaje de error como "El nombre debe tener al menos 2 caracteres" o "El nombre contiene caracteres inválidos".
  - **Email ( `email` )** – Texto obligatorio con formato de email válido. Se normaliza a minúsculas y tiene un máximo de 254 caracteres . Debe coincidir con un patrón general de email (por
    ejemplo, `usuario@dominio.tld` ). Un error típico sería “Email inválido” si no pasa la validación.
  - **Empresa ( `empresa` )** – Texto opcional. Si se proporciona, debe tener al menos 2 caracteres y hasta 100 como máximo . Este campo puede quedar vacío sin error (se interpretará como
    `null` en el backend), pero de tener contenido se le aplican reglas similares de longitud. Mensaje ( mensaje ) – Texto obligatorio, de 10 a 1000 caracteres . Es el cuerpo de la solicitud
    que describe las necesidades del cliente. Si el mensaje es demasiado corto, el sistema avisará "El mensaje debe tener al menos 10 caracteres" para incentivar una descripción útil.
  - **Mensaje ( `mensaje` )** – Texto obligatorio, de 10 a 1000 caracteres . Es el cuerpo de la solicitud que describe las necesidades del cliente. Si el mensaje es demasiado corto, el sistema avisará "El
    mensaje debe tener al menos 10 caracteres" para incentivar una descripción útil.

  Estas reglas aseguran que antes de intentar enviar nada al servidor, el usuario haya proporcionado datos razonables. La ventaja de definirlas con Zod es que el mismo esquema se reutiliza en el backend para 
  una segunda capa de validación consistente.

- **Validación en el cliente**: Al hacer clic en “Enviar” (o “Solicitar presupuesto”), se ejecuta la función de manejo del formulario handleSubmit. Esta función primero previene el comportamiento por defecto
  del formulario HTML (que recargaría la página) y recoge los datos mediante la API FormData del navegador. Luego:
  1. **Honeypot anti-spam**: Existe un campo oculto en el formulario, típicamente llamado `"website"` (no visible para usuarios reales). Si un bot automatizado completa este campo
     (simulando un envío), el código detecta que tiene contenido y cancela el envío inmediatamente. Este truco de *honeypot* ayuda a filtrar algunos bots que no distinguen campos legítimos de trampas.
  2. **Validación con Zod**: Los datos recopilados se convierten a un objeto `raw` y se validan usando `contactSchema.safeParse(raw)` en el propio front-end . Si `safeParse` indica que la entrada es inválida,
     significa que algún campo no cumplió las reglas mencionadas; en tal caso se extrae el mensaje de error proporcionado por Zod (por ejemplo, el de longitud insuficiente) y se
     muestra al usuario mediante una notificación emergente (*toast*) indicándole que corrija ese dato. La función entonces se detiene (no procede a enviar nada al servidor) hasta que el usuario
     ajuste la información. Este mecanismo ofrece una respuesta rápida al usuario sobre errores de entrada, sin necesidad de esperar la respuesta del servidor.
  3. **Obtención  del token reCAPTCHA**: Si los datos básicos son válidos, el siguiente paso es obtener un **token de reCAPTCHA v3**. Cuando la página se cargó, ya debió haber insertado el script de
     reCAPTCHA de Google con la clave de sitio pública (`VITE_RECAPTCHA_SITE_KEY`) . Ahora, `handleSubmit` llama a una función auxiliar `getRecaptchaToken()` que utiliza la API
     global `grecaptcha.execute(siteKey, { action: "contact" })` para obtener un token asociado a la acción "contact" . Esta llamada es asíncrona; si por algún motivo falla o
     `grecaptcha` no está disponible, la función devuelve una cadena vacía. El código comprueba este resultado, y si no hay token, notifica un error al usuario ("No se pudo verificar reCAPTCHA")
     y cancela el envío . En condiciones normales, Google retornará un token (cadena opaca) que posteriormente el servidor validará. *Nota*: reCAPTCHA v3 funciona de forma invisible para el
     usuario, asignando un puntaje de fiabilidad; por eso no requiere interacción del usuario, pero es importante haberlo cargado previamente y ejecutar la acción en el cliente antes de llamar al backend.
  4. **Llamada al endpoint `/api/contact`**: Con los datos listos y el token reCAPTCHA obtenido, el cliente procede a enviar la solicitud al servidor. Esto se realiza mediante `fetch` hacia la ruta
     `/api/contact` usando el método POST, con las cabeceras y cuerpo JSON apropiados . En el cuerpo se incluyen todos los campos del formulario (nombre, email, empresa, mensaje) y el
     token. Es importante destacar que en este punto el formulario se deshabilita para prevenir múltiples envíos simultáneos: se usa un estado `isSubmitting` para mostrar un indicador de
     carga (por ejemplo, cambiando el botón a un estado de "enviando...").
  5. **Manejo de la respuesta**: Tras efectuar el fetch, el código espera la respuesta del servidor. Se intenta parsear el JSON de respuesta, y luego se evalúa:
     - Si la respuesta no es OK (estatus != 200) o el JSON de respuesta no contiene `ok: true`, se considera un fallo. En la rama de error, se lanza una excepción para unificar el flujo de
       manejo de errores . Esa excepción es capturada en el bloque `catch`, donde se extrae el mensaje de error (sea el proporcionado por la API o un genérico) y se muestra al
       usuario en un toast de error ("Error al enviar: [detalle]") . Por ejemplo, si el captcha falló, el servidor devolvió `{ error: "Verificación reCAPTCHA fallida" }` con
       400, y el usuario verá ese texto en la notificación.
     - Si la respuesta indica éxito (200 y `ok: true`), significa que la solicitud fue registrada correctamente. En este caso, se muestra un toast de éxito al usuario, con un mensaje
       amistoso de agradecimiento. El mensaje incluye el nombre de pila del usuario si éste se proporcionó, por ejemplo: "Juan, hemos recibido tu mensaje y te responderemos en
       menos de 24h.". Luego se limpia el formulario (reset de los campos) para que el usuario pueda enviar otra consulta si lo desea en el futuro.

En general, la experiencia de usuario está diseñada para ser fluida: validación inmediata de errores obvios, feedback rápido en caso de problemas de verificación, y confirmación clara de éxito. Además, se
incorporan detalles para mejorar la calidad de la información recibida, como la conversión del email a minúsculas automáticamente , la eliminación de espacios sobrantes en todos los campos
(`.trim()` en el esquema) y la prevención de doble envío mediante deshabilitación del botón mientras se procesa.

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
