// Datos de demostración (cuenta de Ana). Las fechas son relativas a "hoy".
import { daysFromNow as d, hoursFromNow as h } from '../lib/dates';

export const TIPOS_AGENDA = [
  { value: 'examen', label: 'Examen' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'tarea', label: 'Tarea' },
  { value: 'otro', label: 'Recordatorio' },
];

export const DEMO_USER = { correo: 'ana@universidad.edu', password: 'estudiante123' };

const day = (n) => d(n, 0, 0).slice(0, 10);
const ini = (n) => `${day(n)}T00:00`;
const fin = (n) => `${day(n)}T23:59`;

const rubro = (id, nombre, peso, calificacion = null) => ({ id, nombre, peso, calificacion });

export function buildSeed() {
  const users = [
    { id: 'u-ana', nombre: 'Ana Martínez López', matricula: 'A01234567', correo: DEMO_USER.correo, password: DEMO_USER.password },
  ];

  const A = 'u-ana';
  const materias = [
    {
      id: 'm-poo', id_estudiante: A, nombre_materia: 'Programación Orientada a Objetos', docente: 'Mtro. Ricardo Beltrán', horario_curso: 'Lun y Mié · 08:00–10:00',
      semestre: 'Ene–Jun 2026', calif_aprobatoria: 70,
      rubros: [rubro('r1', 'Proyectos', 50, 92), rubro('r2', 'Exámenes', 50, 85)],
    },
    {
      id: 'm-mdw', id_estudiante: A, nombre_materia: 'Modelos de Desarrollo Web', docente: 'Dra. Patricia Salazar', horario_curso: 'Lun y Mié · 10:00–12:00',
      semestre: 'Ago–Dic 2026', calif_aprobatoria: 70,
      rubros: [rubro('r1', 'Tareas', 20, 90), rubro('r2', 'Actividades en clase', 15, 85), rubro('r3', 'Examen parcial 1', 25, 72), rubro('r4', 'Examen parcial 2', 25), rubro('r5', 'Proyecto final', 15)],
    },
    {
      id: 'm-bd', id_estudiante: A, nombre_materia: 'Bases de Datos', docente: 'Mtro. Ricardo Beltrán', horario_curso: 'Mar y Jue · 08:00–10:00',
      semestre: 'Ago–Dic 2026', calif_aprobatoria: 70,
      rubros: [rubro('r1', 'Tareas', 20, 80), rubro('r2', 'Prácticas SQL', 20, 60), rubro('r3', 'Examen 1', 30, 55), rubro('r4', 'Examen 2', 30)],
    },
    {
      id: 'm-is', id_estudiante: A, nombre_materia: 'Ingeniería de Software', docente: 'Dra. Patricia Salazar', horario_curso: 'Lun y Vie · 12:00–14:00',
      semestre: 'Ago–Dic 2026', calif_aprobatoria: 70,
      rubros: [rubro('r1', 'Tareas', 30, 100), rubro('r2', 'Examen', 30, 95), rubro('r3', 'Proyecto en equipo', 40)],
    },
    {
      id: 'm-redes', id_estudiante: A, nombre_materia: 'Redes de Computadoras', docente: 'Mtro. Ricardo Beltrán', horario_curso: 'Mié · 14:00–17:00',
      semestre: 'Ago–Dic 2026', calif_aprobatoria: 60,
      rubros: [rubro('r1', 'Laboratorios', 30, 100), rubro('r2', 'Examen 1', 40, 95), rubro('r3', 'Proyecto final', 30)],
    },
  ];

  let n = 0;
  const item = (id_materia, titulo, tipo, fecha_limite, estado, descripcion = '') => ({
    id: `ag-${++n}`, id_estudiante: A, id_materia, titulo, tipo, fecha_limite, estado, descripcion, fecha_creacion: d(-20, 9),
  });

  const agenda = [
    item('m-mdw', 'Examen parcial 2', 'examen', d(4, 10), 'pendiente', 'Modelos de contenido, navegación e interacción.'),
    item('m-mdw', 'Proyecto final: aplicación web', 'proyecto', d(9, 23, 59), 'pendiente', 'Prototipo funcional y documentación.'),
    item('m-mdw', 'Actividad 2 · Modelar la aplicación', 'tarea', d(-6, 23, 59), 'completada'),
    item('m-bd', 'Examen 2', 'examen', d(1, 8), 'pendiente'),
    item('m-bd', 'Diagrama entidad-relación', 'tarea', h(9), 'pendiente', 'Subir PDF al aula virtual.'),
    item('m-bd', 'Práctica de consultas SQL', 'tarea', d(-3, 20), 'completada'),
    item('m-bd', 'Entrega de vistas y triggers', 'tarea', d(-1, 18), 'pendiente'),
    item('m-is', 'Documento de requisitos (SRS)', 'tarea', d(3, 23, 59), 'pendiente'),
    item('m-is', 'Sprint review con el equipo', 'proyecto', d(14, 12), 'pendiente'),
    item('m-redes', 'Laboratorio de VLAN', 'tarea', d(2, 17), 'pendiente'),
    item('m-redes', 'Proyecto final de redes', 'proyecto', d(16, 23, 59), 'pendiente'),
    item('', 'Cierra el registro del Hackathon Smart City', 'otro', d(2, 18), 'pendiente', 'Confirmar equipo y subir la propuesta.'),
    item('', 'Cita con el asesor académico', 'otro', d(5, 11), 'pendiente'),
  ];

  const concursos = [
    {
      id: 'c-1', id_estudiante: A, nombre: 'Hackathon Tec Innovación 2026', organizador: 'Tecnológico Regional + Startup Hub', lugar: 'Guadalajara, Jal.',
      fecha_inicio: ini(-40), fecha_termino: fin(-39), resultado: '2.º lugar',
      experiencia: 'Fue mi primer hackathon presencial. Trabajamos 24 horas en equipo de cuatro personas; aprendí a priorizar funciones y a presentar una idea en 3 minutos.',
      que_se_hizo: 'Diseñé la interfaz en React y conecté el mapa de rutas. Construimos «EcoRuta», una app que sugiere trayectos en bici seguros y la desplegamos en Vercel.',
      url: 'https://example.com/ecoruta', archivos: [],
    },
    {
      id: 'c-2', id_estudiante: A, nombre: 'Cloud Challenge — Student Jam', organizador: 'Amazon Web Services', lugar: 'En línea',
      fecha_inicio: ini(-120), fecha_termino: fin(-119), resultado: 'Participación',
      experiencia: 'Reto individual de arquitectura en la nube con tiempo limitado.',
      que_se_hizo: 'Desplegué una API sin servidor con almacenamiento y monitoreo básico.',
      url: '', archivos: [],
    },
    {
      id: 'c-3', id_estudiante: A, nombre: 'Hackathon Smart City', organizador: 'Gobierno estatal · Centro de Innovación', lugar: 'Centro de Innovación, CDMX',
      fecha_inicio: ini(9), fecha_termino: fin(10), resultado: '',
      experiencia: 'Quiero proponer una app de movilidad para personas con discapacidad visual.',
      que_se_hizo: '', url: '', archivos: [],
    },
    {
      id: 'c-4', id_estudiante: A, nombre: 'Concurso regional de programación', organizador: 'ACM · Sede regional', lugar: 'Universidad sede, Monterrey',
      fecha_inicio: ini(25), fecha_termino: fin(25), resultado: '',
      experiencia: '', que_se_hizo: '', url: '', archivos: [],
    },
  ];

  return { users, materias, agenda, concursos };
}
