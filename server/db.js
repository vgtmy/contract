// Import the sqlite3 module, enabling verbose mode for more detailed stack traces.
const sqlite3 = require('sqlite3').verbose();
// Import the path module to handle and transform file paths.
const path = require('path');

// Define the path for the SQLite database file.
// __dirname is a Node.js global variable that gives the directory name of the current module.
const DB_PATH = path.join(__dirname, 'contracts.db');

// Create a new database connection.
// If the database file does not exist, it will be created (due to OPEN_CREATE flag).
// sqlite3.OPEN_READWRITE: Open the database for reading and writing.
// sqlite3.OPEN_CREATE: Create the database file if it does not exist.
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        // Log an error to the console if connection fails.
        console.error('无法连接数据库:', err.message);
    } else {
        // Log a success message and initialize the database tables.
        console.log('成功连接到SQLite数据库');
        initializeDatabase();
    }
});

/**
 * Initializes the database by creating necessary tables if they don't already exist.
 * Uses db.serialize to ensure that table creation queries run sequentially.
 */
function initializeDatabase() {
    db.serialize(() => {
        // Create 'contracts' table if it doesn't exist.
        // - id: Primary key, auto-incrementing integer.
        // - title: Text, cannot be null.
        // - description: Text.
        // - status: Text, defaults to 'pending'.
        // - created_at: Timestamp, defaults to the current timestamp when a row is inserted.
        // - updated_at: Timestamp, defaults to the current timestamp (SQLite specific, auto-updates on row change might need triggers or be handled at application level for strictness).
        db.run(`CREATE TABLE IF NOT EXISTS contracts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create 'templates' table if it doesn't exist.
        // - id: Primary key, auto-incrementing integer.
        // - name: Text, cannot be null.
        // - content: Text, cannot be null (stores the template body).
        // - category: Text, for categorizing templates.
        // - created_at: Timestamp, defaults to current time.
        // - updated_at: Timestamp, defaults to current time.
        db.run(`CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        // Note: SQLite's CURRENT_TIMESTAMP for updated_at only sets the default on creation.
        // For actual auto-update on modification, triggers or application-level logic would be needed.
    });
}

// Export the database connection object to be used by other modules.
module.exports = db;
