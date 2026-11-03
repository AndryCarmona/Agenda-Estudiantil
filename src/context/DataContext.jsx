import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buildSeed } from '../data/seed';
import { toInput } from '../lib/dates';

/**
 * "Base de datos" simulada en el navegador (localStorage).
 * Toda la persistencia pasa por aquí: con un backend real, solo hay que reemplazar el cuerpo
 * de estas acciones por llamadas HTTP. (Los archivos adjuntos viven en IndexedDB, ver lib/files.js.)
 */
const KEY = 'agendau:data:v2';
const DataContext = createContext(null);
export const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* datos corruptos: se regeneran */
  }
  return buildSeed();
}

export function DataProvider({ children }) {
  const [data, setData] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* almacenamiento lleno o bloqueado */
    }
  }, [data]);

  const set = useCallback((fn) => setData((s) => fn(s)), []);

  const actions = useMemo(
    () => ({
      // ---------- Cuenta ----------
      registerStudent: ({ nombre, matricula, correo, password }) => {
        const id = uid('u');
        set((s) => ({ ...s, users: [...s.users, { id, nombre, matricula, correo, password }] }));
        return id;
      },

      // ---------- Materias y rubros ----------
      addMateria: (m, studentId) => {
        const id = uid('m');
        set((s) => ({ ...s, materias: [...s.materias, { id, id_estudiante: studentId, rubros: [], ...m }] }));
        return id;
      },
      updateMateria: (id, patch) => set((s) => ({ ...s, materias: s.materias.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      deleteMateria: (id) =>
        set((s) => ({ ...s, materias: s.materias.filter((m) => m.id !== id), agenda: s.agenda.filter((a) => a.id_materia !== id) })),

      // ---------- Agenda ----------
      addAgenda: (entry) =>
        set((s) => ({
          ...s,
          agenda: [...s.agenda, { id: uid('ag'), descripcion: '', id_materia: '', ...entry, fecha_creacion: toInput(new Date()), estado: 'pendiente' }],
        })),
      toggleAgenda: (id) =>
        set((s) => ({
          ...s,
          agenda: s.agenda.map((a) => (a.id === id ? { ...a, estado: a.estado === 'completada' ? 'pendiente' : 'completada' } : a)),
        })),
      deleteAgenda: (id) => set((s) => ({ ...s, agenda: s.agenda.filter((a) => a.id !== id) })),

      // ---------- Concursos ----------
      addConcurso: (c, studentId) => {
        const id = uid('c');
        set((s) => ({ ...s, concursos: [...s.concursos, { id, id_estudiante: studentId, archivos: [], ...c }] }));
        return id;
      },
      updateConcurso: (id, patch) => set((s) => ({ ...s, concursos: s.concursos.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteConcurso: (id) => set((s) => ({ ...s, concursos: s.concursos.filter((c) => c.id !== id) })),

      resetDemo: () => setData(buildSeed()),
    }),
    [set],
  );

  const value = useMemo(() => ({ data, ...actions }), [data, actions]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);

/** Datos del estudiante con sesión iniciada (todo lo demás se filtra aquí). */
export function useMine(userId) {
  const { data } = useData();
  return useMemo(
    () => ({
      materias: data.materias.filter((m) => m.id_estudiante === userId),
      agenda: data.agenda.filter((a) => a.id_estudiante === userId),
      concursos: data.concursos.filter((c) => c.id_estudiante === userId),
    }),
    [data, userId],
  );
}
