import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, BellRing, Trophy, CalendarClock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData, useMine } from '../context/DataContext';
import { buildAlerts, frase } from '../lib/progress';

/** "Lumi": mascota morada con birrete. mood: 'happy' | 'worried' */
export function Lumi({ mood = 'happy', className = '' }) {
  const worried = mood === 'worried';
  return (
    <svg className={`lumi lumi--${mood} ${className}`} viewBox="0 0 120 124" role="img" aria-label="Lumi, tu asistente">
      <ellipse cx="60" cy="117" rx="30" ry="4.5" fill="rgba(58,42,33,.16)" />
      {/* pies */}
      <ellipse cx="44" cy="110" rx="11" ry="6" fill="#6A47B3" />
      <ellipse cx="76" cy="110" rx="11" ry="6" fill="#6A47B3" />
      {/* brazo izquierdo */}
      <ellipse className="lumi__arm-l" cx="17" cy="82" rx="8.5" ry="11" fill="#8F6FD6" transform="rotate(14 17 82)" />
      {/* cuerpo */}
      <rect x="20" y="38" width="80" height="72" rx="36" fill="#9B7BE0" />
      <ellipse cx="45" cy="52" rx="14" ry="7" fill="#B49CF0" opacity=".55" transform="rotate(-24 45 52)" />
      {/* brazo derecho (saluda) */}
      <g className="lumi__arm-r" style={{ transformOrigin: '103px 76px' }}>
        <ellipse cx="104" cy="84" rx="8.5" ry="11" fill="#8F6FD6" transform="rotate(-14 104 84)" />
      </g>
      {/* cara */}
      <rect x="31" y="56" width="58" height="40" rx="20" fill="#FFF8EC" />
      <g className="lumi__eyes">
        <ellipse cx="48" cy="73" rx="4.6" ry="6.4" fill="#3A2A21" />
        <ellipse cx="72" cy="73" rx="4.6" ry="6.4" fill="#3A2A21" />
        <circle cx="49.6" cy="70.6" r="1.6" fill="#fff" />
        <circle cx="73.6" cy="70.6" r="1.6" fill="#fff" />
      </g>
      {worried && (
        <g stroke="#3A2A21" strokeWidth="2.4" strokeLinecap="round">
          <path d="M41 65 L53 60" />
          <path d="M79 65 L67 60" />
        </g>
      )}
      <ellipse cx="39" cy="83" rx="5.5" ry="3.4" fill="#F4A5A0" opacity=".75" />
      <ellipse cx="81" cy="83" rx="5.5" ry="3.4" fill="#F4A5A0" opacity=".75" />
      {worried ? (
        <ellipse cx="60" cy="87" rx="4" ry="3.2" fill="#3A2A21" />
      ) : (
        <path d="M52 83 Q60 91 68 83" fill="none" stroke="#3A2A21" strokeWidth="2.6" strokeLinecap="round" />
      )}
      {/* birrete */}
      <path d="M38 36 q22 12 44 0 v-8 h-44z" fill="#2E2140" />
      <path d="M60 10 L104 27 L60 44 L16 27z" fill="#3B2B52" />
      <path d="M60 10 L104 27 L60 44 L16 27z" fill="none" stroke="#5B4682" strokeWidth="1.2" />
      <circle cx="60" cy="27" r="3" fill="#E5A93C" />
      <path d="M60 27 L96 31 L96 46" fill="none" stroke="#E5A93C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="96" cy="49" r="3.6" fill="#E5A93C" />
    </svg>
  );
}

const ICON = { agenda: CalendarClock, concurso: Trophy };

