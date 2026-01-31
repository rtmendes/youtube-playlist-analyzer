import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [folders] = await connection.execute('SELECT * FROM folders');
console.log('Folders:', JSON.stringify(folders, null, 2));

const [users] = await connection.execute('SELECT id, name, openId FROM users');
console.log('Users:', JSON.stringify(users, null, 2));

await connection.end();
