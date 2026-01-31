import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const tables = ['savedComments', 'commentCollections', 'savedPlaylists', 'folders', 'analysisSessions', 'users'];

for (const table of tables) {
  const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
  console.log(`${table}: ${rows[0].count} rows`);
}

await connection.end();