/** Asistente flotante: burbuja con el aviso más próximo y panel con todos los avisos. */
export default function MascotAssistant() {
  const { user } = useAuth();
  const { data } = useData();
  const mine = useMine(user.id);
  const navigate = useNavigate();
  const alerts = useMemo(() => buildAlerts({ ...mine, materias: mine.materias }), [mine]);
  const [idx, setIdx] = useState(0);
  const [panel, setPanel] = useState(false);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('agendau:mascot-dismissed') === '1');
  const [visible, setVisible] = useState(true);
  const ref = useRef(null);

  const urgent = alerts.some((a) => a.level === 'vencida' || a.level === 'hoy');
  const top = alerts.slice(0, 5);
  const current = top[idx % Math.max(top.length, 1)];

  // La burbuja se muestra unos segundos, se oculta y vuelve con el siguiente aviso.
  useEffect(() => {
    if (panel || dismissed) return;
    setVisible(true);
    const hide = setTimeout(() => setVisible(false), 9000);
    const next = setInterval(() => {
      setIdx((i) => i + 1);
      setVisible(true);
      setTimeout(() => setVisible(false), 9000);
    }, 40000);
    return () => {
      clearTimeout(hide);
      clearInterval(next);
    };
  }, [panel, dismissed]);

  useEffect(() => {
    if (!panel) return;
    const close = (e) => !ref.current?.contains(e.target) && setPanel(false);
    const esc = (e) => e.key === 'Escape' && setPanel(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [panel]);

  const dismiss = () => {
    sessionStorage.setItem('agendau:mascot-dismissed', '1');
    setDismissed(true);
  };

  const first = user.nombre.split(' ')[0];
  const message = current
    ? frase(current)
    : data.agenda.some((a) => a.id_estudiante === user.id)
      ? `¡Todo en orden, ${first}! No tienes fechas próximas 🎉`
      : `¡Hola, ${first}! Agrega tus fechas y yo te aviso.`;

  return (
    <div className="mascot no-print" ref={ref}>
      {panel && (
        <div className="mascot__panel" role="dialog" aria-label="Avisos de Lumi">
          <div className="card__head" style={{ marginBottom: '0.6rem' }}>
            <h3>Avisos de Lumi</h3>
            <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setPanel(false)} aria-label="Cerrar avisos"><X size={16} /></button>
          </div>
          {alerts.length === 0 ? (
            <p className="muted small">No hay entregas, concursos ni recordatorios en los próximos días. ¡Aprovecha para adelantar!</p>
          ) : (
            <ul className="list">
              {alerts.map((a) => {
                const Icon = ICON[a.kind] || Sparkles;
                return (
                  <li key={a.id}>
                    <button className={`alert-row alert-row--${a.level}`} onClick={() => { setPanel(false); navigate(a.to); }}>
                      <Icon size={18} aria-hidden />
                      <span className="alert-row__text">
                        <strong>{a.titulo}</strong>
                        <small>{a.detalle ? `${a.detalle} · ` : ''}{a.level === 'vencida' ? 'vencida' : a.cuando}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {!panel && !dismissed && visible && (
        <div className="bubble" role="status" aria-live="polite">
          <button className="bubble__x" onClick={dismiss} aria-label="Ocultar mensajes de Lumi"><X size={14} /></button>
          {urgent && <BellRing size={15} aria-hidden style={{ color: 'var(--terracota-d)', verticalAlign: -2, marginRight: 4 }} />}
          {message}
          {alerts.length > 1 && (
            <button className="bubble__more" onClick={() => setPanel(true)}>Ver los {alerts.length} avisos</button>
          )}
        </div>
      )}

      <button
        className="mascot__btn"
        onClick={() => { setPanel((p) => !p); setDismissed(false); sessionStorage.removeItem('agendau:mascot-dismissed'); }}
        aria-expanded={panel}
        aria-label={`Lumi, tu asistente${alerts.length ? `: ${alerts.length} avisos` : ''}`}
      >
        <Lumi mood={urgent ? 'worried' : 'happy'} />
        {alerts.length > 0 && <span className="mascot__count">{alerts.length}</span>}
      </button>
    </div>
  );
}
