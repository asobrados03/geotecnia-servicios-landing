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

## Detalles del formulario de contacto (Front-end)

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

## API de contacto (Back-end)

El endpoint **POST** `/api/contact` es el único punto de entrada en el lado servidor para la funcionalidad de contacto. A continuación se documentan su contrato (entradas/salidas),
comportamiento interno, errores posibles y ejemplos de uso:

### URL y método

- **Ruta**: `/api/contact`
- **Método HTTP**: POST
- Descripción: Procesa una solicitud de contacto enviada desde el formulario de la página web. No admite otros métodos; una petición GET u otro verbo recibirá una respuesta *"405 Method Not Allowed"*.

### Autenticación y Seguridad

No se requiere autenticación para consumir este endpoint (está abierto al público de la página), pero se implementan medidas de seguridad para evitar abuso: - Se exige un **token de reCAPTCHA v3** válido en
cada solicitud, lo que dificulta enormemente los envíos automatizados masivos desde scripts maliciosos. El backend valida este token con Google antes de proceder. - El servidor aplica
nuevamente la **validación de datos** sobre el payload recibido usando el mismo esquema Zod que en el cliente, garantizando que no se procesarán ni almacenarán datos malformados o faltantes. - Existe
un comentario en el código referente a la posibilidad de añadir **limitación de tasa (rate limiting)** por IP. En la implementación actual, esto no está activado (el código está comentado), pero sugiere que,
de ser necesario, se podría usar un almacén persistente (como Redis en Upstash) para evitar múltiples envíos desde la misma IP en corto tiempo. Esto se deja como mejora futura dado que en entornos
serverless con múltiples instancias, una solución in-memory no sería efectiva (se reinicia con cada frío de la función).ç

### Datos de la solicitud (Request Body)

El cuerpo de la petición debe ser un JSON con la siguiente estructura y campos:

```json
{
  "nombre": "Juan Pérez",
  "email": "juan.perez@ejemplo.com",
  "empresa": "Geotec S.A.",
  "mensaje": "Texto del mensaje de consulta o solicitud...",
  "token": "reCAPTCHA_token_del_cliente"
}
```

- **nombre**: *(string)* Nombre de la persona que realiza la consulta. Debe cumplir con el formato descrito (2-100 caracteres, solo letras y símbolos permitidos). **Obligatorio**.
- **email**: *(string)* Correo electrónico de contacto. Debe ser un email válido y de longitud razonable (hasta 254 caracteres). **Obligatorio**.
- **empresa**: *(string)* Nombre de la empresa o entidad, en caso de que aplique, del solicitante. Campo opcional; si se envía, debe tener 2-100 caracteres. Si el usuario no completa este campo,
  el cliente envía `empresa: null` en el JSON (o puede omitirse), y el servidor lo interpretará como valor nulo.
- **mensaje**: *(string)* El cuerpo del mensaje o descripción de la solicitud. Debe tener al menos 10 caracteres útiles (máx. 1000). **Obligatorio**.
- **token**: *(string)* Token de verificación reCAPTCHA v3 obtenido en el cliente. **Obligatorio**. El servidor usará este valor junto con la clave secreta en una petición a Google para validar la
  autenticidad del usuario.

Cualquier omisión de un campo obligatorio o violación de las reglas de formato provocará que la API retorne un error de validación en lugar de procesar la solicitud.

### Respuestas (Response)

La API responde con JSON y códigos HTTP significativos según el resultado:

* **200 OK** – Indica que la solicitud de contacto se procesó con éxito de principio a fin. El cuerpo será un JSON de la forma:
  ```json
  { "ok": true }
  ```
  Este éxito implica que: los datos eran válidos, el captcha fue verificado positivamente, la información se guardó en la base de datos y los correos de notificación se enviaron sin errores.
  El cliente utiliza esta respuesta para notificar al usuario del éxito.
