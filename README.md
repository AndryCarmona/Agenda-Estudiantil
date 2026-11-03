# AgendaU · Agenda universitaria (frontend)

Aplicación web para que **el estudiante administre lo suyo**: materias y calificaciones, agenda, concursos/hackathons y un borrador de CV.
Solo frontend: **React + Vite + React Router**. Los datos se guardan en el navegador (`localStorage`; los archivos en `IndexedDB`).

## Ejecutar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera /dist
```

## Desplegar en Vercel

1. Sube el proyecto a tu repositorio de GitHub.
2. En Vercel: **Add New → Project** y elige el repositorio (detecta Vite: build `npm run build`, salida `dist`).
3. `vercel.json` ya incluye el rewrite para que `/agenda`, `/materias/…` etc. funcionen al recargar.

## Cuenta de demostración

`ana@universidad.edu` / `estudiante123` (o el botón «Entrar con la cuenta de demostración»).
También se puede crear una cuenta nueva. **Restablecer demo** (barra lateral) regenera los datos de ejemplo.

## Qué hace

| Sección | Descripción |
| ------- | ----------- |
| **Materias** | Alta de materias (semestre, profesor, horario, calificación mínima). En cada una: tabla de **rubros** (nombre, peso %, calificación) con puntos acumulados y la tarjeta **«¿Qué necesito para aprobar?»**: promedio mínimo requerido en lo pendiente, máximo posible, y avisos de riesgo. Escala 0–100. |
| **Agenda** | Calendario con exámenes, proyectos, tareas y recordatorios (con o sin materia). Los concursos aparecen en los días que duran. Marcar como completada. |
| **Concursos** | Nombre, empresa/organización que lo propuso, lugar, fecha de inicio y término, resultado, descripción de tu experiencia, lo que se hizo, **URL del proyecto desplegado** y **archivos adjuntos** (máx. 10 MB c/u, guardados en este navegador). |
| **CV** | «Generar Borrador de CV»: una página con tus concursos, enlaces y materias. Avisa si aún no tienes concursos. Se puede imprimir/guardar como PDF. |
| **Lumi** (avatar morado) | Asistente flotante que avisa de entregas vencidas o próximas (7 días), recordatorios y concursos (14 días); su cara cambia si hay algo urgente. Clic en él para ver todos los avisos. |

## Cálculo de «qué necesito para aprobar»

```
puntos       = Σ (calificación × peso / 100)        ← solo rubros ya calificados
pendiente    = Σ peso de rubros sin calificación
necesario    = (mínimo − puntos) / pendiente × 100  ← promedio requerido en lo pendiente
máximo       = puntos + pendiente                   ← si sacas 100 en todo lo que falta
```

## Estructura

```
src/
  context/    Data (store + localStorage), Auth (sesión), Toast
  data/       seed.js  → datos de demostración
  lib/        dates.js, grades.js (cálculo), progress.js (avisos), files.js (IndexedDB)
  components/ Layout, Mascot (Lumi), AgendaParts, ui
  pages/      Login, Dashboard, Agenda, Materias, MateriaDetalle, Concursos, CVPreview
```

## Notas

- La autenticación es **simulada** (contraseñas en texto plano en el navegador, solo para demo). Con backend real, el cifrado va en el servidor.
- Los datos y archivos viven solo en el navegador del usuario; no se comparten entre dispositivos hasta que exista un backend.
- Toda la lectura/escritura pasa por `DataContext.jsx` y `AuthContext.jsx`: ahí se sustituye por llamadas a una API.
