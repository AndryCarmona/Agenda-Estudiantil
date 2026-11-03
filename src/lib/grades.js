// Cálculo de calificaciones. Escala fija 0–100; los rubros ponderan sobre 100.
const hasGrade = (r) => r.calificacion !== null && r.calificacion !== undefined && r.calificacion !== '';

export const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(1))));
export const aporte = (r) => (hasGrade(r) ? (Number(r.calificacion) * Number(r.peso)) / 100 : 0);

/**
 * Resumen de una materia:
 *  - puntos: lo acumulado hasta ahora (sobre 100)
 *  - pesoPendiente: % de rubros sin calificación
 *  - necesario: promedio mínimo que se requiere en los rubros pendientes para aprobar
 *  - estado: 'sin-rubros' | 'aprobada' | 'en-curso' | 'imposible' | 'reprobada'
 */
export function resumenMateria(materia) {
  const rubros = materia.rubros || [];
  const aprob = Number(materia.calif_aprobatoria) || 70;
  const pesoTotal = rubros.reduce((s, r) => s + (Number(r.peso) || 0), 0);
  const evaluados = rubros.filter(hasGrade);
  const pendientes = rubros.filter((r) => !hasGrade(r));
  const pesoEvaluado = evaluados.reduce((s, r) => s + (Number(r.peso) || 0), 0);
  const pesoPendiente = pesoTotal - pesoEvaluado;
  const puntos = evaluados.reduce((s, r) => s + aporte(r), 0);
  const promedioActual = pesoEvaluado > 0 ? (puntos * 100) / pesoEvaluado : null;
  const maximo = puntos + pesoPendiente; // si saca 100 en todo lo que falta
  const proyectado = promedioActual !== null ? puntos + (pesoPendiente * promedioActual) / 100 : null;
  const necesario = pesoPendiente > 0 ? ((aprob - puntos) * 100) / pesoPendiente : null;

  let estado;
  if (rubros.length === 0 || pesoTotal === 0) estado = 'sin-rubros';
  else if (puntos >= aprob) estado = 'aprobada';
  else if (pesoPendiente <= 0) estado = 'reprobada';
  else if (necesario > 100) estado = 'imposible';
  else estado = 'en-curso';

  return { aprob, pesoTotal, pesoEvaluado, pesoPendiente, puntos, promedioActual, maximo, proyectado, necesario, pendientes, estado };
}

export const ESTADO_INFO = {
  'sin-rubros': { label: 'Sin rubros', tone: 'pendiente' },
  aprobada: { label: 'Aprobada', tone: 'completada' },
  'en-curso': { label: 'En curso', tone: 'inscrito' },
  imposible: { label: 'En riesgo', tone: 'vencida' },
  reprobada: { label: 'No aprobada', tone: 'vencida' },
};

/** Texto corto: qué necesita el alumno. */
export function textoNecesidad(res) {
  switch (res.estado) {
    case 'sin-rubros':
      return 'Agrega tus rubros de calificación.';
    case 'aprobada':
      return `Ya aseguraste los ${fmt(res.aprob)} para aprobar.`;
    case 'reprobada':
      return `Cerraste con ${fmt(res.puntos)}; el mínimo era ${fmt(res.aprob)}.`;
    case 'imposible':
      return `Aun con 100 en lo que falta llegas a ${fmt(res.maximo)}.`;
    default:
      return `Necesitas promedio ${fmt(Math.max(res.necesario, 0))} en el ${fmt(res.pesoPendiente)}% pendiente.`;
  }
}
