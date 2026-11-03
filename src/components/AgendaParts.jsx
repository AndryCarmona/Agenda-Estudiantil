import { useState } from 'react';
import { Circle, CircleCheckBig, Trash2 } from 'lucide-react';
import { Badge, Field } from './ui';
import { TIPOS_AGENDA } from '../data/seed';
import { estadoVisible } from '../lib/progress';
import { formatDateTime, relative } from '../lib/dates';

const LABEL_ESTADO = { pendiente: 'Pendiente', completada: 'Completada', vencida: 'Vencida' };
export const labelTipo = (t) => TIPOS_AGENDA.find((x) => x.value === t)?.label || t;

/** Fila de evaluación/tarea con casilla para marcarla (HU-04). */
export function AgendaRow({ item, materia, onToggle, onDelete }) {
  const estado = estadoVisible(item);
  return (
    <li className={`item ${estado === 'completada' ? 'item--done' : ''} ${estado === 'vencida' ? 'item--late' : ''}`}>
      <button
        className="check"
        role="checkbox"
        aria-checked={item.estado === 'completada'}
        aria-label={`Marcar "${item.titulo}" como ${item.estado === 'completada' ? 'pendiente' : 'completada'}`}
        onClick={() => onToggle(item.id)}
      >
        {item.estado === 'completada' ? <CircleCheckBig size={26} /> : <Circle size={26} />}
      </button>
      <div className="item__body">
        <div className="item__title">{item.titulo}</div>
        <div className="item__meta">
          <Badge tone={item.tipo}>{labelTipo(item.tipo)}</Badge>
          <Badge tone={estado}>{LABEL_ESTADO[estado]}</Badge>
          {materia && <span>{materia}</span>}
        </div>
        <div className="item__meta">
          <span>{formatDateTime(item.fecha_limite)}</span>
          {item.estado === 'pendiente' && <strong style={{ color: estado === 'vencida' ? 'var(--rosa-d)' : 'var(--terracota-d)' }}>{relative(item.fecha_limite)}</strong>}
        </div>
        {item.descripcion && <p className="small muted" style={{ marginTop: '0.3rem' }}>{item.descripcion}</p>}
      </div>
      {onDelete && (
        <button className="icon-btn" style={{ border: 0, background: 'transparent' }} onClick={() => onDelete(item.id)} aria-label={`Eliminar ${item.titulo}`}>
          <Trash2 size={17} />
        </button>
      )}
    </li>
  );
}

/** Formulario para crear una evaluación (HU-03). `materias` = [{id, nombre_materia}] */
export function AgendaForm({ materias, initial = {}, onSubmit, onCancel, submitLabel = 'Guardar en la agenda', hideMateria = false }) {
  const [v, setV] = useState({
    id_materia: initial.id_materia ?? '',
    titulo: '',
    tipo: 'tarea',
    fecha_limite: initial.fecha_limite || '',
    descripcion: '',
  });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (v.tipo !== 'otro' && !v.id_materia) errs.id_materia = 'Elige una materia (o usa «Recordatorio»).';
    if (v.titulo.trim().length < 3) errs.titulo = 'Escribe un título (mín. 3 caracteres).';
    if (!v.fecha_limite) errs.fecha_limite = 'Define la fecha límite.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit({ ...v, titulo: v.titulo.trim(), descripcion: v.descripcion.trim() });
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      {!hideMateria && (
        <Field label={v.tipo === 'otro' ? 'Materia (opcional)' : 'Materia'} id="f-materia" error={errors.id_materia}>
          <select id="f-materia" className="input" value={v.id_materia} onChange={set('id_materia')} aria-invalid={!!errors.id_materia}>
            <option value="">{v.tipo === 'otro' ? 'Sin materia' : 'Elige una materia…'}</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre_materia}</option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Título" id="f-titulo" error={errors.titulo}>
        <input id="f-titulo" className="input" value={v.titulo} onChange={set('titulo')} placeholder="Ej. Examen parcial 2" aria-invalid={!!errors.titulo} />
      </Field>
      <div className="row">
        <Field label="Tipo" id="f-tipo">
          <select id="f-tipo" className="input" value={v.tipo} onChange={set('tipo')}>
            {TIPOS_AGENDA.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Fecha límite" id="f-fecha" error={errors.fecha_limite}>
          <input id="f-fecha" type="datetime-local" className="input" value={v.fecha_limite} onChange={set('fecha_limite')} aria-invalid={!!errors.fecha_limite} />
        </Field>
      </div>
      <Field label="Descripción (opcional)" id="f-desc">
        <textarea id="f-desc" className="input" value={v.descripcion} onChange={set('descripcion')} placeholder="Temas, formato de entrega, recordatorios…" />
      </Field>
      <div className="actions" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn--primary">{submitLabel}</button>
      </div>
    </form>
  );
}
