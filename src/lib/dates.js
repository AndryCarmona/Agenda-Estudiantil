// Utilidades de fecha. Las fechas se guardan como "YYYY-MM-DDTHH:mm" (hora local).
const pad = (n) => String(n).padStart(2, '0');

export const toInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Fecha relativa a hoy: daysFromNow(2, 14, 30) => pasado mañana 14:30 */
export const daysFromNow = (days, hour = 12, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return toInput(d);
};

export const hoursFromNow = (hours) => toInput(new Date(Date.now() + hours * 3600 * 1000));

export const parse = (s) => new Date(s);

const fmt = (opts) => new Intl.DateTimeFormat('es-MX', opts);
const fDate = fmt({ day: 'numeric', month: 'short' });
const fDateLong = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const fTime = fmt({ hour: '2-digit', minute: '2-digit', hour12: false });
const fMonth = fmt({ month: 'long', year: 'numeric' });
const fMonthShort = fmt({ month: 'short', year: 'numeric' });

export const formatDate = (s) => fDate.format(parse(s)).replace('.', '');
export const formatDateLong = (d) => fDateLong.format(typeof d === 'string' ? parse(d) : d);
export const formatTime = (s) => fTime.format(parse(s));
export const formatDateTime = (s) => `${formatDate(s)} · ${formatTime(s)}`;
export const formatMonth = (d) => fMonth.format(d);
export const formatMonthShort = (d) => fMonthShort.format(d).replace('.', '');

export const isPast = (s) => parse(s).getTime() < Date.now();
export const isSameDay = (a, b) => dayKey(a) === dayKey(b);

/** Texto tipo "en 3 h", "mañana", "hace 2 días" */
export const relative = (s) => {
  const diff = parse(s).getTime() - Date.now();
  const abs = Math.abs(diff);
  const h = Math.round(abs / 3600000);
  const d = Math.round(abs / 86400000);
  if (diff < 0) return h < 24 ? `venció hace ${Math.max(h, 1)} h` : `venció hace ${d} d`;
  if (h < 1) return 'en menos de 1 h';
  if (h < 24) return `en ${h} h`;
  return d === 1 ? 'mañana' : `en ${d} días`;
};

/** Cuadrícula mensual (semanas que empiezan en lunes), siempre 6 filas. */
export const monthGrid = (base) => {
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // lunes = 0
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};
