const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const config = {
    user: process.env.DB_USER || 'cheshire',
    password: process.env.DB_PASSWORD || 'chesh',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'cheshireterminal'
};

async function initializeDatabase() {
    const pool = new Pool(config);

    try {
        // Read and execute the schema SQL
        const schemaPath = path.join(__dirname, 'init-postgres.sql');
        const schemaSql = await fs.readFile(schemaPath, 'utf8');
        
        console.log('Creating database schema...');
        await pool.query(schemaSql);
        console.log('Database schema created successfully');

        // Test the connection
        const testResult = await pool.query('SELECT NOW()');
        console.log('Database connection test successful:', testResult.rows[0]);

    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the initialization
initializeDatabase().catch(console.error);
