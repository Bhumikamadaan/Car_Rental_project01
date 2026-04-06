const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { URL } = require('url');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = Number(process.env.PORT || 5000);

let poolReady = false;
const allowedRoles = new Set(['customer', 'agency']);

// --- HELPER FUNCTIONS ---
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const normalizeEmail = (value = '') => String(value).trim().toLowerCase();
const normalizeRole = (role) => (allowedRoles.has(role) ? role : 'customer');
const normalizeString = (value = '') => String(value).trim();
const normalizeNumber = (value) => Number(value);

const getDbConfigFromEnv = () => {
    const databaseUrl = normalizeString(process.env.DATABASE_URL);

    if (databaseUrl) {
        try {
            const parsed = new URL(databaseUrl);
            return {
                host: parsed.hostname,
                port: Number(parsed.port || 3306),
                user: decodeURIComponent(parsed.username || ''),
                password: decodeURIComponent(parsed.password || ''),
                database: decodeURIComponent((parsed.pathname || '/').replace('/', '')) || 'car_agency_db'
            };
        } catch (err) {
            console.warn('Invalid DATABASE_URL detected. Falling back to individual DB env vars.');
        }
    }

    return {
        host: process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3307),
        user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'car_agency_db'
    };
};

// --- DATABASE CONNECTION ---
const dbConfig = getDbConfigFromEnv();
const pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initializeDatabase() {
    let db;
    try {
        db = await pool.getConnection();
        console.log('Connected to MySQL Database');

        // 1. Users Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'customer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Cars Table
        await db.query(`
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

        // 3. Bookings Table
        await db.query(`
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

        // Backward-compatible migrations for older local schemas.
        const [usersRoleColumn] = await db.query("SHOW COLUMNS FROM users LIKE 'role'");
        if (usersRoleColumn.length === 0) {
            await db.query("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'customer'");
        }

        const [carsCreatedAtColumn] = await db.query("SHOW COLUMNS FROM cars LIKE 'created_at'");
        if (carsCreatedAtColumn.length === 0) {
            await db.query('ALTER TABLE cars ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        }

        const [bookingsCreatedAtColumn] = await db.query("SHOW COLUMNS FROM bookings LIKE 'created_at'");
        if (bookingsCreatedAtColumn.length === 0) {
            await db.query('ALTER TABLE bookings ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        }

        console.log('All Tables Synchronized');
        poolReady = true;
    } catch (err) {
        console.log('Database Initialization Error:', err.message);
    } finally {
        if (db) db.release();
    }
}
initializeDatabase();

// Middleware to check DB status
app.use((req, res, next) => {
    if (poolReady || ['/', '/api/health'].includes(req.path)) return next();
    return res.status(503).send({ error: 'Database initializing... Please wait.' });
});

// --- AUTH ROUTES ---

app.post('/login', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = normalizeString(req.body?.password);
    const selectedRoleRaw = normalizeString(req.body?.role);
    const hasSelectedRole = selectedRoleRaw.length > 0;
    const selectedRole = hasSelectedRole ? normalizeRole(selectedRoleRaw.toLowerCase()) : null;
    try {
        const loginSql = hasSelectedRole
            ? 'SELECT id, email, role FROM users WHERE LOWER(email) = LOWER(?) AND password = ? AND LOWER(role) = LOWER(?) LIMIT 1'
            : 'SELECT id, email, role FROM users WHERE LOWER(email) = LOWER(?) AND password = ? LIMIT 1';
        const loginParams = hasSelectedRole ? [email, password, selectedRole] : [email, password];

        const [result] = await pool.execute(loginSql, loginParams);
        if (result.length > 0) return res.send({ message: 'Login successful', user: result[0] });

        if (hasSelectedRole) {
            const [credentialMatch] = await pool.execute(
                'SELECT id, email, role FROM users WHERE LOWER(email) = LOWER(?) AND password = ? LIMIT 1',
                [email, password]
            );

            if (credentialMatch.length > 0) {
                return res.status(403).send({
                    error: `This account is registered as ${credentialMatch[0].role}. Please select the correct role.`
                });
            }
        }

        return res.status(401).send({ error: 'Invalid credentials' });
    } catch (err) { 
        res.status(500).send({ error: 'Login failed' }); 
    }
});

app.post('/register', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = normalizeString(req.body?.password);
    const role = normalizeRole(req.body?.role);
    try {
        await pool.execute('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, password, role]);
        res.send({ message: 'Registration successful' });
    } catch (err) {
        res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).send({ error: 'Email already exists' });
    }
});

// --- CAR MANAGEMENT ---

// Get All Cars (For Customer Home)
app.get(['/api/cars', '/cars'], async (req, res) => {
    try {
        // Use id for ordering so legacy tables (without created_at) also work.
        const [result] = await pool.execute('SELECT * FROM cars ORDER BY id DESC');
        res.send(result);
    } catch (err) {
        console.error('Cars fetch error:', err.message);
        res.status(500).send({ error: 'Could not fetch cars' });
    }
});

// Get Agency Specific Cars
app.get('/api/agency/cars/:email', async (req, res) => {
    const email = normalizeEmail(req.params.email);
    try {
        const [result] = await pool.execute('SELECT * FROM cars WHERE LOWER(agency_email) = LOWER(?)', [email]);
        res.send(result);
    } catch (err) { res.status(500).send({ error: 'Database error' }); }
});

// Add Car
app.post(['/api/add-car', '/add-car'], async (req, res) => {
    const { model_name, vehicle_number, seating_capacity, rent_per_day, agency_email, image_url } = req.body;
    try {
        await pool.execute(
            'INSERT INTO cars (model_name, vehicle_number, seating_capacity, rent_per_day, agency_email, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [
                normalizeString(model_name), 
                normalizeString(vehicle_number).toUpperCase(), 
                normalizeNumber(seating_capacity), 
                normalizeNumber(rent_per_day), 
                normalizeEmail(agency_email), 
                image_url
            ]
        );
        res.status(201).send({ message: 'Car added successfully' });
    } catch (err) {
        res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).send({ error: 'Vehicle number already exists' });
    }
});

// Delete Car
app.delete('/api/cars/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM cars WHERE id = ?', [req.params.id]);
        res.send({ message: 'Car and associated bookings deleted' });
    } catch (err) { res.status(500).send({ error: 'Delete failed' }); }
});

