const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'car_agency_db'
});

// Database initialization - Create tables if they don't exist
db.query(`
    CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) console.log('Error creating users table:', err);
});

db.query(`
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
`, (err) => {
    if (err) console.log('Error creating cars table:', err);
});

// WebSocket Connection
wss.on('connection', (ws) => {
    console.log('✅ WebSocket Client Connected');
    ws.send(JSON.stringify({ message: 'Connected to WebSocket Server' }));
    
    ws.on('message', (data) => {
        console.log('Received:', data);
        ws.send(JSON.stringify({ echo: data }));
    });
    
    ws.on('close', () => {
        console.log('❌ WebSocket Client Disconnected');
    });
});

// Login Route
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).send({ error: 'Email and Password required' });
    }

    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(sql, [email, password], (err, result) => {
        if (err) {
            console.log('❌ Login Error:', err);
            res.status(500).send({ error: 'Database error', details: err.message });
        } else if (result.length > 0) {
            const user = result[0];
            res.send({ 
                message: 'Login Successful!', 
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            res.status(401).send({ error: 'Invalid credentials' });
        }
    });
});

// Register Route
app.post('/register', (req, res) => {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
        return res.status(400).send({ error: 'Email and Password required' });
    }

    const userRole = role || 'customer'; // Default to customer if not specified

    const sql = "INSERT INTO users (email, password, role) VALUES (?, ?, ?)";
    db.query(sql, [email, password, userRole], (err, result) => {
        if (err) {
            console.log('❌ Register Error:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                res.status(400).send({ error: 'Email already registered' });
            } else {
                res.status(500).send({ error: 'Database error', details: err.message });
            }
        } else {
            res.send({ message: 'Registration Successful!', role: userRole });
        }
    });
});

// Cars dikhane ke liye route
app.get('/cars', (req, res) => {
    db.query("SELECT * FROM cars", (err, result) => {
        if (err) {
            console.log("Database Error:", err);
            res.status(500).send(err);
        } else {
            res.send(result);
        }
    });
});

// Nayi car add karne ke liye route
app.post('/api/add-car', (req, res) => {
    const { model_name, vehicle_number, seating_capacity, rent_per_day, agency_email, image_url } = req.body;
    const sql = "INSERT INTO cars (model_name, vehicle_number, seating_capacity, rent_per_day, agency_email, image_url) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [model_name, vehicle_number, seating_capacity, rent_per_day, agency_email, image_url], (err, result) => {
        if (err) res.status(500).send(err);
        else res.send({ message: "Car Added!" });
    });
});

server.listen(5000, () => console.log('🚀 Server on 5000 with WebSocket support'));