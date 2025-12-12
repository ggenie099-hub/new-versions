import { openDB } from 'idb';

const DB_NAME = 'agentic-trading';
const STORE = 'workflows';

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    },
  });
}

export async function saveWorkflow(id: string, data: any) {
  const db = await getDB();
  await db.put(STORE, data, id);
}

export async function loadWorkflow(id: string) {
  const db = await getDB();
  return db.get(STORE, id);
}