import { useMemo, useRef, useState } from 'react';
import { Building2, Download, ExternalLink, Eye, FileText, MapPin, Medal, Paperclip, Pencil, Plus, Search, SearchX, Trash2, Trophy, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData, useMine } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { MAX_FILE_MB, formatSize, openFile, removeFiles, saveFile } from '../lib/files';
import { estadoConcurso } from '../lib/progress';
import { Badge, EmptyState, Field, Modal, PageHeader } from '../components/ui';
import { formatDate, parse } from '../lib/dates';

const ESTADO = {
  proximo: { label: 'Próximo', tone: 'inscrito' },
  'en-curso': { label: 'En curso', tone: 'proyecto' },
  finalizado: { label: 'Finalizado', tone: 'completada' },
};
const MES = new Intl.DateTimeFormat('es-MX', { month: 'short' });

export const rangoFechas = (c) => {
  const a = formatDate(c.fecha_inicio);
  const b = formatDate(c.fecha_termino);
  return a === b ? a : `${a} – ${b}`;
};

export default function Concursos() {
  const { user } = useAuth();
  const { addConcurso, updateConcurso, deleteConcurso } = useData();
  const { concursos } = useMine(user.id);
  const toast = useToast();

  const [vista, setVista] = useState('todos');
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null); // null | { concurso? }
  const [detalle, setDetalle] = useState(null);

  const lista = useMemo(() => {
    const term = q.trim().toLowerCase();
    return concursos
      .filter((c) => (vista === 'todos' || estadoConcurso(c) === vista) && (!term || `${c.nombre} ${c.organizador} ${c.lugar}`.toLowerCase().includes(term)))
      .sort((a, b) => parse(b.fecha_inicio) - parse(a.fecha_inicio));
  }, [concursos, vista, q]);

  const guardar = async ({ values, nuevos, quitar, concurso }) => {
    try {
      const guardados = await Promise.all(nuevos.map(saveFile));
      await removeFiles(quitar);
      const archivos = [...(concurso?.archivos || []).filter((a) => !quitar.includes(a.id)), ...guardados];
      if (concurso) updateConcurso(concurso.id, { ...values, archivos });
      else addConcurso({ ...values, archivos }, user.id);
      setForm(null);
      toast(concurso ? 'Concurso actualizado' : 'Concurso guardado');
    } catch {
      toast('No se pudieron guardar los archivos en este navegador.', 'warn');
    }
  };

  const eliminar = async (c) => {
    if (!window.confirm(`¿Eliminar «${c.nombre}»? Se borrarán también sus archivos.`)) return;
    await removeFiles(c.archivos.map((a) => a.id)).catch(() => {});
    deleteConcurso(c.id);
    setDetalle(null);
    toast('Concurso eliminado', 'info');
  };

  const vistas = [
    { id: 'todos', label: 'Todos' },
    { id: 'proximo', label: 'Próximos' },
    { id: 'en-curso', label: 'En curso' },
    { id: 'finalizado', label: 'Finalizados' },
  ];

  return (
    <>
      <PageHeader eyebrow="Logros y experiencia" title="Mis concursos" subtitle="Registra hackathons y concursos: qué hiciste, el enlace a tu proyecto y los archivos que quieras conservar.">
        <button className="btn btn--primary" onClick={() => setForm({})}>
          <Plus size={18} aria-hidden /> Nuevo concurso
        </button>
      </PageHeader>

      <div className="actions reveal" style={{ marginBottom: '1.25rem', '--i': 1 }}>
        <div className="segmented" role="tablist" aria-label="Estado">
          {vistas.map((v) => (
            <button key={v.id} role="tab" aria-selected={vista === v.id} onClick={() => setVista(v.id)}>{v.label}</button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
          <Search size={16} aria-hidden style={{ position: 'absolute', left: 12, top: 15, color: 'var(--ink-soft)' }} />
          <input className="input" style={{ paddingLeft: '2.3rem' }} placeholder="Buscar por nombre u organización" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar concursos" />
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="card">
          <EmptyState icon={concursos.length ? SearchX : Trophy} title={concursos.length ? 'No hay concursos con ese filtro' : 'Aún no registras concursos'}>
            {concursos.length ? 'Prueba con otro filtro.' : 'Agrega tu primer hackathon o concurso, aunque todavía no sea la fecha.'}
          </EmptyState>
        </div>
      ) : (
        <div className="grid grid--auto">
          {lista.map((c, i) => {
            const est = ESTADO[estadoConcurso(c)];
            const d = parse(c.fecha_inicio);
            return (
              <article key={c.id} className="card event reveal" style={{ '--i': i % 6 }}>
                <div className="event__date">
                  <div className="datebox" aria-hidden>
                    <b>{MES.format(d).replace('.', '')}</b>
                    <span>{d.getDate()}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <Badge tone={est.tone}>{est.label}</Badge>
                    <h3 style={{ marginTop: 6 }}>{c.nombre}</h3>
                  </div>
                </div>
                <div className="event__facts">
                  <div><Building2 size={15} aria-hidden /> {c.organizador || 'Sin organizador'}</div>
                  <div><MapPin size={15} aria-hidden /> {c.lugar || 'Sin lugar'} · {rangoFechas(c)}</div>
                  {c.resultado && <div><Medal size={15} aria-hidden /> {c.resultado}</div>}
                </div>
                {(c.que_se_hizo || c.experiencia) && <p className="small muted clamp-3">{c.que_se_hizo || c.experiencia}</p>}
                <div className="event__foot">
                  <span className="actions small muted">
                    {c.url && <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><ExternalLink size={14} aria-hidden /> Enlace</span>}
                    {c.archivos.length > 0 && <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Paperclip size={14} aria-hidden /> {c.archivos.length}</span>}
                  </span>
                  <span className="actions">
                    <button className="btn btn--sm" onClick={() => setDetalle(c.id)}><Eye size={14} aria-hidden /> Ver</button>
                    <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => setForm({ concurso: c })} aria-label={`Editar ${c.nombre}`}><Pencil size={15} /></button>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.concurso ? 'Editar concurso' : 'Nuevo concurso'}>
        {form && <ConcursoForm concurso={form.concurso} onSubmit={guardar} onCancel={() => setForm(null)} />}
      </Modal>

      <Modal open={!!detalle} onClose={() => setDetalle(null)} title="Detalle del concurso">
        {detalle && <Detalle concurso={concursos.find((c) => c.id === detalle)} onEdit={(c) => { setDetalle(null); setForm({ concurso: c }); }} onDelete={eliminar} />}
      </Modal>
    </>
  );
}

function Detalle({ concurso: c, onEdit, onDelete }) {
  const toast = useToast();
  if (!c) return null;
  const est = ESTADO[estadoConcurso(c)];

  const abrir = async (a, download) => {
    const ok = await openFile(a, { download }).catch(() => false);
    if (!ok) toast('No se encontró el archivo en este navegador.', 'warn');
  };

  const Bloque = ({ titulo, texto }) =>
    texto ? (
      <section>
        <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>{titulo}</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{texto}</p>
      </section>
    ) : null;

  return (
    <div className="form">
      <div>
        <Badge tone={est.tone}>{est.label}</Badge>
        <h3 style={{ fontSize: '1.4rem', marginTop: 6 }}>{c.nombre}</h3>
      </div>
      <div className="event__facts">
        <div><Building2 size={15} aria-hidden /> {c.organizador || '—'}</div>
        <div><MapPin size={15} aria-hidden /> {c.lugar || '—'}</div>
        <div><Trophy size={15} aria-hidden /> {rangoFechas(c)}</div>
        {c.resultado && <div><Medal size={15} aria-hidden /> {c.resultado}</div>}
      </div>
      <Bloque titulo="Mi experiencia" texto={c.experiencia} />
      <Bloque titulo="Lo que se hizo" texto={c.que_se_hizo} />
      {c.url && (
        <a className="btn btn--sage" href={c.url} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} aria-hidden /> Abrir el proyecto desplegado
        </a>
      )}
      <section>
        <h3 style={{ fontSize: '0.95rem', marginBottom: 6 }}>Archivos</h3>
        {c.archivos.length === 0 ? (
          <p className="small muted">No hay archivos adjuntos.</p>
        ) : (
          <ul className="list">
            {c.archivos.map((a) => (
              <li key={a.id} className="item" style={{ alignItems: 'center' }}>
                <FileText size={20} aria-hidden style={{ color: 'var(--primary)', flex: 'none' }} />
                <div className="item__body">
                  <div className="item__title">{a.name}</div>
                  <div className="item__meta">{formatSize(a.size)}</div>
                </div>
                <button className="btn btn--sm btn--ghost" onClick={() => abrir(a, false)}>Abrir</button>
                <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => abrir(a, true)} aria-label={`Descargar ${a.name}`}><Download size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="actions" style={{ justifyContent: 'space-between' }}>
        <button className="btn btn--danger" onClick={() => onDelete(c)}><Trash2 size={16} aria-hidden /> Eliminar</button>
        <button className="btn btn--primary" onClick={() => onEdit(c)}><Pencil size={16} aria-hidden /> Editar</button>
      </div>
    </div>
  );
}

const toDate = (s) => (s ? s.slice(0, 10) : '');

function ConcursoForm({ concurso, onSubmit, onCancel }) {
  const [v, setV] = useState({
    nombre: concurso?.nombre || '',
    organizador: concurso?.organizador || '',
    lugar: concurso?.lugar || '',
    fecha_inicio: toDate(concurso?.fecha_inicio),
    fecha_termino: toDate(concurso?.fecha_termino),
    resultado: concurso?.resultado || '',
    experiencia: concurso?.experiencia || '',
    que_se_hizo: concurso?.que_se_hizo || '',
    url: concurso?.url || '',
  });
  const [nuevos, setNuevos] = useState([]);
  const [quitar, setQuitar] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const addFiles = (e) => {
    const files = [...e.target.files];
    const ok = files.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024);
    const rechazados = files.length - ok.length;
    setNuevos((n) => [...n, ...ok]);
    setErrors((er) => ({ ...er, archivos: rechazados ? `${rechazados} archivo(s) superan ${MAX_FILE_MB} MB y se omitieron.` : '' }));
    e.target.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (v.nombre.trim().length < 3) errs.nombre = 'Escribe el nombre del concurso.';
    if (!v.fecha_inicio) errs.fecha_inicio = 'Requerida.';
    if (!v.fecha_termino) errs.fecha_termino = 'Requerida.';
    else if (v.fecha_inicio && v.fecha_termino < v.fecha_inicio) errs.fecha_termino = 'No puede ser anterior al inicio.';
    if (v.url.trim() && !/^https?:\/\/\S+\.\S+/.test(v.url.trim())) errs.url = 'Debe empezar con http:// o https://';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    await onSubmit({
      concurso,
      nuevos,
      quitar,
      values: {
        nombre: v.nombre.trim(), organizador: v.organizador.trim(), lugar: v.lugar.trim(),
        fecha_inicio: `${v.fecha_inicio}T00:00`, fecha_termino: `${v.fecha_termino}T23:59`,
        resultado: v.resultado.trim(), experiencia: v.experiencia.trim(), que_se_hizo: v.que_se_hizo.trim(), url: v.url.trim(),
      },
    });
    setBusy(false);
  };

  const existentes = (concurso?.archivos || []).filter((a) => !quitar.includes(a.id));

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field label="Nombre del concurso" id="c-nombre" error={errors.nombre}>
        <input id="c-nombre" className="input" value={v.nombre} onChange={set('nombre')} placeholder="Ej. Hackathon Smart City" aria-invalid={!!errors.nombre} />
      </Field>
      <Field label="Empresa u organización que lo propuso" id="c-org">
        <input id="c-org" className="input" value={v.organizador} onChange={set('organizador')} />
      </Field>
      <div className="row">
        <Field label="Lugar" id="c-lugar">
          <input id="c-lugar" className="input" value={v.lugar} onChange={set('lugar')} placeholder="Ciudad, sede o «En línea»" />
        </Field>
        <Field label="Resultado (opcional)" id="c-res">
          <input id="c-res" className="input" value={v.resultado} onChange={set('resultado')} placeholder="2.º lugar, mención, participación…" />
        </Field>
      </div>
      <div className="row">
        <Field label="Fecha de inicio" id="c-ini" error={errors.fecha_inicio}>
          <input id="c-ini" type="date" className="input" value={v.fecha_inicio} onChange={set('fecha_inicio')} aria-invalid={!!errors.fecha_inicio} />
        </Field>
        <Field label="Fecha de término" id="c-fin" error={errors.fecha_termino}>
          <input id="c-fin" type="date" className="input" value={v.fecha_termino} min={v.fecha_inicio} onChange={set('fecha_termino')} aria-invalid={!!errors.fecha_termino} />
        </Field>
      </div>
      <Field label="Descripción de tu experiencia" id="c-exp" hint="¿Cómo te fue? ¿Qué aprendiste?">
        <textarea id="c-exp" className="input" value={v.experiencia} onChange={set('experiencia')} />
      </Field>
      <Field label="Lo que se hizo" id="c-hizo" hint="El proyecto, tu aportación y las tecnologías.">
        <textarea id="c-hizo" className="input" value={v.que_se_hizo} onChange={set('que_se_hizo')} />
      </Field>
      <Field label="URL del proyecto desplegado (opcional)" id="c-url" error={errors.url}>
        <input id="c-url" type="url" inputMode="url" className="input" value={v.url} onChange={set('url')} placeholder="https://mi-proyecto.vercel.app" aria-invalid={!!errors.url} />
      </Field>

      <div className="field">
        <label htmlFor="c-files">Archivos</label>
        <input ref={fileRef} id="c-files" type="file" multiple className="sr-only" onChange={addFiles} />
        <button type="button" className="dropzone" onClick={() => fileRef.current?.click()}>
          <Paperclip size={20} aria-hidden /> Adjuntar archivos <small>constancias, presentaciones, capturas · máx. {MAX_FILE_MB} MB c/u</small>
        </button>
        {errors.archivos && <span className="error" role="alert">{errors.archivos}</span>}
        {(existentes.length > 0 || nuevos.length > 0) && (
          <ul className="list" style={{ marginTop: '0.5rem' }}>
            {existentes.map((a) => (
              <li key={a.id} className="item" style={{ alignItems: 'center' }}>
                <FileText size={18} aria-hidden style={{ color: 'var(--primary)' }} />
                <div className="item__body"><div className="item__title small">{a.name}</div><div className="item__meta">{formatSize(a.size)}</div></div>
                <button type="button" className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setQuitar((q) => [...q, a.id])} aria-label={`Quitar ${a.name}`}><X size={15} /></button>
              </li>
            ))}
            {nuevos.map((f, i) => (
              <li key={`${f.name}-${i}`} className="item" style={{ alignItems: 'center', borderStyle: 'dashed' }}>
                <FileText size={18} aria-hidden style={{ color: 'var(--mostaza-d)' }} />
                <div className="item__body"><div className="item__title small">{f.name}</div><div className="item__meta">{formatSize(f.size)} · nuevo</div></div>
                <button type="button" className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setNuevos((n) => n.filter((_, j) => j !== i))} aria-label={`Quitar ${f.name}`}><X size={15} /></button>
              </li>
            ))}
          </ul>
        )}
        <span className="hint">Los archivos se guardan solo en este navegador.</span>
      </div>

      <div className="actions" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar concurso'}</button>
      </div>
    </form>
  );
}
