# SubastaYa — Frontend Web

> **Proyecto desarrollado por**: Antunes Julián y Florentin Javier.

<div align="center">
  <img src="https://skillicons.dev/icons?i=react" height="40" alt="React logo" />
  &nbsp;&nbsp;
  <img src="https://skillicons.dev/icons?i=ts" height="40" alt="TypeScript logo" />
  &nbsp;&nbsp;
  <img src="https://skillicons.dev/icons?i=vite" height="40" alt="Vite logo" />
  &nbsp;&nbsp;
  <img src="https://skillicons.dev/icons?i=tailwind" height="40" alt="Tailwind CSS logo" />
  &nbsp;&nbsp;
  <img src="https://skillicons.dev/icons?i=html" height="40" alt="HTML5 logo" />
  &nbsp;&nbsp;
  <img src="https://skillicons.dev/icons?i=css" height="40" alt="CSS3 logo" />
  &nbsp;&nbsp;
  <img src="https://skillicons.dev/icons?i=git" height="40" alt="Git logo" />
</div>

<br />

Aplicación Web moderna (SPA) para la plataforma **SubastaYa**, desarrollada con **React 19**, **TypeScript**, **Vite** y **Tailwind CSS**. Proporciona una experiencia de usuario interactiva y fluida para la exploración de catálogos, participación en salas de subastas en vivo con **WebSockets (SignalR)**, gestión de billetera virtual con garantía (*escrow*) y trazabilidad de actividades.

---

## 🛠️ Tecnologías y Librerías