// --- BOOKING MANAGEMENT ---

// Create Booking
app.post('/api/bookings', async (req, res) => {
    const { car_id, customer_email, start_date, number_of_days } = req.body;
    try {
        const [[car]] = await pool.execute('SELECT * FROM cars WHERE id = ?', [car_id]);
        if (!car) return res.status(404).send({ error: 'Car not found' });

        const totalPrice = Number(car.rent_per_day) * Number(number_of_days);
        await pool.execute(
            'INSERT INTO bookings (car_id, customer_email, agency_email, start_date, number_of_days, total_price) VALUES (?, ?, ?, ?, ?, ?)',
            [
                car.id, 
                normalizeEmail(customer_email), 
                normalizeEmail(car.agency_email), 
                start_date, 
                normalizeNumber(number_of_days), 
                totalPrice
            ]
        );
        res.status(201).send({ message: 'Car booked successfully!' });
    } catch (err) { 
        console.error(err);
        res.status(500).send({ error: 'Booking failed' }); 
    }
});

// View Bookings (The Fixed Route with LEFT JOIN)
app.get(['/api/bookings/agency/:email', '/api/bookings/customer/:email'], async (req, res) => {
    const email = normalizeEmail(req.params.email);
    const isAgency = req.path.includes('/agency/');
    
    try {
        const [result] = await pool.execute(
            `SELECT 
                b.*, 
                IFNULL(c.model_name, 'Car Deleted') as model_name, 
                IFNULL(c.vehicle_number, 'N/A') as vehicle_number 
             FROM bookings b 
             LEFT JOIN cars c ON b.car_id = c.id 
             WHERE LOWER(${isAgency ? 'b.agency_email' : 'b.customer_email'}) = LOWER(?) 
             ORDER BY b.created_at DESC`, 
            [email]
        );
        res.send(result);
    } catch (err) { 
        console.error("Fetch Error:", err.message);
        res.status(500).send({ error: 'Database error while fetching bookings' }); 
    }
});

// Health Check
app.get('/api/health', (req, res) => res.send({ status: 'OK', dbConnected: poolReady }));

// Debug route to show users
app.get('/api/debug/users', async (req, res) => {
    try {
        const [result] = await pool.execute('SELECT id, email, role FROM users ORDER BY id');
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
