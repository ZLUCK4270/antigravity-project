# Documentación Sprint 1 - Project Antigravity 🚀

## 🎯 Sprint Goal

**"Lograr un MVP funcional que permita a los usuarios registrarse, iniciar sesión y gestionar sus jornadas laborales (iniciar, pausar, finalizar) con persistencia de datos."**

---

## 📋 Sprint Backlog

_(Simulación de Tablero Kanban)_

### ✅ Done (Terminado)

- **Configuración de Proyecto**: Estructura de carpetas, Git init, conexión con Supabase.
- **Base de Datos**: Script `schema.sql` para tablas `jornadas` y `pausas` con RLS.
- **Autenticación UI**: Formularios de Login y Registro funcionales.
- **Lógica de Auth**: Integración con `supabase.auth` (SignUp/SignIn/SignOut).
- **Dashboard UI**: Interfaz principal con temporizador y controles.
- **Lógica de Timer**: Cronómetro en tiempo real que soporta recargas de página.
- **Gestión de Jornada**: Funciones para `start`, `pause`, `resume`, `end`.
- **Historial**: Visualización de jornadas pasadas en tabla.

### 🚧 In Progress (En Progreso)

- **Documentación Scrum**: Generación de este reporte y artefactos.

### 📝 To Do (Pendiente)

- **Deploy**: Despliegue en un servidor estático (ej. Vercel/Netlify) o validación final en entorno de producción.

---

## 📅 Eventos Scrum

### 1. Sprint Planning

- **Asistentes**: Product Owner, Scrum Master, Equipo de Desarrollo.
- **Duración**: 1 hora.
- **Resumen**:
  - Se definió el **Sprint Goal** enfocándose en la funcionalidad core: el "Reloj Checador".
  - Se priorizaron las historias de usuario relacionadas con el flujo principal: Auth -> Marcar Entrada -> Pausa -> Salida.
  - Se estimó que el diseño sería "Mobile First" pero simple (MVP).

### 2. Daily Scrums (Reportes)

#### Daily #1 (Mitad del Sprint)

- **¿Qué hice ayer?**: Configuré la base de datos en Supabase y creé el HTML básico.
- **¿Qué haré hoy?**: Conectar los formularios de registro y login con Javascript.
- **¿Impedimentos?**: Problemas iniciales con las políticas RLS de Supabase (Solucionado: se permitió acceso `authenticated`).

#### Daily #2 (Final del Desarrollo)

- **¿Qué hice ayer?**: Terminé la lógica del temporizador y el cálculo de horas trabajadas.
- **¿Qué haré hoy?**: Pruebas finales de todo el flujo y documentación de instalación.
- **¿Impedimentos?**: Ninguno. El incremento está listo para revisión.

### 3. Sprint Review

- **Demostración**: Se presenta el software funcionando (archivos en `htdocs`).
- **Feedback**:
  - El flujo es claro.
  - El temporizador mantiene el estado al recargar (persistencia correcta).
- **Aprobación**: ✅ El incremento cumple con el "Definition of Done".

### 4. Sprint Retrospective

- **Lo que hicimos bien**:
  - La arquitectura simple (HTML/JS Vanilla) facilitó el desarrollo rápido.
  - El uso de Supabase ahorró mucho tiempo de Backend.
- **Lo que podemos mejorar**:
  - El diseño CSS podría ser más responsivo en móviles muy pequeños.
  - Faltan validaciones de errores más amigables en el formulario (actualmente usa `alert`).
- **Action Items**:
  - Agregar validaciones visuales en el próximo Sprint.

---

## 📦 Incremento Funcional

El código actual en `c:\xampp\htdocs\ANTIGRAVITY` representa el incremento funcional terminado.

- **Tech Stack**: HTML5, CSS3, Vanilla JS, Supabase.
- **Estado**: Listo para ejecución local con XAMPP.
