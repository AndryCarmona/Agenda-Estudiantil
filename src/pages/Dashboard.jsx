import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarClock, Medal, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMine } from '../context/DataContext';
import { ESTADO_INFO, fmt, resumenMateria, textoNecesidad } from '../lib/grades';
import { estadoConcurso } from '../lib/progress';
import { Badge, EmptyState, PageHeader, ProgressBar } from '../components/ui';
import { labelTipo } from '../components/AgendaParts';
import { TAGS, useSemestres } from './Materias';
import { rangoFechas } from './Concursos';
import { formatDateTime, isPast, parse, relative } from '../lib/dates';

const saludo = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};

export default function Dashboard() {
  const { user } = useAuth();
  const mine = useMine(user.id);
  const { list, actual } = useSemestres(mine.materias);
  const [semestre, setSemestre] = useState(null);
  const sem = semestre ?? actual;

  const materias = mine.materias.filter((m) => m.semestre === sem).map((m) => ({ ...m, res: resumenMateria(m) }));
  const pendientes = mine.agenda.filter((a) => a.estado === 'pendiente').sort((a, b) => parse(a.fecha_limite) - parse(b.fecha_limite));
  const proximos = mine.concursos.filter((c) => estadoConcurso(c) !== 'finalizado').sort((a, b) => parse(a.fecha_inicio) - parse(b.fecha_inicio));
  const realizados = mine.concursos.filter((c) => estadoConcurso(c) === 'finalizado');
  const enRiesgo = materias.filter((m) => m.res.estado === 'imposible' || m.res.estado === 'reprobada').length;

  return (
    <>
      <PageHeader eyebrow={saludo()} title={`Hola, ${user.nombre.split(' ')[0]}`} subtitle="Tu resumen: qué necesitas para aprobar, lo que viene en tu agenda y tus concursos.">
        {list.length > 1 && (
          <select className="input" style={{ width: 'auto' }} value={sem} onChange={(e) => setSemestre(e.target.value)} aria-label="Semestre">
            {list.map((s) => (
              <option key={s} value={s}>{s}{s === actual ? ' (actual)' : ''}</option>
            ))}
          </select>
        )}
      </PageHeader>

      <div className="stats reveal" style={{ '--i': 1, marginBottom: '1.25rem' }}>
        <div className="stat" style={{ '--tone': 'var(--primary-l)' }}><strong>{materias.length}</strong><span>Materias del semestre</span></div>
        <div className="stat" style={{ '--tone': enRiesgo ? 'var(--rosa-l)' : 'var(--salvia-l)' }}><strong>{enRiesgo}</strong><span>Materias en riesgo</span></div>
        <div className="stat" style={{ '--tone': 'var(--mostaza-l)' }}><strong>{pendientes.length}</strong><span>Fechas pendientes</span></div>
        <div className="stat" style={{ '--tone': 'var(--cielo-l)' }}><strong>{proximos.length}</strong><span>Concursos próximos</span></div>
      </div>

      <div className="grid grid--dash">
        <section className="card reveal" style={{ '--i': 2 }}>
          <div className="card__head">
            <h2>¿Qué necesito para aprobar?</h2>
            <Link to="/materias" className="btn btn--sm btn--ghost">Materias <ArrowRight size={15} aria-hidden /></Link>
          </div>
          {materias.length === 0 ? (
            <EmptyState icon={BookOpen} title="Sin materias en este semestre">
              <Link to="/materias">Agrega una materia</Link> y registra sus rubros de calificación.
            </EmptyState>
          ) : (
            <ul className="list">
              {materias.map((m, i) => {
                const info = ESTADO_INFO[m.res.estado];
                return (
                  <li key={m.id}>
                    <Link to={`/materias/${m.id}`} className="grade-row">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700 }}>
                          <i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: TAGS[i % TAGS.length], marginRight: 8 }} />
                          {m.nombre_materia}
                        </span>
                        <Badge tone={info.tone}>{info.label}</Badge>
                      </div>
                      <ProgressBar value={m.res.puntos} marker={m.res.aprob} tone={m.res.estado === 'aprobada' ? 'sage' : ''} label={`Puntos en ${m.nombre_materia}`} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: 6, fontSize: '0.85rem' }}>
                        <span className="muted">{textoNecesidad(m.res)}</span>
                        <strong style={{ whiteSpace: 'nowrap' }}>{fmt(m.res.puntos)} pts</strong>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card reveal" style={{ '--i': 3 }}>
          <div className="card__head">
            <h2>Próximas fechas</h2>
            <Link to="/agenda" className="btn btn--sm btn--ghost">Agenda <ArrowRight size={15} aria-hidden /></Link>
          </div>
          {pendientes.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Todo al día">No tienes fechas pendientes.</EmptyState>
          ) : (
            <ul className="list">
              {pendientes.slice(0, 5).map((a) => {
                const vencida = isPast(a.fecha_limite);
                return (
                  <li key={a.id} className={`item ${vencida ? 'item--late' : ''}`}>
                    <div className="item__body">
                      <div className="item__title">{a.titulo}</div>
                      <div className="item__meta">
                        <Badge tone={a.tipo}>{labelTipo(a.tipo)}</Badge>
                        <span>{mine.materias.find((m) => m.id === a.id_materia)?.nombre_materia}</span>
                      </div>
                      <div className="item__meta">
                        <span>{formatDateTime(a.fecha_limite)}</span>
                        <strong style={{ color: vencida ? 'var(--rosa-d)' : 'var(--terracota-d)' }}>{relative(a.fecha_limite)}</strong>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="card reveal" style={{ '--i': 4, marginTop: '1.25rem' }}>
        <div className="card__head">
          <h2>Concursos</h2>
          <Link to="/concursos" className="btn btn--sm btn--ghost">Ver todos <ArrowRight size={15} aria-hidden /></Link>
        </div>
        {mine.concursos.length === 0 ? (
          <EmptyState icon={Trophy} title="Aún no registras concursos">Guarda hackathons y concursos para presumirlos en tu CV.</EmptyState>
        ) : (
          <div className="grid grid--2">
            <div>
              <div className="eyebrow">Siguientes</div>
              {proximos.length === 0 ? (
                <p className="small muted">No tienes concursos próximos.</p>
              ) : (
                <ul className="list">
                  {proximos.slice(0, 3).map((c) => (
                    <li key={c.id} className="item">
                      <div className="item__body">
                        <div className="item__title">{c.nombre}</div>
                        <div className="item__meta"><span>{rangoFechas(c)}</span><strong style={{ color: 'var(--primary-d)' }}>{estadoConcurso(c) === 'en-curso' ? 'en curso' : relative(c.fecha_inicio)}</strong></div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="eyebrow">Realizados ({realizados.length})</div>
              {realizados.length === 0 ? (
                <p className="small muted">Todavía no has terminado ninguno.</p>
              ) : (
                <ul className="list">
                  {realizados.slice(0, 3).map((c) => (
                    <li key={c.id} className="item">
                      <div className="item__body">
                        <div className="item__title">{c.nombre}</div>
                        <div className="item__meta">
                          <span>{rangoFechas(c)}</span>
                          {c.resultado && <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Medal size={13} aria-hidden /> {c.resultado}</span>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
