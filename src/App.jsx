import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import Materias from './pages/Materias';
import MateriaDetalle from './pages/MateriaDetalle';
import Concursos from './pages/Concursos';
import CVPreview from './pages/CVPreview';

/** Todas las rutas (excepto /login) requieren sesión. */
function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/materias" element={<Materias />} />
        <Route path="/materias/:id" element={<MateriaDetalle />} />
        <Route path="/concursos" element={<Concursos />} />
        <Route path="/cv-preview" element={<CVPreview />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
