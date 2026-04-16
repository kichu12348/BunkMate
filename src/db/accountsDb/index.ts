import { database } from "../database";

export interface Account {
  id: number;
  name: string;
  username: string;
  token: string;
}

export async function insertAccount(
  name: string,
  username: string,
  token: string,
) {
  const db = database.getDatabase();

  const result = await db.getFirstAsync<Account>(
    `
    INSERT INTO accounts (name, username, token) VALUES (?, ?, ?) RETURNING *
  `,
    [name, username, token],
  );
  if (!result) {
    throw new Error("Failed to insert account — database returned null.");
  }
  return result;
}

export async function deleteAccount(id: number) {
  const db = database.getDatabase();
  await db.runAsync(
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

export async function getAccountByUsername(username: string) {
  const db = database.getDatabase();
  return db.getFirstAsync<Account>(
    "SELECT * FROM accounts WHERE username = ?",
    [username],
  );
}

export async function deleteAllAccounts() {
  const db = database.getDatabase();
  await db.runAsync(`DELETE FROM accounts`);
}
