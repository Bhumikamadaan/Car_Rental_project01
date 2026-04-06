const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'car_agency_db'
};

async function initDatabase() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password
        });

        console.log('Connected to MySQL server');

        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        console.log(`Database "${dbConfig.database}" ready`);

        await connection.end();

        connection = await mysql.createConnection(dbConfig);

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'customer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Users table ready');

        await connection.execute(`
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
        `);
        console.log('Cars table ready');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                car_id INT NOT NULL,
                customer_email VARCHAR(255) NOT NULL,
                agency_email VARCHAR(255) NOT NULL,
                start_date DATE NOT NULL,
                number_of_days INT NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                status VARCHAR(50) DEFAULT 'confirmed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
            )
        `);
        console.log('Bookings table ready');

        // Backward-compatible migrations for older local schemas.
        const [usersRoleColumn] = await connection.query("SHOW COLUMNS FROM users LIKE 'role'");
        if (usersRoleColumn.length === 0) {
            await connection.query("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'customer'");
            console.log('Added missing users.role column');
        }

        const [carsCreatedAtColumn] = await connection.query("SHOW COLUMNS FROM cars LIKE 'created_at'");
        if (carsCreatedAtColumn.length === 0) {
            await connection.query('ALTER TABLE cars ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            console.log('Added missing cars.created_at column');
        }

        const [bookingsCreatedAtColumn] = await connection.query("SHOW COLUMNS FROM bookings LIKE 'created_at'");
        if (bookingsCreatedAtColumn.length === 0) {
            await connection.query('ALTER TABLE bookings ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            console.log('Added missing bookings.created_at column');
        }

        console.log('Database initialization complete');
    } catch (err) {
        console.log('Database initialization error:', err.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initDatabase();
