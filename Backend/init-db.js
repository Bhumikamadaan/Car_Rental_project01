const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'car_agency_db'
});

db.connect(err => {
    if (err) {
        console.log('❌ DB Error:', err);
        return;
    }
    console.log('✅ Connected to MySQL');

    // Create users table
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(createUsersTable, (err, result) => {
        if (err) {
            console.log('❌ Error creating users table:', err);
        } else {
            console.log('✅ Users table ready');
        }
        
        // Create cars table if not exists
        const createCarsTable = `
            CREATE TABLE IF NOT EXISTS cars (
                id INT PRIMARY KEY AUTO_INCREMENT,
                model_name VARCHAR(255) NOT NULL,
                vehicle_number VARCHAR(255) UNIQUE NOT NULL,
                seating_capacity INT NOT NULL,
                rent_per_day DECIMAL(10, 2) NOT NULL,
                agency_email VARCHAR(255) NOT NULL,
                image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        db.query(createCarsTable, (err, result) => {
            if (err) {
                console.log('❌ Error creating cars table:', err);
            } else {
                console.log('✅ Cars table ready');
            }
            
            console.log('✅ Database initialized successfully!');
            db.end();
        });
    });
});
