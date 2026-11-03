import { useMemo, useState } from 'react';
import { CalendarPlus, CalendarX2, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData, useMine } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { AgendaForm, AgendaRow } from '../components/AgendaParts';
import { Badge, EmptyState, Modal, PageHeader } from '../components/ui';
import { dayKey, formatDateLong, formatMonth, isSameDay, monthGrid, parse, toInput } from '../lib/dates';
import { rangoFechas } from './Concursos';

const DOW = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function Agenda() {
  const { user } = useAuth();
  const { addAgenda, toggleAgenda, deleteAgenda } = useData();
  const mine = useMine(user.id);
  const toast = useToast();

  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [filtro, setFiltro] = useState('todas');
  const [open, setOpen] = useState(false);
  const [prefillDate, setPrefillDate] = useState('');

  const misMaterias = mine.materias;
  const nombreMateria = (id) => misMaterias.find((m) => m.id === id)?.nombre_materia;

  const items = useMemo(
    () => mine.agenda.filter((a) => filtro === 'todas' || a.id_materia === filtro),
    [mine.agenda, filtro],
  );

  // Los concursos aparecen en cada día que dura el evento.
  const byDay = useMemo(() => {
    const map = {};
    const cell = (k) => (map[k] ||= { tareas: [], eventos: [] });
    items.forEach((a) => cell(dayKey(parse(a.fecha_limite))).tareas.push(a));
    if (filtro === 'todas') {
      mine.concursos.forEach((c) => {
        const d = parse(c.fecha_inicio);
        const end = parse(c.fecha_termino);
        for (let i = 0; i < 40 && d <= end; i++) {
          cell(dayKey(d)).eventos.push(c);
          d.setDate(d.getDate() + 1);
        }
      });
    }
    return map;
  }, [items, mine.concursos, filtro]);

  const grid = monthGrid(cursor);
  const today = new Date();
  const sel = byDay[dayKey(selected)] || { tareas: [], eventos: [] };
  const selTareas = [...sel.tareas].sort((a, b) => parse(a.fecha_limite) - parse(b.fecha_limite));

  const openNew = (date) => {
    const base = new Date(date || selected);
    base.setHours(12, 0, 0, 0);
    setPrefillDate(toInput(base));
    setOpen(true);
  };

  const move = (n) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));

  const save = (values) => {
    addAgenda({ ...values, id_estudiante: user.id });
    setOpen(false);
    setSelected(parse(values.fecha_limite));
    setCursor(parse(values.fecha_limite));
    toast('Agregado a tu agenda con estado «Pendiente»');
  };

  const onToggle = (id) => {
    const it = mine.agenda.find((a) => a.id === id);
    toggleAgenda(id);
    toast(it.estado === 'completada' ? 'Marcada como pendiente' : '¡Completada! Tu avance se actualizó', it.estado === 'completada' ? 'info' : 'ok');
  };

  return (
    <>
      <PageHeader eyebrow="Gestión de tiempos" title="Mi agenda" subtitle="Registra exámenes, proyectos, tareas y recordatorios; tus concursos también aparecen aquí.">
        <select className="input" style={{ width: 'auto', maxWidth: '100%' }} value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por materia">
          <option value="todas">Todas las materias</option>
          {misMaterias.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre_materia}</option>
          ))}
        </select>
        <button className="btn btn--primary" onClick={() => openNew()}>
          <CalendarPlus size={18} aria-hidden /> Nueva fecha
        </button>
      </PageHeader>

      <div className="agenda-layout">
        <section className="card reveal" style={{ '--i': 1 }} aria-label="Calendario">
          <div className="cal-head">
            <h2>{formatMonth(cursor)}</h2>
            <div className="actions">
              <button className="btn btn--sm btn--ghost" onClick={() => { setCursor(new Date()); setSelected(new Date()); }}>Hoy</button>
              <button className="icon-btn" onClick={() => move(-1)} aria-label="Mes anterior"><ChevronLeft size={18} /></button>
              <button className="icon-btn" onClick={() => move(1)} aria-label="Mes siguiente"><ChevronRight size={18} /></button>
            </div>
          </div>
          <div className="cal" role="grid">
            {DOW.map((d, i) => (
              <div key={i} className="cal__dow" role="columnheader">{d}</div>
            ))}
            {grid.map((d) => {
              const k = dayKey(d);
              const cell = byDay[k] || { tareas: [], eventos: [] };
              const all = [...cell.tareas.map((t) => ({ k: t.id, tipo: t.tipo, text: t.titulo, done: t.estado === 'completada' })), ...cell.eventos.map((e) => ({ k: e.id, tipo: 'concurso', text: e.nombre }))];
              return (
                <button
                  key={k}
                  type="button"
                  role="gridcell"
                  className={`cal__day ${d.getMonth() !== cursor.getMonth() ? 'cal__day--out' : ''} ${isSameDay(d, today) ? 'cal__day--today' : ''} ${isSameDay(d, selected) ? 'cal__day--sel' : ''}`}
                  onClick={() => setSelected(d)}
                  onDoubleClick={() => openNew(d)}
                  aria-label={`${formatDateLong(d)}${all.length ? `, ${all.length} elementos` : ''}`}
                  aria-pressed={isSameDay(d, selected)}
                >
                  <span className="cal__num">{d.getDate()}</span>
                  {all.slice(0, 2).map((c) => (
                    <span key={c.k} className={`chip chip--${c.tipo} ${c.done ? 'chip--done' : ''}`}>{c.text}</span>
                  ))}
                  {all.length > 2 && <span className="cal__more">+{all.length - 2} más</span>}
                  {all.length > 0 && (
                    <span className="dots" aria-hidden>
                      {all.slice(0, 4).map((c) => (
                        <i key={c.k} className={`d-${c.tipo}`} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="legend" aria-hidden>
            <span><i style={{ background: 'var(--terracota)' }} /> Examen</span>
            <span><i style={{ background: 'var(--mostaza)' }} /> Proyecto</span>
            <span><i style={{ background: 'var(--cielo)' }} /> Tarea</span>
            <span><i style={{ background: 'var(--salvia)' }} /> Recordatorio</span>
            <span><i style={{ background: 'var(--primary)' }} /> Concurso</span>
          </div>
        </section>

        <aside className="card reveal" style={{ '--i': 2 }} aria-live="polite">
          <div className="card__head">
            <div>
              <div className="eyebrow">Día seleccionado</div>
              <h2 className="cap">{formatDateLong(selected)}</h2>
            </div>
            <button className="btn btn--sm" onClick={() => openNew()}>
              <CalendarPlus size={15} aria-hidden /> Agregar
            </button>
          </div>

          {sel.eventos.length > 0 && (
            <ul className="list" style={{ marginBottom: '0.6rem' }}>
              {sel.eventos.map((e) => (
                <li key={e.id} className="item" style={{ borderColor: 'var(--primary)', background: 'var(--primary-l)' }}>
                  <div className="item__body">
                    <div className="item__title"><Link to="/concursos">{e.nombre}</Link></div>
                    <div className="item__meta">
                      <Badge tone="concurso">Concurso</Badge>
                      <span>{rangoFechas(e)}</span>
                      {e.lugar && <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><MapPin size={13} aria-hidden /> {e.lugar}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {selTareas.length === 0 && sel.eventos.length === 0 ? (
            <EmptyState icon={CalendarX2} title="Sin fechas este día">Toca «Agregar» para registrar una tarea, examen o recordatorio.</EmptyState>
          ) : (
            <ul className="list">
              {selTareas.map((a) => (
                <AgendaRow key={a.id} item={a} materia={nombreMateria(a.id_materia)} onToggle={onToggle} onDelete={(id) => { deleteAgenda(id); toast('Eliminado de tu agenda', 'info'); }} />
              ))}
            </ul>
          )}
        </aside>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva fecha o tarea">
        <AgendaForm materias={misMaterias} initial={{ id_materia: filtro !== 'todas' ? filtro : undefined, fecha_limite: prefillDate }} onSubmit={save} onCancel={() => setOpen(false)} />
      </Modal>
    </>
  );
}
