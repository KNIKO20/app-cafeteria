# Resolución Técnica: Flujo de Autenticación Google OAuth

Este documento detalla los problemas encontrados durante la implementación del inicio de sesión con Google y cómo fueron resueltos finalmente.

## 1. Problemas Identificados

### A. Estructura de Respuesta en Web (Frontend)
*   **Síntoma:** El frontend de Expo no detectaba el token al ejecutarse en el navegador.
*   **Causa:** En plataformas web, `useAuthRequest` devuelve los parámetros dentro de un objeto `params` en la respuesta (por ejemplo, `response.params.id_token`), a diferencia de las apps nativas donde la estructura varía. Además, se migró a `idToken` para obtener el JWT directamente.

### B. Error 401: Token used too early (Clock Skew)
*   **Síntoma:** El backend devolvía `Unauthorized (401)` con el mensaje `Token used too early`.
*   **Causa:** Desincronización horaria entre el reloj local y los servidores de Google. El token se consideraba "no válido aún" por una diferencia de apenas unos segundos.

### C. Error 500: TypeError en Backend
*   **Síntoma:** Tras intentar corregir el Clock Skew, el backend fallaba con un error interno.
*   **Causa:** Uso de un nombre de parámetro incorrecto (`clock_skew`) en la función `verify_oauth2_token`. Se corrigió con `clock_skew_in_seconds=10`.

## 2. Soluciones Implementadas

### Backend
*   **Soporte de Margen Horario:** Se modificó `GoogleAuthProvider` para incluir `clock_skew_in_seconds=10` en la verificación del token.
*   **Limpieza de Repositorios:** Se aseguró el uso de `FakeUserRepository` para facilitar las pruebas locales sin depender de MongoDB.

### Frontend
*   **Migración a ID Token:** Se cambió `Google.useAuthRequest` por `Google.useIdTokenAuthRequest` para obtener el JWT necesario para el backend.
*   **Lógica de Extracción Robusta:** Se actualizó `login.tsx` para buscar el token tanto en la raíz como dentro de `response.params`, asegurando compatibilidad total con la plataforma Web.
*   **Título de Verificación:** Se actualizó el título de la página de login para confirmar que los cambios de código se están sirviendo correctamente.

## 3. Estado Final
*   ✅ Login con Google operativo al 100% en Web.
*   ✅ Backend recibe y valida el token correctamente.
*   ✅ Redirección al menú tras inicio de sesión exitoso.

---
*Sesión finalizada el 07/04/2026 - Acceso validado.*
