# AmataLink - Farmers Milk Productivity Management System

AmataLink is a comprehensive web platform designed to streamline and manage milk productivity, collection, and distribution. It provides dedicated dashboards for Farmers, Collectors, and Administrators to interact seamlessly and efficiently.

## 🚀 Features

- **Multi-Role Authentication**: Dedicated portals for Farmers, Collectors, and Admins.
- **Farmer Dashboard**: Track daily milk production, view payments, and communicate with collectors.
- **Collector Dashboard**: Record milk collections from farmers, manage routes, and generate reports.
- **Admin Dashboard**: Comprehensive overview of operations, user management, and advanced analytics.
- **Multi-Language Support**: Seamlessly switch between Kinyarwanda and English.
- **Dynamic Notifications**: Real-time alerts and updates.
- **Analytics & Reporting**: Generate detailed PDF and Excel reports (`pdfkit`, `exceljs`).
- **Communication Module**: Messaging views and SMS integration (via `twilio`).

## 🛠️ Technology Stack

### Frontend (User Interface)
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS & Emotion
- **Components/UI**: Radix UI, Material UI (MUI), Framer Motion for animations
- **Icons**: FontAwesome & Lucide React
- **Charts**: Recharts
- **API Communication**: Axios
- **Routing**: React Router

### Backend (API & Server)
- **Environment**: Node.js & Express.js
- **Database**: MySQL (using `mysql2` and connection pools)
- **Authentication**: JWT (`jsonwebtoken`) & Bcrypt for password hashing
- **Security**: CORS, Dotenv
- **Utilities**: Nodemailer (Email), Twilio (SMS)

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MySQL Database
- npm or pnpm package manager

### 1. Clone the repository
Make sure you have cloned the project into your local machine and switch to the project directory.

### 2. Backend Setup
The backend runs on Node.js and connects to a MySQL database.

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory by copying `.env.example` (or configure your own):
   ```env
   PORT=5000
   NODE_ENV=development
   # Add your MySQL Database configuration here
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *(The server will run on `http://localhost:5000`)*

### 3. Frontend Setup
The frontend is built using Vite and React.

1. Navigate back to the main frontend directory:
   ```bash
   cd ..
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *(The app will open at `http://localhost:5173`)*

---

## 📜 Available Scripts

### Frontend Scripts (Root Directory)
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the production-ready frontend application.

### Backend Scripts (`/backend` Directory)
- `npm start`: Starts the application in production mode.
- `npm run dev`: Starts the application with `nodemon` (or `--watch`) for development mode.

---

## 👨‍💻 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
