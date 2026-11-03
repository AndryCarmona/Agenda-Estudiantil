import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useData } from './DataContext';

/**
 * Autenticación SIMULADA (solo frontend): la sesión se guarda en localStorage.
 * Con un backend real, aquí se llamaría a /auth/login y se guardaría un token;
 * las contraseñas se cifrarían (bcrypt/argon2) en el servidor, nunca en el cliente.
 */
const SESSION_KEY = 'agendau:session';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { data, registerStudent } = useData();
  const [userId, setUserId] = useState(() => {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  });

  const user = useMemo(() => data.users.find((u) => u.id === userId) || null, [data.users, userId]);

  const start = (id) => {
    try {
      localStorage.setItem(SESSION_KEY, id);
    } catch {
      /* sin almacenamiento: la sesión dura mientras la pestaña esté abierta */
    }
    setUserId(id);
  };

  const login = useCallback(
    (identificador, password) => {
      const key = identificador.trim().toLowerCase();
      const found = data.users.find(
        (u) => (u.correo.toLowerCase() === key || u.matricula.toLowerCase() === key) && u.password === password,
      );
      if (!found) return { ok: false, error: 'Usuario o contraseña inválidos' };
      sessionStorage.removeItem('agendau:mascot-dismissed');
      start(found.id);
      return { ok: true, user: found };
    },
    [data.users],
  );

  const register = useCallback(
    (form) => {
      const correo = form.correo.trim().toLowerCase();
      const matricula = form.matricula.trim().toUpperCase();
      if (data.users.some((u) => u.correo.toLowerCase() === correo)) return { ok: false, error: 'Ese correo ya está registrado.' };
      if (data.users.some((u) => u.matricula.toUpperCase() === matricula)) return { ok: false, error: 'Esa matrícula ya está registrada.' };
      const id = registerStudent({ nombre: form.nombre.trim(), matricula, correo, password: form.password });
      start(id);
      return { ok: true };
    },
    [data.users, registerStudent],
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* noop */
    }
    setUserId(null);
  }, []);

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
