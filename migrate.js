const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        const migrationDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationDir).sort();
        for (const file of files) {
            if (file.endsWith('.sql')) {
                const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
                console.log(`Running migration: ${file}`);
                await client.query(sql);
                console.log(`Completed: ${file}`);
            }
        }
        console.log('All migrations complete.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
