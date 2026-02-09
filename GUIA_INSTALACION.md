# Guía de Instalación y Ejecución

Sigue estos 3 pasos sencillos para poner en marcha tu "Reloj Checador".

## Paso 1: Configurar Base de Datos (Supabase)

1.  Entra a tu proyecto en **[Supabase](https://supabase.com/dashboard/projects)**.
2.  Ve al **SQL Editor** (icono de hoja en la barra lateral izquierda).
3.  Crea una **New Query**.
4.  Copia todo el contenido del archivo `schema.sql` (ubicado en `c:\xampp\htdocs\ANTIGRAVITY\schema.sql`).
5.  Pégalo en el editor de Supabase y dale al botón **Run** (Ejecutar).
    - _Esto creará las tablas y las reglas de seguridad necesarias._

## Paso 2: Conectar la App

1.  En Supabase, ve a **Settings** (engranaje) -> **API**.
2.  Copia la **Project URL**.
3.  Copia la **anon public key**.
4.  Abre el archivo `c:\xampp\htdocs\ANTIGRAVITY\config.js` en tu editor de código.
5.  Pega tus datos donde dice `'TU_SUPABASE_URL_AQUI'` y `'TU_SUPABASE_ANON_KEY_AQUI'`.
    - _¡No borres las comillas simples!_

## Paso 3: ¡Ejecutar!

### Opción A: Usando XAMPP (Recomendado)

Como ya tienes los archivos en `c:\xampp\htdocs\ANTIGRAVITY`:

1.  Abre el panel de control de **XAMPP**.
2.  Asegúrate de que **Apache** esté iniciado (botón "Start").
3.  Abre tu navegador y entra a:
    `http://localhost/ANTIGRAVITY/`

### Opción B: Doble Clic (Simple)

Si no quieres usar XAMPP, simplemente ve a la carpeta `c:\xampp\htdocs\ANTIGRAVITY` y haz doble clic en el archivo `index.html`.
_Nota: Algunas funciones podrían bloquearse por seguridad del navegador si no usas un servidor como XAMPP, pero para esta configuración básica debería funcionar._

---

## 🚀 Probando la App

1.  **Regístrate**: Usa el formulario para crear un usuario de prueba (ej. `juan@test.com`).
2.  **Inicia Jornada**: Dale click al botón verde.
3.  **Pausa**: Prueba pausar y reanudar.
4.  **Verifica**: Si recargas la página, ¡tu sesión debería seguir activa!
