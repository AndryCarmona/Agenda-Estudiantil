import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookPlus, BookX, Clock, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData, useMine } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { ESTADO_INFO, fmt, resumenMateria, textoNecesidad } from '../lib/grades';
import { entregasMateria } from '../lib/progress';
import { Badge, EmptyState, Field, Modal, PageHeader, ProgressBar } from '../components/ui';

export const TAGS = ['var(--primary)', 'var(--mostaza)', 'var(--salvia)', 'var(--cielo)', 'var(--terracota)'];

/** Semestres del usuario; por defecto el de la última materia registrada. */
export const useSemestres = (materias) =>
  useMemo(() => {
    const list = [...new Set(materias.map((m) => m.semestre))];
    return { list, actual: materias.length ? materias[materias.length - 1].semestre : '' };
  }, [materias]);

export default function Materias() {
  const { user } = useAuth();
  const { data, addMateria } = useData();
  const mine = useMine(user.id);
  const toast = useToast();
  const navigate = useNavigate();
  const { list, actual } = useSemestres(mine.materias);
  const [semestre, setSemestre] = useState('todos');
  const [open, setOpen] = useState(false);

  const visibles = mine.materias.filter((m) => semestre === 'todos' || m.semestre === semestre);

  const guardar = (v) => {
    const id = addMateria({ ...v, rubros: [] }, user.id);
    setOpen(false);
    toast('Materia creada. Ahora agrega sus rubros de calificación.');
    navigate(`/materias/${id}`);
  };

  return (
    <>
      <PageHeader eyebrow="Seguimiento académico" title="Mis materias" subtitle="Registra tus rubros de calificación y mira qué necesitas para aprobar cada materia.">
        {list.length > 1 && (
          <select className="input" style={{ width: 'auto' }} value={semestre} onChange={(e) => setSemestre(e.target.value)} aria-label="Semestre">
            <option value="todos">Todos los semestres</option>
            {list.map((s) => (
              <option key={s} value={s}>{s}{s === actual ? ' (actual)' : ''}</option>
            ))}
          </select>
        )}
        <button className="btn btn--primary" onClick={() => setOpen(true)}>
          <BookPlus size={18} aria-hidden /> Nueva materia
        </button>
      </PageHeader>

      {visibles.length === 0 ? (
        <div className="card">
          <EmptyState icon={BookX} title="Aún no tienes materias">Agrega tu primera materia para empezar a registrar calificaciones.</EmptyState>
        </div>
      ) : (
        <div className="grid grid--auto">
          {visibles.map((m, i) => {
            const res = resumenMateria(m);
            const info = ESTADO_INFO[res.estado];
            const ent = entregasMateria(data.agenda.filter((a) => a.id_estudiante === user.id), m.id);
            return (
              <article key={m.id} className="card materia reveal" style={{ '--i': i, '--tag': TAGS[i % TAGS.length] }}>
                <span className="materia__tag" aria-hidden />
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <h3>{m.nombre_materia}</h3>
                    <Badge tone={info.tone}>{info.label}</Badge>
                  </div>
                  <div className="item__meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    {m.docente && <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><GraduationCap size={14} aria-hidden /> {m.docente}</span>}
                    {m.horario_curso && <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Clock size={14} aria-hidden /> {m.horario_curso}</span>}
                    <span>{m.semestre}</span>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="materia__pct">{fmt(res.puntos)}<small className="muted" style={{ fontSize: '0.9rem', fontWeight: 600 }}> / 100</small></span>
                    <span className="small muted">Mínimo {fmt(res.aprob)}</span>
                  </div>
                  <ProgressBar value={res.puntos} marker={res.aprob} tone={res.estado === 'aprobada' ? 'sage' : ''} label={`Puntos acumulados en ${m.nombre_materia}`} />
                </div>
                <p className={`need need--${res.estado}`}>{textoNecesidad(res)}</p>
                <div className="actions" style={{ justifyContent: 'space-between' }}>
                  <span className="small muted">{ent.total ? `${ent.done} de ${ent.total} entregas listas` : 'Sin entregas en agenda'}</span>
                  <Link to={`/materias/${m.id}`} className="btn btn--sm">Ver tabla <ArrowRight size={15} aria-hidden /></Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva materia">
        <MateriaForm initial={{ semestre: actual }} onSubmit={guardar} onCancel={() => setOpen(false)} submitLabel="Crear materia" semestres={list} />
      </Modal>
    </>
  );
}

export function MateriaForm({ initial = {}, onSubmit, onCancel, submitLabel = 'Guardar', semestres = [] }) {
  const [v, setV] = useState({
    nombre_materia: initial.nombre_materia || '',
    docente: initial.docente || '',
    horario_curso: initial.horario_curso || '',
    semestre: initial.semestre || '',
    calif_aprobatoria: initial.calif_aprobatoria ?? 70,
  });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (v.nombre_materia.trim().length < 2) errs.nombre_materia = 'Escribe el nombre de la materia.';
    if (!v.semestre.trim()) errs.semestre = 'Indica el semestre o periodo.';
    const c = Number(v.calif_aprobatoria);
    if (!(c > 0 && c <= 100)) errs.calif_aprobatoria = 'Un valor entre 1 y 100.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit({ ...v, nombre_materia: v.nombre_materia.trim(), docente: v.docente.trim(), horario_curso: v.horario_curso.trim(), semestre: v.semestre.trim(), calif_aprobatoria: c });
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field label="Nombre de la materia" id="m-nombre" error={errors.nombre_materia}>
        <input id="m-nombre" className="input" value={v.nombre_materia} onChange={set('nombre_materia')} aria-invalid={!!errors.nombre_materia} />
      </Field>
      <div className="row">
        <Field label="Profesor (opcional)" id="m-doc">
          <input id="m-doc" className="input" value={v.docente} onChange={set('docente')} />
        </Field>
        <Field label="Horario (opcional)" id="m-hor">
          <input id="m-hor" className="input" value={v.horario_curso} onChange={set('horario_curso')} placeholder="Lun y Mié · 10:00–12:00" />
        </Field>
      </div>
      <div className="row">
        <Field label="Semestre / periodo" id="m-sem" error={errors.semestre}>
          <input id="m-sem" className="input" list="semestres" value={v.semestre} onChange={set('semestre')} placeholder="Ago–Dic 2026" aria-invalid={!!errors.semestre} />
          <datalist id="semestres">{semestres.map((s) => <option key={s} value={s} />)}</datalist>
        </Field>
        <Field label="Calificación mínima para aprobar" id="m-apr" error={errors.calif_aprobatoria} hint="Escala de 0 a 100.">
          <input id="m-apr" type="number" min="1" max="100" className="input" value={v.calif_aprobatoria} onChange={set('calif_aprobatoria')} aria-invalid={!!errors.calif_aprobatoria} />
        </Field>
      </div>
      <div className="actions" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn--primary">{submitLabel}</button>
      </div>
    </form>
  );
}