* **Librería Principal**: [React 19](https://react.dev/) (Hooks, Context API, componentes funcionales)
* **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) (tipado estricto y contratos sincronizados con el backend)
* **Entorno de Construcción**: [Vite 8.2](https://vitejs.dev/) (Hot Module Replacement ultrarrápido y empaquetado optimizado)
* **Estilos y UI**: [Tailwind CSS 3.4](https://tailwindcss.com/) + PostCSS + Autoprefixer
* **Comunicación en Tiempo Real**: [@microsoft/signalr](https://www.npmjs.com/package/@microsoft/signalr) (WebSockets con reconexión automática y autenticación por token)
* **Enrutamiento**: [React Router 7](https://reactrouter.com/) (rutas protegidas, layouts anidados y navegación declarativa)
* **Cliente HTTP**: [Axios](https://axios-http.com/) (interceptores globales de petición/respuesta y manejo de tokens JWT)
* **Iconografía**: [Lucide React](https://lucide.dev/) (iconos vectoriales limpios y accesibles)
* **Linter de Código**: [Oxlint](https://oxc.rs/) (análisis estático de alto rendimiento)

---

## 🏛️ Estructura del Proyecto

El código fuente del frontend se organiza de forma modular y desacoplada dentro del directorio `Web/src/`:

```
subastaya-frontend/
├── README.md
└── Web/
    ├── public/                     # Recursos estáticos e imágenes (SVG de estado, placeholders)
    ├── src/
    │   ├── api/                    # Configuración del cliente Axios e interceptores de autenticación
    │   │   └── api.ts
    │   ├── components/             # Componentes UI reutilizables y modulares
    │   │   ├── AuctionCard.tsx     # Tarjeta de subasta con temporizador regresivo y badges de estado
    │   │   ├── AuditLogsSection.tsx# Sección modular con filtros avanzados de auditoría
    │   │   ├── Layout.tsx          # Estructura visual persistente con Navbar superior y pie de página
    │   │   └── ProtectedRoute.tsx  # Guardián de navegación para rutas que requieren autenticación
    │   ├── context/                # Contextos globales de React
    │   │   └── AuthContext.tsx     # Estado global de usuario, token JWT, login y logout
    │   ├── pages/                  # Vistas principales de la aplicación
    │   │   ├── AuctionRoom.tsx     # Sala de subasta en tiempo real con SignalR y anti-sniping
    │   │   ├── AuditLogsPage.tsx   # Página de registro y trazabilidad de eventos del sistema
    │   │   ├── Catalog.tsx         # Catálogo general con búsqueda, filtros y ordenamiento
    │   │   ├── CreateAuction.tsx   # Formulario de publicación con validaciones estrictas de fechas
    │   │   ├── Login.tsx           # Inicio de sesión con selector rápido de usuarios de prueba
    │   │   ├── MyActivities.tsx    # Panel de actividades (Mis Ofertas / Mis Publicaciones con recaudación)
    │   │   ├── ProfilePage.tsx     # Perfil del usuario y resumen de cuenta
    │   │   └── Wallet.tsx          # Billetera virtual (Saldo disponible, retenido e historial contable)
    │   ├── services/               # Servicios de llamada a la API REST segregados por dominio
    │   │   ├── auctionService.ts   # Subastas, catálogo, ofertas y publicaciones
    │   │   ├── auditLogService.ts  # Consulta y registro de logs de auditoría
    │   │   └── walletService.ts    # Balance, depósitos e historial del libro mayor (Ledger)
    │   ├── utils/                  # Funciones auxiliares (formato de fechas locales, divisas, etc.)
    │   ├── App.tsx                 # Configuración del enrutador central y jerarquía de rutas
    │   ├── index.css               # Directivas base de Tailwind CSS y estilos globales
    │   └── main.tsx                # Punto de entrada de la aplicación React
    ├── package.json
    ├── tailwind.config.js
    ├── tsconfig.json
    └── vite.config.ts
```

---

## 🌟 Funcionalidades Principales

### 1. Catálogo General con Filtrado Dinámico (`Catalog.tsx`)
* **Filtros por estado de remate**:
  * **Todas**: Muestra el catálogo completo.
  * **Activas**: Subastas actualmente abiertas a ofertas con tiempo restante.
  * **Próximas**: Subastas programadas con fecha de inicio en el futuro.
  * **Finalizadas**: Subastas que concluyeron exitosamente y fueron adjudicadas a un postor ganador (*badge rojo*).
  * **Desiertas**: Subastas concluidas que no registraron ofertas (*badge marrón/naranja oscuro*).
* **Búsqueda en tiempo real**: Campo de búsqueda por título o descripción con *debounce* de 350 ms para no sobrecargar el servidor.
* **Filtro por categorías**: Selector sincronizado con las categorías disponibles en la base de datos.
* **Filtro de precios**: Rango de precio base mínimo y máximo.
* **Ordenamiento múltiple**: Por menor tiempo restante, mayor oferta, menor precio base o mayor precio base.
* **Tarjetas interactivas con Countdown**: Cada tarjeta calcula en tiempo real el tiempo restante segundo a segundo, activando alerta visual crítica en el último minuto.

### 2. Sala de Subastas en Vivo (`AuctionRoom.tsx`)
* **Conexión WebSocket (SignalR)**: Conexión persistente a la sala mediante el hub `/hubs/auction`.
* **Ofertas en tiempo real**: Transmisión instantánea de pujas enviadas por otros postores sin necesidad de recargar la página.
* **Regla Anti-Sniping**: Si ingresa una oferta válida dentro del último minuto de la subasta, el sistema extiende automáticamente el plazo en 2 minutos adicionales para permitir contraofertas justas.
* **Ofuscación de Seudónimos**: Protege la privacidad de los usuarios mostrando nombres enmascarados (ej: `J*** D**`).
* **Panel de Liderazgo**: Informa al postor conectado si su oferta es la más alta en ese momento (*"¡Vas ganando!"* vs *"Te han superado"*).
* **Cierre Automático**: Al expirar el tiempo, la sala se bloquea reactivamente, mostrando el resultado final (Adjudicada al ganador o declarada Desierta).

### 3. Billetera Virtual y Garantía Escrow (`Wallet.tsx`)
* **Desglose financiero transparente**:
  * **Saldo Total**: Dinero total en la cuenta del usuario.
  * **Saldo Retenido**: Fondos comprometidos en garantía (*escrow*) mientras el usuario sea el postor líder de una subasta activa.
  * **Saldo Disponible**: Dinero libre para pujar o depositar (`Total - Retenido`).
* **Depósito simulado**: Permite recargar fondos instantáneamente para realizar pruebas de puja.
* **Libro Mayor Contable (Ledger)**: Historial inmutable de movimientos clasificados por tipo (`Deposito`, `Retencion`, `Liberacion`, `Pago`, `Cobro`).

### 4. Panel «Mis Actividades» (`MyActivities.tsx`)
* **Pestaña «Mis Ofertas»**: Para compradores. Muestra todas las subastas en las que se ha ofertado, indicando si se lidera la puja o si se resultó ganador.
* **Pestaña «Mis Publicaciones»**: Para vendedores. Detalla el estado de los artículos publicados, la recaudación final obtenida en cada subasta adjudicada y el nombre ofuscado del comprador ganador.

### 5. Creación de Subastas (`CreateAuction.tsx`)
* Publicación modular con validación de:
  * Fecha de inicio (impide seleccionar fechas u horas pasadas con respecto a la hora actual).
  * Fecha de finalización (debe ser estrictamente posterior a la fecha de inicio).
  * Precio base e incremento mínimo configurable.
  * Selector dinámico de categorías y previsualización de imagen.

### 6. Registro de Auditoría (`AuditLogsPage.tsx`)
* Visor de eventos inmutables del sistema:
  * Inicios y cierres de subastas por el Background Worker.
  * Rechazos de pujas por saldo insuficiente o intento de auto-oferta del vendedor.
  * Historial de auditoría con filtrado por entidad, acción y rango temporal.

### 7. Inicio de Sesión Rápido (`Login.tsx`)
* Autenticación basada en tokens JWT.
* Botonera de acceso rápido con **un solo clic** a las cuentas de prueba precargadas (Vendedor, Comprador 1, Comprador 2, Sin fondos) para acelerar las demostraciones y correcciones docentes.

---

## 📋 Requisitos Previos

Asegurarse de tener instalado en el equipo:

* [Node.js](https://nodejs.org/) (versión 18 o superior recomendada, testeado en Node 20 / 22)
* [npm](https://www.npmjs.com/) (versión 9 o superior)
* Servidor Backend de SubastaYa en ejecución (ver [README del Backend](../subastaya-backend/README.md))

---

## 🚀 Despliegue y Puesta en Marcha

### 1. Ubicarse en el directorio del frontend
```bash
cd subastaya-frontend/Web
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configuración de Variables de Entorno
Verificar o crear el archivo `.env` en la raíz de `Web/` tomando como base `.env.example`:

```bash
cp .env.example .env
```

Contenido del archivo `.env`:
```env
# URL base de la API REST del backend
VITE_API_URL=http://localhost:5017/api

# URL del Hub de SignalR para WebSockets
VITE_HUB_URL=http://localhost:5017/hubs/auction
```

> **Nota**: Si el backend se ejecuta en otro puerto (por ejemplo `https://localhost:7076`), basta con actualizar estas URLs en el archivo `.env`.

### 4. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

El servidor Vite se iniciará de inmediato y la aplicación estará disponible en:
👉 **`http://localhost:5173`**

### 5. Compilar para Producción (Build)
Para verificar la ausencia de errores de TypeScript y generar el empaquetado optimizado en la carpeta `dist/`:
```bash
npm run build
```

---

## 👥 Cuentas de Prueba Precargadas

Para probar todos los flujos de la aplicación de forma inmediata sin necesidad de registrar nuevos usuarios, se encuentran configuradas las siguientes cuentas (todas con la contraseña: `123456`):

| Usuario | Correo Electrónico | Contraseña | Perfil y Saldo Inicial |
| :--- | :--- | :---: | :--- |
| **Vendedor** | `vendedor@test.com` | `123456` | Cuenta de vendedor. Gestiona publicaciones y cobra subastas adjudicadas. |
| **Comprador 1** | `comprador1@test.com` | `123456` | Comprador habilitado ($150.000 de saldo). Postor activo en subastas de prueba. |
| **Comprador 2** | `comprador2@test.com` | `123456` | Comprador habilitado ($200.000 de saldo). Ideal para simular competencia de pujas. |
| **Sin Fondos** | `sinfondos@test.com` | `123456` | Comprador con solo $500. Permite comprobar alertas de saldo insuficiente. |

> **Tip**: En la pantalla de [Inicio de Sesión](http://localhost:5173/login), puedes hacer clic directamente en cualquiera de las tarjetas de usuarios de prueba para autocompletar las credenciales al instante.

---

## 🔌 Conectividad con el Backend

El frontend interactúa con el backend mediante dos canales:

1. **API REST (HTTP/JSON)**:
   * Consumo a través de Axios con interceptor que inyecta el encabezado `Authorization: Bearer <token>` automáticamente en cada petición protegida.
   * Manejo centralizado de respuestas de error (incluyendo colisiones de concurrencia `HTTP 409 Conflict` y saldo insuficiente `HTTP 400 Bad Request`).

2. **WebSockets (SignalR Hub)**:
   * Conexión persistente mediante `@microsoft/signalr` al endpoint `/hubs/auction`.
   * Enrutamiento dinámico y soporte de autenticación pasando el token JWT en el query string (`?access_token=...`).
   * Recepción de eventos en tiempo real: nuevas ofertas (`ReceiveNewOffer`), extensión de tiempo anti-sniping (`TimeExtension`) y cierre de remates (`AuctionClosed`).
