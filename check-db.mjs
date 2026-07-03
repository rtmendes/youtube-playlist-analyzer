import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
  console.error("DATABASE_URL must be a PostgreSQL connection string (postgresql://...)");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

const tables = [
  "savedComments",
  "commentCollections",
  "savedPlaylists",
  "folders",
  "analysisSessions",
  "users",
];

for (const table of tables) {
  const rows = await sql.unsafe(`SELECT COUNT(*)::int AS count FROM "${table}"`);
  console.log(`${table}: ${rows[0].count} rows`);
}

await sql.end();
