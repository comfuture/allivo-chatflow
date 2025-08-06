import Database from 'better-sqlite3';
import { join } from 'path';
import { randomUUID } from 'crypto';

// Create database connection
const dbPath = join(process.cwd(), 'server', 'data', 'allivo.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Helper function to generate UUID
export const generateId = () => randomUUID();

// SQL tagged template literal for better syntax
export const sql = (strings: TemplateStringsArray, ...values: any[]) => {
  return {
    text: strings.join('?'),
    values
  };
};