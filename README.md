# Hostel Leave App

A full-stack hostel leave application system for students, incharges, and wardens. Students can apply for leave, while authorized staff can review and update leave application statuses through role-based dashboards.

## Features

- Student, incharge, and warden role-based access
- User registration and login with JWT authentication
- Leave application creation and management
- Dashboard views for students, incharges, and wardens
- MongoDB-backed data storage

## Tech Stack

- Frontend: React, React Router, Axios
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Authentication: JSON Web Tokens, bcryptjs

## Project Structure

```text
hostel-leave-app/
  backend/    Express API, MongoDB models, routes, controllers
  frontend/   React application
```

## Prerequisites

- Node.js and npm
- MongoDB database connection string

## Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
```

Start the backend:

```bash
npm run dev
```

For production-style start:

```bash
npm start
```

## Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend is configured to proxy API requests to:

```text
http://localhost:5001
```

## API Routes

Base API routes:

- `GET /api/health` - health check
- `POST /api/auth/register` - register user
- `POST /api/auth/login` - login user
- `GET /api/auth/me` - get current user
- `POST /api/leave/apply` - apply for leave
- `GET /api/leave` - get leave applications
- `GET /api/leave/:id` - get one leave application
- `PUT /api/leave/:id/status` - update leave status
- `DELETE /api/leave/:id` - delete leave application
- `GET /api/dashboard/student` - student dashboard
- `GET /api/dashboard/incharge` - incharge dashboard
- `GET /api/dashboard/warden` - warden dashboard

## GitHub Repository

```text
https://github.com/SevithaMacha/hostel-leave-app
```
