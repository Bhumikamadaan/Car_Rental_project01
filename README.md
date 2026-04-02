# 🚗 SwiftRentals - Car Rental Application

A modern, full-stack car rental platform built with **React**, **Node.js**, **Express**, and **MySQL**.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Usage](#usage)

## ✨ Features

### 🏠 Landing Page
- Beautiful hero section with call-to-action buttons
- Feature highlights (Instant Booking, Best Prices, Safe & Secure)
- How-it-works process visualization
- Statistics section
- Responsive design

### 👤 Authentication
- User registration with role selection (Customer/Agency)
- Secure login system
- Role-based access control
- localStorage for session management

### 🚙 Browse & Book Cars
- View all available cars with images
- Filter by start date and duration
- Real-time price calculation
- Instant booking confirmation
- Role-based booking restrictions

### 🏢 Agency Panel
- Add new cars to the fleet
- Manage vehicle inventory
- View customer bookings
- Track bookings status

### 📊 Customer Dashboard
- View booked cars
- Booking history
- Booking status tracking

## 🛠️ Tech Stack

### Frontend
- **React 19.2.4** - UI framework
- **React Router DOM 7.13.2** - Navigation
- **Axios 1.14.0** - HTTP client
- **Bootstrap 5** - CSS framework
- **React Scripts 5.0.1** - Build tool

### Backend
- **Node.js 22.12.0** - Runtime
- **Express 5.2.1** - Web framework
- **MySQL 2.18.1** - Database
- **CORS 2.8.6** - Cross-origin requests
- **WebSocket (ws 8.14.2)** - Real-time communication

## 📁 Project Structure

```
Car Rental Project/
├── Backend/
│   ├── server.js              # Main server file
│   ├── init-db.js            # Database initialization
│   ├── package.json          # Backend dependencies
│   └── .gitignore            # Git ignore rules
│
├── frontend/
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── App.js           # Main App component
│   │   ├── pages/           # Page components
│   │   │   ├── Landing.js   # Landing page
│   │   │   ├── Home.js      # Browse cars page
│   │   │   ├── Auth.js      # Login/Register
│   │   │   ├── AgencyPanel.js # Agency dashboard
│   │   │   └── BookedCars.js  # Bookings page
│   │   ├── index.js         # React entry point
│   │   └── App.css
│   ├── package.json         # Frontend dependencies
│   └── .gitignore
│
├── .gitignore               # Root level git ignore
└── README.md               # This file
```

## 🚀 Installation

### Prerequisites
- Node.js (v22.12.0)
- MySQL Server
- npm or yarn

### Clone the Repository
```bash
git clone https://github.com/yourusername/car-rental.git
cd Car\ Rental\ Project
```

### Backend Setup
```bash
cd Backend
npm install
node init-db.js  # Initialize database tables
npm start        # Server runs on port 5000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start        # App runs on port 3000
```

## 🎯 Running the Application

1. **Start MySQL Server** - Ensure MySQL is running locally

2. **Start Backend Server**
   ```bash
   cd Backend
   npm start
   ```
   Backend will be available at `http://localhost:5000`

3. **Start Frontend Server**
   ```bash
   cd frontend
   npm start
   ```
   Frontend will be available at `http://localhost:3000`

## 🔌 API Endpoints

### Authentication
- `POST /register` - Register new user (with role selection)
- `POST /login` - Login user (returns role)

### Cars
- `GET /cars` - Get all available cars
- `POST /api/add-car` - Add new car (Agency only)

### WebSocket
- `ws://localhost:5000/ws` - WebSocket connection for real-time updates

## 💡 Usage

### For Customers
1. Visit the landing page at `http://localhost:3000`
2. Click "Register Now" and sign up as a **Customer**
3. Browse available cars on the Home page
4. Select Start Date and Number of Days
5. Click "Rent Car" to confirm booking
6. View your bookings on the Bookings page

### For Agencies
1. Register as a **Car Rental Agency**
2. Go to Agency Panel
3. Add cars to your fleet with details:
   - Model name
   - Vehicle number
   - Seating capacity
   - Daily rent price
   - Image URL
4. View customer bookings for your cars

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Cars Table
```sql
CREATE TABLE cars (
    id INT PRIMARY KEY AUTO_INCREMENT,
    model_name VARCHAR(255) NOT NULL,
    vehicle_number VARCHAR(255) UNIQUE NOT NULL,
    seating_capacity INT NOT NULL,
    rent_per_day DECIMAL(10, 2) NOT NULL,
    agency_email VARCHAR(255) NOT NULL,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## ⚙️ Configuration

### Database Configuration (Backend/server.js)
```javascript
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Your MySQL password
    database: 'car_agency_db'
});
```

## 🔒 Security Features
- ✅ Role-based access control
- ✅ Secure password storage
- ✅ CORS enabled for cross-origin requests
- ✅ Session management via localStorage
- ✅ Input validation on forms

## 📱 Responsive Design
- Mobile-friendly interface with Bootstrap
- Adaptive layouts for all screen sizes
- Touch-friendly buttons and inputs

## 🤝 Contributing
Feel free to fork this project and submit pull requests for any improvements!

## 📄 License
This project is open source and available under the ISC License.

## 👨‍💻 Author
Created as a full-stack learning project demonstrating MERN-like architecture with traditional MySQL.

## 📞 Support
For issues or questions, please create an issue in the repository.

---

**Happy Coding! 🚗✨**
