require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

const logFilePath = process.env.LOG_PATH;

const log = (message) => {
    console.log(message);
    fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
};

const clearTables = async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
        });

        log('Connected to the database server.');

        // Use the database
        await connection.query(`USE ${dbConfig.database}`);
        log(`Using database ${dbConfig.database}.`);

        // Read the SQL script
        const sql = fs.readFileSync(path.join(__dirname, 'scripts', 'clear_database.sql'), 'utf8');

        // Split the SQL script into individual statements
        const sqlStatements = sql.split(';').map(stmt => stmt.trim()).filter(stmt => stmt.length);

        // Execute each statement sequentially
        for (const statement of sqlStatements) {
            await connection.query(statement);
            log(`Executed statement: ${statement}`);
        }

        log('Tables cleared and primary keys reset.');
    } catch (err) {
        log(`Error clearing tables: ${err}`);
    } finally {
        if (connection) {
            await connection.end();
            log('Database connection closed.');
        }
    }
};

clearTables();
