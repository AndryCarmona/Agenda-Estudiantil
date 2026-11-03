import { parse, isPast, relative } from './dates';

/** Entregas completadas / total de una materia. */
export function entregasMateria(agenda, materiaId) {
  const items = agenda.filter((a) => a.id_materia === materiaId);
  const done = items.filter((a) => a.estado === 'completada').length;
  return { total: items.length, done };
}

/** Estado visible: una tarea pendiente cuya fecha ya pasó se muestra como "Vencida". */
export function estadoVisible(item) {
  if (item.estado === 'completada') return 'completada';
  return isPast(item.fecha_limite) ? 'vencida' : 'pendiente';
}

/** Estado de un concurso según sus fechas. */
export function estadoConcurso(c) {
  const now = Date.now();
  if (now < parse(c.fecha_inicio).getTime()) return 'proximo';
  if (now <= parse(c.fecha_termino).getTime()) return 'en-curso';
  return 'finalizado';
}

const DAY = 86400000;

/**
 * Avisos para el avatar: entregas/recordatorios pendientes (vencidos recientes o en los próximos 7 días)
 * y concursos en curso o que empiezan en los próximos 14 días.
 * level: 'vencida' | 'hoy' (< 24 h) | 'pronto' (≤ 3 días) | 'semana'
 */
export function buildAlerts({ agenda, concursos, materias }) {
  const now = Date.now();
  const alerts = [];
  const levelOf = (diff) => (diff < 0 ? 'vencida' : diff < DAY ? 'hoy' : diff <= 3 * DAY ? 'pronto' : 'semana');

  agenda
    .filter((a) => a.estado === 'pendiente')
    .forEach((a) => {
      const t = parse(a.fecha_limite).getTime();
      const diff = t - now;
      if (diff < -7 * DAY || diff > 7 * DAY) return;
      const materia = materias.find((m) => m.id === a.id_materia)?.nombre_materia;
      alerts.push({
        id: `a-${a.id}`, kind: 'agenda', tipo: a.tipo, level: levelOf(diff), time: t, titulo: a.titulo, detalle: materia || (a.tipo === 'otro' ? 'Recordatorio' : ''),
        cuando: relative(a.fecha_limite), to: '/agenda',
      });
    });

  concursos.forEach((c) => {
    const ini = parse(c.fecha_inicio).getTime();
    const fin = parse(c.fecha_termino).getTime();
    if (fin < now) return;
    if (ini <= now) {
      alerts.push({ id: `c-${c.id}`, kind: 'concurso', tipo: 'concurso', level: 'hoy', time: fin, titulo: c.nombre, detalle: c.lugar, cuando: 'en curso', enCurso: true, to: '/concursos' });
    } else if (ini - now <= 14 * DAY) {
      alerts.push({ id: `c-${c.id}`, kind: 'concurso', tipo: 'concurso', level: levelOf(ini - now), time: ini, titulo: c.nombre, detalle: c.lugar, cuando: relative(c.fecha_inicio), to: '/concursos' });
    }
  });

  return alerts.sort((a, b) => a.time - b.time);
}

/** Frase del avatar para un aviso. */
export function frase(a) {
  if (a.kind === 'concurso') return a.enCurso ? `¡Hoy participas en «${a.titulo}»! Mucha suerte 💜` : `Tu concurso «${a.titulo}» empieza ${a.cuando}. ¡Prepárate!`;
  if (a.level === 'vencida') return `Se te pasó «${a.titulo}» (${a.cuando}). Si ya la hiciste, márcala como completada.`;
  if (a.tipo === 'otro') return `Recordatorio: «${a.titulo}» ${a.cuando}.`;
  return `«${a.titulo}» vence ${a.cuando}.`;
}