* **400 Bad Request** – Indica que hubo un problema con los datos enviados por el cliente o con la verificación de seguridad. En este caso, el cuerpo incluirá la clave "error" con un mensaje
  explicativo en español. Algunos escenarios que llevan a 400:
  - **Validación de campos fallida**: Si algún campo está vacío o no cumple los requisitos (por ejemplo, email con formato inválido, mensaje muy corto, etc.), el servidor responde con 400 y
    `{"error": "<detalle>"}` . El detalle suele ser el mensaje de error del esquema Zod para el primer campo problemático, por ejemplo: `{ "error": "El nombre debe tener al menos 2 caracteres" }`.
  - **Token reCAPTCHA faltante o inválido**: Si no se proporciona el campo `token` en el JSON, la API devuelve `{"error": "Falta token reCAPTCHA"}` con estatus 400 . Si el token está pero
    Google indica que no es válido o que el puntaje es bajo (posible bot), se retorna `{"error": "Verificación reCAPTCHA fallida"}`. Asimismo, si la petición a la API de Google no se
    pudo completar por algún problema de red, se notifica con `{"error": "No se pudo verificar reCAPTCHA"}`.
* 405 Method Not Allowed – Si se accede a la URL con un método distinto de POST, la función inmediatamente responde con este código y un mensaje de error. Esto previene accesos
  indebidos (por ejemplo, navegadores precargando la URL con GET, o intentos manuales) . El mensaje devuelto es en inglés por defecto (`{"error": "Method not allowed"}`) .
