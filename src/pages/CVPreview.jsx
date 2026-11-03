import { useState } from 'react';
import { ExternalLink, FileText, Printer, Trophy, TriangleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMine } from '../context/DataContext';
import { fmt, resumenMateria } from '../lib/grades';
import { estadoConcurso } from '../lib/progress';
import { PageHeader } from '../components/ui';
import { useSemestres } from './Materias';
import { rangoFechas } from './Concursos';
import { parse } from '../lib/dates';

export default function CVPreview() {
  const { user } = useAuth();
  const mine = useMine(user.id);
  const { actual } = useSemestres(mine.materias);
  const [generado, setGenerado] = useState(false);
  const [aviso, setAviso] = useState(false);

  const participaciones = mine.concursos
    .filter((c) => estadoConcurso(c) !== 'proximo')
    .sort((a, b) => parse(b.fecha_inicio) - parse(a.fecha_inicio));
  const materias = mine.materias.map((m) => ({ ...m, res: resumenMateria(m) }));
  const aprobadas = materias.filter((m) => m.res.estado === 'aprobada' && m.res.pesoPendiente <= 0);
  const enCurso = materias.filter((m) => !aprobadas.includes(m) && m.semestre === actual);

  const generar = () => {
    if (participaciones.length === 0) {
      setAviso(true);
      setGenerado(false);
      return;
    }
    setAviso(false);
    setGenerado(true);
  };

  return (
    <>
      <PageHeader eyebrow="Empleabilidad y logros" title="Borrador de CV" subtitle="Una vista previa de una página con tus datos y los concursos en los que ya participaste.">
        <button className="btn btn--primary" onClick={generar}>
          <FileText size={18} aria-hidden /> Generar Borrador de CV
        </button>
        {generado && (
          <button className="btn" onClick={() => window.print()}>
            <Printer size={18} aria-hidden /> Imprimir / PDF
          </button>
        )}
      </PageHeader>

      {aviso && (
        <div className="alert alert--warn reveal" role="alert" style={{ marginBottom: '1.25rem' }}>
          <TriangleAlert size={18} aria-hidden /> No cuentas con concursos registrados para incluir en el ejemplo. Agrega uno que ya hayas realizado en «Concursos».
        </div>
      )}

      {!generado && !aviso && (
        <div className="card reveal" style={{ textAlign: 'center', padding: '2.5rem 1.25rem' }}>
          <Trophy size={40} aria-hidden style={{ color: 'var(--primary)' }} />
          <h2 style={{ marginTop: '0.6rem' }}>Convierte tus logros en un currículum</h2>
          <p className="muted" style={{ maxWidth: '48ch', margin: '0.4rem auto 0' }}>
            Presiona «Generar Borrador de CV» para ver cómo se vería tu perfil con tus concursos, proyectos desplegados y materias.
          </p>
        </div>
      )}

      {generado && (
        <article className="cv reveal" aria-label="Vista previa del CV">
          <header className="cv__head">
            <h2>{user.nombre}</h2>
            <p>{user.correo} · Matrícula {user.matricula}</p>
          </header>

          <section>
            <h3>Perfil</h3>
            <p>
              Estudiante universitario con interés en el desarrollo de software y aplicaciones web. Participa en concursos y hackathons para aplicar lo aprendido en proyectos reales y trabajar en equipo.
            </p>
          </section>

          <section>
            <h3>Concursos y hackathons</h3>
            <ul className="cv__list">
              {participaciones.map((c) => (
                <li key={c.id}>
                  <strong>{c.nombre}</strong>
                  {c.resultado && <> — {c.resultado}</>}
                  <div className="muted small">{[c.organizador, c.lugar, rangoFechas(c)].filter(Boolean).join(' · ')}</div>
                  {c.que_se_hizo && <p style={{ marginTop: 2 }}>{c.que_se_hizo}</p>}
                  {c.url && (
                    <a className="small" href={c.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                      <ExternalLink size={13} aria-hidden /> {c.url.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Formación académica</h3>
            <ul>
              {aprobadas.map((m) => (
                <li key={m.id}>
                  {m.nombre_materia} <span className="muted">· aprobada ({m.semestre}) · {fmt(m.res.puntos)}</span>
                </li>
              ))}
              {enCurso.map((m) => (
                <li key={m.id}>
                  {m.nombre_materia} <span className="muted">· en curso ({m.semestre})</span>
                </li>
              ))}
            </ul>
          </section>

          <p className="cv__sample">Documento de ejemplo generado por AgendaU. Edita el contenido antes de usarlo como CV oficial.</p>
        </article>
      )}
    </>
  );
}
