import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarCheck2, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Field } from '../components/ui';
import { Lumi } from '../components/Mascot';

import { DEMO_USER } from '../data/seed';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ identificador: '', password: '', nombre: '', matricula: '', correo: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submitLogin = (e) => {
    e.preventDefault();
    const res = login(form.identificador, form.password);
    if (!res.ok) return setError(res.error);
    navigate('/dashboard');
  };

  const submitRegister = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.nombre.trim().length < 3) errs.nombre = 'Escribe tu nombre completo.';
    if (!/^[A-Za-z]\d{6,10}$/.test(form.matricula.trim())) errs.matricula = 'Formato esperado: A01234567';
    if (!/^\S+@\S+\.\S+$/.test(form.correo.trim())) errs.correo = 'Escribe un correo válido.';
    if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres.';
    setErrors(errs);
    setError('');
    if (Object.keys(errs).length) return;
    const res = register(form);
    if (!res.ok) return setError(res.error);
    navigate('/dashboard');
  };

  const quick = () => {
    const res = login(DEMO_USER.correo, DEMO_USER.password);
    if (res.ok) navigate('/dashboard');
  };

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setErrors({});
  };

  return (
    <div className="login">
      <section className="login__art">
        <div className="brand">
          <span className="brand__mark"><CalendarCheck2 size={22} /></span>
          <span>AgendaU<small>Vida universitaria</small></span>
        </div>
        <div>
          <h1>Tu semestre, en una sola página.</h1>
          <p style={{ marginTop: '1rem', maxWidth: '44ch', opacity: 0.92 }}>
            Registra tus materias y calificaciones, sabe qué necesitas para aprobar, organiza tus fechas y guarda tus concursos y hackathons. Lumi te avisa de todo lo que se acerca.
          </p>
          <div className="sticky-notes" aria-hidden>
            <div className="sticky">Examen parcial<small>en 4 días</small></div>
            <div className="sticky">Necesito 53 en el final<small>¡sí se puede!</small></div>
            <div className="sticky">Hackathon<small>empieza mañana</small></div>
          </div>
          <Lumi className="login__lumi" />
        </div>
        <small style={{ opacity: 0.8 }}>Agenda estudiantil, seguimiento académico y concursos.</small>
      </section>

      <section className="login__panel">
        <div className="login__box">
          <div>
            <h2 style={{ fontSize: '1.8rem' }}>{mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}</h2>
            <p className="muted">{mode === 'login' ? 'Ingresa con tu correo o matrícula universitaria.' : 'Crea tu perfil de estudiante.'}</p>
          </div>

          <div className="segmented" role="tablist" aria-label="Acceso">
            <button role="tab" aria-selected={mode === 'login'} onClick={() => switchMode('login')}>Iniciar sesión</button>
            <button role="tab" aria-selected={mode === 'register'} onClick={() => switchMode('register')}>Crear cuenta</button>
          </div>

          {error && (
            <div className="alert alert--error" role="alert">
              <AlertCircle size={18} aria-hidden /> {error}
            </div>
          )}

          {mode === 'login' ? (
            <form className="form" onSubmit={submitLogin} noValidate>
              <Field label="Correo o matrícula" id="identificador">
                <input id="identificador" className="input" value={form.identificador} onChange={set('identificador')} autoComplete="username" required />
              </Field>
              <Field label="Contraseña" id="password">
                <input id="password" type="password" className="input" value={form.password} onChange={set('password')} autoComplete="current-password" required />
              </Field>
              <button className="btn btn--primary btn--block" type="submit">
                <LogIn size={18} aria-hidden /> Ingresar
              </button>
            </form>
          ) : (
            <form className="form" onSubmit={submitRegister} noValidate>
              <Field label="Nombre completo" id="nombre" error={errors.nombre}>
                <input id="nombre" className="input" value={form.nombre} onChange={set('nombre')} aria-invalid={!!errors.nombre} autoComplete="name" />
              </Field>
              <div className="row">
                <Field label="Matrícula" id="matricula" error={errors.matricula}>
                  <input id="matricula" className="input" value={form.matricula} onChange={set('matricula')} placeholder="A01234567" aria-invalid={!!errors.matricula} />
                </Field>
                <Field label="Correo" id="correo" error={errors.correo}>
                  <input id="correo" type="email" className="input" value={form.correo} onChange={set('correo')} aria-invalid={!!errors.correo} autoComplete="email" />
                </Field>
              </div>
              <Field label="Contraseña" id="pass2" error={errors.password} hint="Mínimo 6 caracteres.">
                <input id="pass2" type="password" className="input" value={form.password} onChange={set('password')} aria-invalid={!!errors.password} autoComplete="new-password" />
              </Field>
              <button className="btn btn--primary btn--block" type="submit">
                <UserPlus size={18} aria-hidden /> Crear cuenta
              </button>
            </form>
          )}

          {mode === 'login' && (
            <div className="demo">
              <span className="small muted">¿Quieres explorar primero?</span>
              <button type="button" onClick={quick}>
                <span>
                  <b>Entrar con la cuenta de demostración</b>
                  <small>{DEMO_USER.correo}</small>
                </span>
                <LogIn size={16} aria-hidden />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
