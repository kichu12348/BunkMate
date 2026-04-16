import { database } from "../database";

export interface Account {
  id: number;
  name: string;
  token: string;
}

export async function insertAccount(name: string, token: string) {
  const db = database.getDatabase();
  const result = await db.getFirstAsync<Account>(
    `
    INSERT INTO accounts (name, token) VALUES (?, ?) RETURNING *
  `,
    [name, token],
  );
  return result;
}

export async function deleteAccount(id: number) {
  const db = database.getDatabase();
  db.runAsync(
    `
    DELETE FROM accounts WHERE id = ?
  `,
    [id],
  );
}

export async function getAllAccounts() {
  const db = database.getDatabase();
  return db.getAllAsync<Account>("SELECT * FROM accounts");
}

export async function getAccount(id: number) {
  const db = database.getDatabase();
  return db.getFirstAsync<Account>("SELECT * FROM accounts WHERE id = ?", [id]);
}