* **500 Internal Server Error** – Indica que ocurrió un problema en el servidor al procesar la solicitud, pese a que los datos y el token fueran correctos. Situaciones que pueden llevar a un 500 y sus mensajes:
  - **Configuración faltante**: Si el servidor no tiene definidas las variables de entorno necesarias para operar, aborta la operación. Por ejemplo, si falta la URL o la clave de servicio de Supabase,
    se retorna {"error": "Supabase no configurado"} . Si falta la clave API de Resend, responde {"error": "Falta RESEND_API_KEY, no se envió email"} . También,
    aunque no esté explícito en el código, si faltara la clave secreta de reCAPTCHA (`RECAPTCHA_SECRET_KEY`), sucedería un error similar (el código devuelve 500 "reCAPTCHA no
    configurado" antes de intentar la verificación). Estos checks garantizan que no se intente operar sin credenciales necesarias.
  - **Error de base de datos**: Si la conexión a Supabase falla o la inserción en la tabla produce un error (por ejemplo, por un problema de esquema, red, etc.), la respuesta será {"error": "No
    se pudo guardar en Supabase: <mensaje>"} con código 500 . El <mensaje> proviene del error concreto devuelto por la librería de Supabase, dando pista del motivo.
  - **Error de envío de correo**: Si ocurre una excepción al intentar enviar los emails (por ejemplo, tiempo de espera de la API de Resend, o un error en los datos del correo), se captura en el
    bloque `catch` y se retorna `{"error": "No se pudieron enviar los correos"}` con código 500 . En este punto, es posible que la solicitud sí haya quedado almacenada en la BD,
    pero al usuario se le informa del fallo en el último paso (envío de mails). El backend escribe un registro del error en la consola (`console.error`) para facilitar su depuración en los logs de Vercel.
    
Ejemplo de respuesta de error 400 (campo inválido):

```json
HTTP/2 400 Bad Request
Content-Type: application/json

{ "error": "Email inválido" }
```

Ejemplo de respuesta de éxito 200:

```json
HTTP/2 200 OK
Content-Type: application/json

{ "ok": true }
```

### Ejemplo de uso (cURL):

A continuación, se muestra un ejemplo hipotético de cómo se podría invocar el endpoint POST /api/contact usando curl desde línea de comandos (suponiendo que ya se obtuvo un token válido de reCAPTCHA v3 para
simplificar el ejemplo):

```bash
curl -X POST https://geotecniayservicios.es/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Ana Gómez",
    "email": "ana.gomez@example.com",
    "empresa": "Construcciones AG",
    "mensaje": "Hola, necesito un estudio geotécnico para un terreno urbanizable de 500m2.",
    "token": "XXXXYY-recaptcha-token-XXXX"
  }'
```

Si todos los datos son correctos y el token es válido, la respuesta sería:

```json
{ "ok": true }
```

En caso contrario, se obtendría una respuesta de error con el código HTTP correspondiente y el JSON con el detalle del problema, tal como se describió arriba.

*(Nota: en condiciones reales, obtener un token reCAPTCHA válido implica cargar la página web y ejecutar el JavaScript del cliente; por lo tanto, no es trivial simular completamente una petición válida solo con 
curl. Sin embargo, este ejemplo ilustra la forma del payload que espera la API.)*

## Variables de configuración y entorno

Para que la aplicación funcione correctamente, es necesario configurar una serie de **variables de entorno** tanto para la parte de cliente (front-end) como para la parte de servidor (back-end). A continuación se 
listan dichas variables y su propósito:

| Variable                       | Descripción                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **VITE\_RECAPTCHA\_SITE\_KEY** | Clave de sitio (*Site Key*) de Google reCAPTCHA v3, asociada al dominio de la página. Es usada en el código cliente para cargar el script de reCAPTCHA y solicitar tokens. Debe comenzar con `VITE_` para que Vite la exponga al frontend.                                                                                                                               |
| **RECAPTCHA\_SECRET\_KEY**     | Clave secreta privada de reCAPTCHA v3. Se obtiene al registrar el sitio en Google reCAPTCHA y **no** debe compartirse públicamente. El backend la utiliza para verificar los tokens recibidos con la API de Google.                                                                                                                                                      |
| **SUPABASE\_URL**              | URL de la instancia o proyecto de Supabase a usar como base de datos (por ej., `https://xyzcompany.supabase.co`). El backend la necesita para conectar con la base de datos.                                                                                                                                                                                             |
| **SUPABASE\_SERVICE\_ROLE**    | Clave de API con rol de servicio de Supabase. Proporciona privilegios elevados (lectura/escritura) en la base de datos. La función de contacto la usa para poder insertar datos en la tabla sin restricciones. **Importante:** Debe almacenarse solo en el entorno del servidor (Vercel) y nunca en el código cliente.                                                   |
| **RESEND\_API\_KEY**           | Clave API proporcionada por el servicio Resend para autorizar el envío de emails. La función de contacto la necesita para inicializar el cliente de Resend. Si no se configura, no será posible enviar correos de notificación.                                                                                                                                          |
| **CONTACT\_TO\_EMAIL**         | Dirección de correo electrónico destino a la que se enviarán las notificaciones de nuevas solicitudes. En general será el correo del profesional o empresa (ej: `geotecniayservicios@gmail.com`). Puede definirse un valor por defecto en código, pero es recomendable configurarla explícitamente.                                                                      |
| **CONTACT\_FROM\_EMAIL**       | Dirección de correo remitente que aparecerá en los emails enviados. Se recomienda usar un email bajo el dominio propio (ej: `no-reply@geotecniayservicios.es`) y verificarlo en Resend para evitar bloqueos o que el correo llegue a spam. Los destinatarios verán este email como origen y las respuestas se dirigirán al Reply-To configurado (el correo del cliente). |

Para entorno de desarrollo local, estas variables se pueden colocar en un archivo `.env` en la raíz del proyecto. Vite cargará las que comiencen con `VITE_` para el front-end, y las demás pueden ser
utilizadas por la función serverless si se ejecuta en un contexto local (por ejemplo, mediante la herramienta de desarrollo de Vercel CLI o en pruebas unitarias). En el entorno de producción (Vercel),
estas variables deben configurarse en la sección de **Environment Variables** del proyecto, con sus respectivos valores para producción (y opcionalmente para previsualización).

Además de lo anterior, hay algunas configuraciones de entorno que afectan el comportamiento de desarrollo: - El servidor de desarrollo de Vite está configurado para correr en el **puerto 8080** por
defecto . Si se desea cambiar, se puede ajustar en `vite.config.ts` o establecer la variable de entorno `PORT`. - Vercel Analytics: el código incluye la integración con Vercel Analytics (`@vercel/
analytics`) que se activa en `main.tsx`. Esto puede requerir una variable o configuración en Vercel, aunque en este caso simplemente con importar e invocar `inject()` se habilita el
seguimiento anónimo de uso.

## Instalación y ejecución (guía para desarrolladores)

A continuación se describen los pasos para instalar y ejecutar el proyecto en un entorno local de
desarrollo, así como para ejecutar las pruebas y desplegar en producción:

1. **Prerequisitos**: Asegúrate de tener instalado Node.js (se recomienda una versión actual LTS) y npm. Además, necesitarás crear cuentas/credenciales en los servicios externos usados:
   - Una cuenta de Google reCAPTCHA v3 (para obtener Site Key y Secret Key vinculadas a tu dominio o `localhost` para pruebas).
   - Una cuenta de Supabase (para obtener un proyecto URL y la clave de servicio, y crear la tabla `contact_requests`).
   - Una cuenta de Resend (para obtener la API Key y configurar un remitente o dominio verificado). Estos datos se integrarán vía variables de entorno en el siguiente paso.

2. **Clonar el repositorio**:

   ```bash
   git clone https://github.com/asobrados03/geotecnia-servicios-landing.git
   cd geotecnia-servicios-landing
   ```
3. **Configurar variables de entorno**: Crear un archivo `.env` en la raíz del proyecto (añádelo al `.gitignore` para no subirlo a git). En ese archivo, definir las variables mencionadas en la sección
   anterior. Ejemplo:

   ```dotenv
   VITE_RECAPTCHA_SITE_KEY=tu_clave_site_recaptcha
   RECAPTCHA_SECRET_KEY=tu_clave_secreta_recaptcha
   SUPABASE_URL=https://tuproyecto.supabase.co
   SUPABASE_SERVICE_ROLE=tu_clave_de_servicio_supabase
   RESEND_API_KEY=tu_api_key_resend
   CONTACT_TO_EMAIL=tu_email_notificaciones
   CONTACT_FROM_EMAIL=tu_email_remitente
   ```
   Asegúrate de rellenar cada una con los valores reales correspondientes. Si lo deseas, puedes omitir alguna (por ejemplo, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL`) para usar los valores por defecto codificados,
   pero es recomendable definirlas explícitamente.
   
4. **Instalar dependencias**:
   Ejecuta `npm install` para descargar todas las dependencias listadas en `package.json`. Esto incluye las librerías de React, Vite, Tailwind, etc., además de las SDKs de Supabase y Resend.
5. **Ejecución en modo desarrollo**:
   Ejecuta `npm run dev`. Esto iniciará el servidor de desarrollo de Vite en http://127.0.0.1:8080 (según la configuración por defecto) . Deberías ver en la consola un mensaje indicando en
   qué URL está sirviendo la aplicación. Abre esa URL en tu navegador; la página debería cargar con el contenido de la landing. Las secciones de la página (Servicios, Galería, Proyectos, Proceso,
   Contacto) deberían ser navegables y el formulario de Contacto estar disponible al final.

   *Nota: En modo desarrollo, el backend de contacto (/api/contact) puede no funcionar automáticamente al simplemente correr `npm run dev`, ya que eso sólo levanta el servidor estático React. Para probar el endpoint
   en local, hay un par de opciones:*
   
   - Usar la **CLI de Vercel**: Si tienes Vercel CLI instalado (`npm i -g vercel`), puedes ejecutar `vercel dev` en lugar de `npm run dev`. Esto iniciará tanto el servidor frontend (en otro puerto) como las funciones
     serverless en un entorno local que emula Vercel. Entonces podrías probar el formulario completo (necesitarás asegurar que las variables de entorno están disponibles para Vercel dev).
   -  Ejecutar pruebas unitarias (ver siguiente paso) como una forma indirecta de verificar la lógica de backend.
   -  Alternativamente, desplegar en un entorno de pruebas en Vercel y probar allí.
6. **Ejecutar pruebas automáticas**:
   El proyecto incluye pruebas para la función de contacto. Para ejecutarlas, asegúrate de haber instalado las dependencias (paso 4) y luego ejecuta:
   
   ```bash
   npm test
   ```
   ó
   
   ```bash
   npm run test
   ```
   
   Esto lanzará Vitest y ejecutará los casos de prueba definidos. Deberías ver en la salida cuántos tests pasaron. Un resultado exitoso indicará que la función API se comporta como se espera en escenarios
   típicos (ver sección de estructura de código sobre pruebas). Ten en cuenta que estas pruebas están **moqueando** las llamadas externas, por lo que no necesitan credenciales reales ni harán inserciones/email
   de verdad; se enfocan en la lógica interna.
   
7. **Construcción para producción**:
   Si deseas generar una versión optimizada de la aplicación, ejecuta:

   ```bash
   npm run build
   ```

   Esto invocará a Vite para crear un paquete de producción minificado. Los archivos resultantes quedarán en el directorio `dist/`. Allí estarán el `index.html`, los assets (CSS/JS) y recursos estáticos optimizados.
   Esta carpeta `dist` es la que Vercel servirá como contenido estático. Puedes probar localmente esta versión de producción ejecutando `npm run preview` después del build, que lanza un servidor local sirviendo
   `dist/` para ver cómo funcionaría en producción.
   
8. **Despliegue en Vercel**:
   Para desplegar en Vercel, tienes dos caminos:
   - **Usando GitHub**: Si el repositorio está en GitHub, puedes importarlo en Vercel (mediante la interfaz web de Vercel). Vercel detectará que es un proyecto Vite (React) y automáticamente usará `npm run build`
     para la parte estática. Asegúrate de configurar en Vercel las variables de entorno necesarias (Site Key, Secret Key, etc. mencionadas antes) en el apartado de *Settings -> Environment Variables* de tu
     proyecto Vercel. Una vez desplegado, Vercel se encargará de servir la aplicación estática y habilitar la función `api/contact.ts` como endpoint serverless bajo tu dominio
     (por ejemplo, https://tu-app.vercel.app/api/contact).
   - **Usando Vercel CLI**: Desde tu directorio local, tras haber hecho el build, puedes ejecutar `vercel` o `vercel --prod` si ya tienes la CLI configurada con tu cuenta. Esto subirá el contenido y la función. De
     nuevo, recuerda haber configurado las env vars con `vercel env add` o en el panel web antes del despliegue.
   Durante el despliegue, Vercel te dará un dominio temporal (y podrás configurar un dominio personalizado si lo tienes). Prueba la aplicación en producción: verifica que puedas enviar el formulario y que
   se estén recibiendo los correos. **Importante**: en un entorno real de producción, reCAPTCHA v3 requiere que el dominio desde el cual se ejecuta (ej. tu dominio o el de vercel) esté registrado en la consola
   de reCAPTCHA. Asegúrate de agregar el dominio de producción en la configuración de reCAPTCHA, de lo contrario el token será rechazado por Google.
9. **Solución de problemas comunes**:
   - *El formulario devuelve "reCAPTCHA no configurado" o "Falta token reCAPTCHA"*: Indica que probablemente no se establecieron correctamente las claves de reCAPTCHA. Verifica que `VITE_RECAPTCHA_SITE_KEY`
     esté presente en el front (puedes inspeccionar en las herramientas de desarrollador si el script de reCAPTCHA se carga) y que `RECAPTCHA_SECRET_KEY` esté configurada en el entorno del backend.
   - *El formulario devuelve "Supabase no configurado"*: Asegúrate de haber definido `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE`. Si están definidos pero sigue el error, puede ser que la función no los esté recogiendo;
     comprueba las mayúsculas y valores. En local, variables definidas en `.env` no estarán disponibles para la función a menos que uses `vercel dev` u otra forma de cargarlas en Node (Vitest las carga en los
     tests manualmente en `beforeEach`).
   - *El formulario devuelve "No se pudieron enviar los correos"*: Esto significa que algo falló al intentar enviar mediante Resend. Verifica que la `RESEND_API_KEY` sea correcta y que el servicio de Resend esté
     operativo. También revisa que `CONTACT_FROM_EMAIL` sea un remitente válido (por ejemplo, Resend requiere verificar el dominio o bandeja desde la que se envía; intenta usar una dirección pre-verificada). Si
     el error persiste, revisa los logs de Vercel para más detalle (se hace `console.error` del error de Resend).
   - *No llegan los correos pese a que la API indicó ok*: Verifica en tu cuenta de Resend si hay registros de envíos. Puede ser que se enviaran correctamente pero caigan en spam o sean bloqueados si el remitente
     no está verificado. Asegura el registro SPF/DKIM si usas un dominio propio para mejorar la entregabilidad.
   - *Errores de CORS o ruta no encontrada*: En entorno local, si pruebas el endpoint fuera de la app (ej. usando curl o herramientas REST), podrías necesitar asegurarte de incluir la URL correcta. En producción,
     el endpoint está bajo el mismo dominio que la app, por lo que el frontend no debe tener problemas de CORS al ser misma fuente. Si desplegaras el backend por separado en otro dominio, sí tendrías que
     habilitar CORS en la función.


## Consideraciones de diseño, seguridad y rendimiento

En esta sección se discuten algunas decisiones de diseño tomadas en el desarrollo, así como los aspectos no funcionales del sistema (seguridad, rendimiento, fiabilidad) y posibles mejoras futuras.

* **Reutilización de lógica de validación**: Un acierto en la implementación es definir las reglas de validación de los campos una sola vez (con Zod) y usarlas tanto en el cliente como en el servidor.
  Esto asegura consistencia: por ejemplo, el criterio de qué se considera un email válido es exactamente el mismo en ambas partes. Evita casos donde el cliente pudiera permitir algo que
  luego el servidor rechace o viceversa. Además, centraliza futuras modificaciones; si mañana se decide permitir mensajes más largos, con cambiar el esquema en `contact-schema.ts` se
  actualiza la validación globalmente.
* **Seguridad y spam**: Dado que el formulario es público, era crucial protegerlo de spam. La combinación de **reCAPTCHA v3** y un campo *honeypot* oculto provee dos capas distintas.
  reCAPTCHA v3 asigna un puntaje a la interacción; en el código se consideró 0.5 como umbral de corte , lo cual es un valor estándar (por debajo podría ser tráfico sospechoso). Este valor
  podría ajustarse si se observan falsos positivos/negativos. La solución *honeypot* es simple pero efectiva contra bots muy básicos que rellenan todos los campos; al descartar silenciosamente
  esos envíos , se evita incluso cargar trabajo en el backend o en reCAPTCHA para ellos. Adicionalmente, en el código se dejó comentada la intención de implementar **rate limiting** por
  IP . En un entorno de muy alto tráfico malicioso, esto sería recomendable: por ejemplo, limitar a N solicitudes por IP por hora usando un almacén global. La implementación en un
  entorno serverless debe hacerse con almacenamiento externo (como Redis) porque el estado en memoria no se comparte entre instancias ni persiste entre ejecuciones. Si bien no se
  implementó aún, es algo a tener en cuenta para robustecer la seguridad.
* **Uso de claves de servicio (Supabase) y exponer datos mínimos**: La aplicación sigue buenas prácticas al **no exponer credenciales sensibles al cliente**. Todas las operaciones que requieren
  claves privadas (BD, envío de correo, verificación captcha) se hacen en la función backend. El front-end sólo conoce la clave pública de reCAPTCHA, que por diseño puede estar pública.
  Además, la comunicación entre front y back intercambia únicamente la información necesaria: no se envían, por ejemplo, direcciones IP del usuario (aunque Vercel podría pasarlas en headers)
  ni cookies de sesión (no aplica aquí pues no hay autenticación). Los datos de contacto enviados son los proporcionados por el usuario; es importante manejarlos con cuidado en backend: en
  este caso se insertan directamente en la base de datos y se reenvían por correo sin más procesamiento. Dado que sólo se espera texto plano, el riesgo de inyección es bajo, pero en
  entornos similares podría considerarse sanitizar o formatear la información antes de enviarla por correo o almacenarla.
* **Transacciones y consistencia de datos**: Una limitación actual es que las acciones de guardar en BD y enviar correos no están atómicamente ligadas. Si falla el envío de correo después de
  guardar en la BD, la solicitud queda registrada pero al usuario se le comunicará un error (invitándolo potencialmente a reintentar). Esto podría generar entradas duplicadas en la BD si el
  usuario vuelve a enviar. Para mitigar esto, se podría en un futuro implementar alguna forma de marcar en la BD el estado de notificación enviada o evitar duplicados exactos. Sin embargo,
  dado el volumen esperado (moderado) y que un usuario típico no repetirá el formulario idéntico muchas veces, este problema no es crítico. En caso de un fallo de correo, el administrador podría
  igualmente ver la entrada en Supabase manualmente. Otra mejora podría ser enviar el correo en un segundo plano (por ejemplo, usando una cola de trabajos asíncronos) después de responder al usuario,
  para que un retraso en el servicio de email no afecte la experiencia del usuario. En un entorno serverless puro esto es complejo sin ayuda de servicios externos (colas
  en la nube, funciones programadas, etc.).
* **Rendimiento y experiencia de usuario**: La aplicación está optimizada para carga rápida y buen rendimiento:
  - Al ser una página estática servida por Vercel, se beneficia de CDN y tiempos de carga bajos globalmente.
  - Vite realiza *bundling* y minificación; además, la configuración utiliza **code splitting** y **lazy loading** donde aplicable (por ejemplo, las imágenes de la galería se cargan dinámicamente
    usando `import.meta.glob` , lo que permite que la carga inicial no incluya todas ellas ). También se usan atributos como `loading="lazy"` en imágenes para diferir la carga hasta que scroll las muestre.
  - Se observa el uso de **React.lazy** o React Router para cargar sólo la página necesaria (aunque actualmente solo hay Index, pero está preparado para más rutas sin recargar toda la app).
    Tailwind CSS y la librería shadcn/UI ayudan a que el CSS sea altamente reutilizable y optimizado (purgando clases no usadas en producción).
  - En cuanto al formulario, se provee feedback inmediato, lo cual mejora la percepción de velocidad. El único momento donde el usuario espera es al enviar, mientras se valida captcha y
    se recibe la respuesta; este tiempo suele ser breve (la verificación captcha y la inserción/correo son rápidas, probablemente <500ms en total típicamente). Aun así, el usuario ve un spinner/
    estado de envío para saber que está en proceso.
* **Escalabilidad**: Gracias a la plataforma Vercel, la escalabilidad horizontal es automática. Si muchas personas usan la página simultáneamente, Vercel podrá ejecutar múltiples instancias de
  la función API en paralelo según demanda. Supabase, al ser un servicio gestionado con PostgreSQL, puede manejar múltiples conexiones concurrentes; habría que asegurarse de tener
  un plan acorde al volumen de escritura esperado, pero a nivel de código el uso es simple (inserciones individuales). Resend también es un servicio externo capaz de escalar el envío de
  mails (dentro de los límites de la cuenta/plan contratados). En resumen, el diseño actual debería soportar aumentos moderados de carga sin cambios significativos. En caso de un crecimiento
  masivo, se podría considerar:
  - Implementar un mecanismo de **cacheo** o colas si se recibieran ráfagas de solicitudes (por ejemplo, en vez de procesar todo inmediatamente, encolar y procesar secuencialmente para no
    sobrecargar BD o SMTP). Actualmente no es necesario.
  - Monitorizar el uso de la función; Vercel impone límites de tiempo de ejecución (10s por defecto en funciones gratuitas). La función actual realiza pocas operaciones y habitualmente termina en
    menos de 1 segundo, así que está dentro de márgenes amplios.
* **Registro y monitoreo**: Por defecto, Vercel registra las salidas de consola de las funciones. El código utiliza `console.error` para capturar errores de envío de correo , lo que permite
  luego revisar en el panel de Vercel (o via `vercel logs`) los detalles de qué falló. No se integró una herramienta específica de monitoreo o alertas (como Sentry, Datadog, etc.), pero dado el
  propósito, se confía en monitorear manualmente los correos recibidos o revisar la base de datos para confirmar la recepción de solicitudes. Una posible mejora futura sería integrar algún
  sistema de logging/alerta que notifique si, por ejemplo, la función empieza a fallar repetidamente.
* **Internacionalización y localización**: La página y todos los mensajes están actualmente en español, acorde al público objetivo. No se implementó soporte multilenguaje. Si se quisiera
  agregar en un futuro, habría que externalizar los textos a archivos de idioma y quizás duplicar la página para distintas rutas o usar una librería de i18n. Esto complicaría ligeramente el
  formulario (enviar quizás un campo de idioma, etc.), pero no es prioridad a menos que se apunte a clientes de otros idiomas.
* **Futuras funcionalidades y mantenimiento**: Cualquier cambio en el formulario (por ejemplo agregar campos nuevos, o cambiar alguno existente) requerirá actualizar:
  - El esquema Zod en `contact-schema.ts` (y por ende el tipo `ContactForm`).
  - El formulario en React (añadir el campo con su estado y incluirlo en `extractFormData` y en el JSON enviado).
  - Posiblemente la tabla en Supabase (añadir la columna correspondiente).
  - Opcionalmente, el contenido del correo que se envía para incluir el nuevo dato. La documentación y comentarios en el código ayudan a guiar estos cambios; por ejemplo, habría que añadir la nueva
    variable de entorno si fuese necesaria. Mantener la documentación cerca del código (por ejemplo, este documento en el repo, o al menos referencias en el README) es recomendable para que nuevos
    desarrolladores entiendan rápidamente el contexto. El archivo WARP.md en el repositorio ya resume parte de esta información en inglés, sirviendo como guía interna para colaboradores, pero sería
    útil traducir/actualizar esa información en el README principal para futuros mantenedores.
