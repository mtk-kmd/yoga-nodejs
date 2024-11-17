const sqlite3 = require('sqlite3').verbose();

// Open or create a new SQLite database
const db = new sqlite3.Database('./yogaClasses.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Initialize tables
db.serialize(() => {
    // YogaClass table
    db.run(`
        CREATE TABLE IF NOT EXISTS YogaClass (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day TEXT NOT NULL,
            time TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            duration INTEGER NOT NULL,
            price REAL NOT NULL,
            type TEXT NOT NULL,
            description TEXT NULL,
            teacher TEXT NULL
        )
    `);

    // ClassInstance table
    db.run(`
        CREATE TABLE IF NOT EXISTS ClassInstance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            teacher TEXT NOT NULL,
            comments TEXT,
            class_id INTEGER,
            FOREIGN KEY(class_id) REFERENCES YogaClass(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            class_id INTEGER NOT NULL,
            FOREIGN KEY(class_id) REFERENCES YogaClass(id)
        );
    `)

    console.log('Tables initialized.');
});

// Export the database connection
module.exports = db;
