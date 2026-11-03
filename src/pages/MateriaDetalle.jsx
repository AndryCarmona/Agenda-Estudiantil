import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, CheckCircle2, Info, Pencil, Plus, Target, Trash2, TriangleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uid, useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { ESTADO_INFO, aporte, fmt, resumenMateria } from '../lib/grades';
import { AgendaForm, AgendaRow } from '../components/AgendaParts';
import { Badge, EmptyState, Modal, PageHeader, ProgressBar } from '../components/ui';
import { MateriaForm, useSemestres } from './Materias';
import { parse } from '../lib/dates';

export default function MateriaDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, updateMateria, deleteMateria, addAgenda, toggleAgenda, deleteAgenda } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState(false);

  const materia = data.materias.find((m) => m.id === id && m.id_estudiante === user.id);
  const todas = data.materias.filter((m) => m.id_estudiante === user.id);
  const { list: semestres } = useSemestres(todas);
  if (!materia) return <Navigate to="/materias" replace />;

  const res = resumenMateria(materia);
  const info = ESTADO_INFO[res.estado];
  const entregas = data.agenda.filter((a) => a.id_estudiante === user.id && a.id_materia === id).sort((a, b) => parse(a.fecha_limite) - parse(b.fecha_limite));

  const setRubros = (rubros) => updateMateria(id, { rubros });
  const changeRubro = (rid, patch) => setRubros(materia.rubros.map((r) => (r.id === rid ? { ...r, ...patch } : r)));
  const addRubro = () => setRubros([...materia.rubros, { id: uid('r'), nombre: '', peso: 0, calificacion: null }]);
  const delRubro = (rid) => setRubros(materia.rubros.filter((r) => r.id !== rid));

  return (
    <>
      <Link to="/materias" className="btn btn--sm btn--ghost no-print" style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={15} aria-hidden /> Mis materias
      </Link>
      <PageHeader eyebrow={`${materia.semestre}${materia.docente ? ` · ${materia.docente}` : ''}`} title={materia.nombre_materia} subtitle={materia.horario_curso}>
        <button className="btn" onClick={() => setEditando(true)}><Pencil size={16} aria-hidden /> Editar materia</button>
        <button
          className="btn btn--danger"
          onClick={() => {
            if (window.confirm(`¿Eliminar «${materia.nombre_materia}»? También se borrarán sus entregas de la agenda.`)) {
              deleteMateria(id);
              toast('Materia eliminada', 'info');
              navigate('/materias');
            }
          }}
        >
          <Trash2 size={16} aria-hidden /> Eliminar
        </button>
      </PageHeader>

      <Necesidad res={res} info={info} />

      <section className="card reveal" style={{ '--i': 2, marginTop: '1.25rem' }}>
        <div className="card__head">
          <h2>Rubros de calificación</h2>
          <button className="btn btn--sm btn--primary" onClick={addRubro}><Plus size={15} aria-hidden /> Agregar rubro</button>
        </div>

        {materia.rubros.length === 0 ? (
          <EmptyState icon={Target} title="Aún no hay rubros">Agrega tareas, exámenes, proyecto… con su porcentaje. Deja la calificación vacía si todavía no la tienes.</EmptyState>
        ) : (
          <>
            <div className="table-wrap">
              <table className="grades stack-table">
                <thead>
                  <tr>
                    <th>Rubro</th>
                    <th style={{ width: 110 }}>Peso (%)</th>
                    <th style={{ width: 140 }}>Calificación</th>
                    <th style={{ width: 110 }}>Aporta</th>
                    <th style={{ width: 52 }}><span className="sr-only">Quitar</span></th>
                  </tr>
                </thead>
                <tbody>
                  {materia.rubros.map((r) => (
                    <RubroRow key={r.id} rubro={r} onChange={(patch) => changeRubro(r.id, patch)} onDelete={() => delRubro(r.id)} />
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td data-label="Total"><strong>Total</strong></td>
                    <td data-label="Peso"><strong className={res.pesoTotal !== 100 ? 'text-warn' : ''}>{fmt(res.pesoTotal)}%</strong></td>
                    <td data-label="Promedio actual">{res.promedioActual !== null ? <strong>{fmt(res.promedioActual)}</strong> : <span className="muted">—</span>}</td>
                    <td data-label="Acumulado"><strong>{fmt(res.puntos)} pts</strong></td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            {res.pesoTotal !== 100 && (
              <div className="alert alert--warn" role="alert" style={{ marginTop: '0.8rem' }}>
                <TriangleAlert size={18} aria-hidden />
                Los rubros suman {fmt(res.pesoTotal)}%. Para un cálculo correcto deberían sumar 100%.
              </div>
            )}
          </>
        )}
      </section>

      <section className="card reveal" style={{ '--i': 3, marginTop: '1.25rem' }}>
        <div className="card__head">
          <h2>Entregas de esta materia</h2>
          <button className="btn btn--sm" onClick={() => setNuevaFecha(true)}><CalendarPlus size={15} aria-hidden /> Agregar fecha</button>
        </div>
        {entregas.length === 0 ? (
          <p className="muted small">No hay entregas ni exámenes en tu agenda para esta materia.</p>
        ) : (
          <ul className="list">
            {entregas.map((a) => (
              <AgendaRow key={a.id} item={a} onToggle={toggleAgenda} onDelete={deleteAgenda} />
            ))}
          </ul>
        )}
      </section>

      <Modal open={editando} onClose={() => setEditando(false)} title="Editar materia">
        <MateriaForm
          initial={materia}
          semestres={semestres}
          onCancel={() => setEditando(false)}
          onSubmit={(v) => {
            updateMateria(id, v);
            setEditando(false);
            toast('Materia actualizada');
          }}
        />
      </Modal>
      <Modal open={nuevaFecha} onClose={() => setNuevaFecha(false)} title={`Nueva fecha · ${materia.nombre_materia}`}>
        <AgendaForm
          materias={[materia]}
          initial={{ id_materia: id }}
          hideMateria
          onCancel={() => setNuevaFecha(false)}
          onSubmit={(v) => {
            addAgenda({ ...v, id_materia: id, id_estudiante: user.id });
            setNuevaFecha(false);
            toast('Agregado a tu agenda');
          }}
        />
      </Modal>
    </>
  );
}

/** Fila editable. Mantiene el texto escrito mientras se teclea y guarda cuando es un número válido. */
function RubroRow({ rubro, onChange, onDelete }) {
  const [peso, setPeso] = useState(String(rubro.peso ?? ''));
  const [cal, setCal] = useState(rubro.calificacion === null || rubro.calificacion === undefined ? '' : String(rubro.calificacion));
  const calNum = cal === '' ? null : Number(cal);
  const calInvalida = cal !== '' && !(calNum >= 0 && calNum <= 100);

  return (
    <tr>
      <td data-label="Rubro">
        <input className="input input--cell" value={rubro.nombre} placeholder="Ej. Examen parcial" aria-label="Nombre del rubro" onChange={(e) => onChange({ nombre: e.target.value })} />
      </td>
      <td data-label="Peso (%)">
        <input
          className="input input--cell" type="number" min="0" max="100" step="any" inputMode="decimal" value={peso} aria-label={`Peso de ${rubro.nombre || 'rubro'}`}
          onChange={(e) => {
            setPeso(e.target.value);
            const n = Number(e.target.value);
            onChange({ peso: e.target.value === '' || !Number.isFinite(n) ? 0 : Math.min(100, Math.max(0, n)) });
          }}
        />
      </td>
      <td data-label="Calificación">
        <input
          className="input input--cell" type="number" min="0" max="100" step="any" inputMode="decimal" placeholder="Pendiente" value={cal} aria-invalid={calInvalida}
          aria-label={`Calificación de ${rubro.nombre || 'rubro'}`}
          onChange={(e) => {
            setCal(e.target.value);
            const v = e.target.value;
            if (v === '') onChange({ calificacion: null });
            else if (Number(v) >= 0 && Number(v) <= 100) onChange({ calificacion: Number(v) });
          }}
        />
        {calInvalida && <span className="error small">Entre 0 y 100</span>}
      </td>
      <td data-label="Aporta">{rubro.calificacion === null ? <span className="muted">—</span> : <strong>{fmt(aporte(rubro))} pts</strong>}</td>
      <td>
        <button className="icon-btn" style={{ border: 0, background: 'transparent' }} onClick={onDelete} aria-label={`Quitar rubro ${rubro.nombre || ''}`}><Trash2 size={17} /></button>
      </td>
    </tr>
  );
}

/** "¿Qué necesito para aprobar?" */
function Necesidad({ res, info }) {
  const { estado } = res;
  let titulo;
  let cuerpo;
  let Icon = Target;

  if (estado === 'sin-rubros') {
    titulo = 'Agrega tus rubros para calcular';
    cuerpo = 'Con los porcentajes y tus calificaciones te digo cuánto necesitas sacar para aprobar.';
    Icon = Info;
  } else if (estado === 'aprobada') {
    titulo = '¡Ya aseguraste la materia!';
    cuerpo = `Llevas ${fmt(res.puntos)} puntos y el mínimo es ${fmt(res.aprob)}. Lo que falta solo sube tu promedio.`;
    Icon = CheckCircle2;
  } else if (estado === 'reprobada') {
    titulo = 'No alcanzaste el mínimo';
    cuerpo = `Cerraste con ${fmt(res.puntos)} puntos; el mínimo era ${fmt(res.aprob)}. Revisa si hay opción de extraordinario.`;
    Icon = TriangleAlert;
  } else if (estado === 'imposible') {
    titulo = 'Estás en riesgo';
    cuerpo = `Aun sacando 100 en todo lo que falta llegarías a ${fmt(res.maximo)}, y el mínimo es ${fmt(res.aprob)}. Habla con tu profesor sobre tus opciones.`;
    Icon = TriangleAlert;
  } else {
    titulo = `Necesitas promedio ${fmt(Math.max(res.necesario, 0))} en lo que falta`;
    cuerpo = `Te falta calificar el ${fmt(res.pesoPendiente)}% de la materia.`;
  }

  return (
    <section className={`card need-card need-card--${estado} reveal`} style={{ '--i': 1 }} aria-live="polite">
      <div className="need-card__main">
        <span className="need-card__icon"><Icon size={26} aria-hidden /></span>
        <div>
          <div className="eyebrow" style={{ marginBottom: 2 }}>¿Qué necesito para aprobar? <Badge tone={info.tone}>{info.label}</Badge></div>
          <h2>{titulo}</h2>
          <p className="muted">{cuerpo}</p>
          {estado === 'en-curso' && res.pendientes.length > 0 && (
            <p className="small" style={{ marginTop: '0.5rem' }}>
              Pendiente: {res.pendientes.map((r) => `${r.nombre || 'Sin nombre'} (${fmt(Number(r.peso) || 0)}%)`).join(' · ')}
            </p>
          )}
        </div>
      </div>
      {estado !== 'sin-rubros' && (
        <div className="need-card__stats">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <strong>{fmt(res.puntos)} pts acumulados</strong>
              <span className="small muted">Mínimo {fmt(res.aprob)}</span>
            </div>
            <ProgressBar value={res.puntos} marker={res.aprob} tone={estado === 'aprobada' ? 'sage' : ''} label="Puntos acumulados" />
          </div>
          <dl className="mini-stats">
            <div><dt>Promedio actual</dt><dd>{res.promedioActual !== null ? fmt(res.promedioActual) : '—'}</dd></div>
            <div><dt>Máximo posible</dt><dd>{fmt(res.maximo)}</dd></div>
            <div><dt>Si sigues igual</dt><dd>{res.proyectado !== null ? fmt(res.proyectado) : '—'}</dd></div>
          </dl>
        </div>
      )}
    </section>
  );
}
