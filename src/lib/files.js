// Almacén de archivos en el navegador (IndexedDB). Los metadatos viven en cada concurso;
// el contenido binario se guarda aquí porque localStorage es demasiado pequeño.
const DB_NAME = 'agendau-files';
const STORE = 'files';
export const MAX_FILE_MB = 10;

const open = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const run = async (mode, fn) => {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(req?.result);
    };
    tx.onerror = () => reject(tx.error);
  });
};

/** Guarda un File y devuelve sus metadatos. */
export async function saveFile(file) {
  const id = `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  await run('readwrite', (s) => s.put({ id, blob: file }));
  return { id, name: file.name, size: file.size, type: file.type };
}

export const removeFiles = (ids) => (ids.length ? run('readwrite', (s) => ids.forEach((id) => s.delete(id))) : Promise.resolve());

export async function getBlob(id) {
  const rec = await run('readonly', (s) => s.get(id));
  return rec?.blob || null;
}

/** Abre (o descarga) un archivo guardado. */
export async function openFile(meta, { download = false } = {}) {
  const blob = await getBlob(meta.id);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  if (download) a.download = meta.name;
  else a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}

export const formatSize = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);
