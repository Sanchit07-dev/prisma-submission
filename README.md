# Prisma Submission API

A RESTful backend service built with Express.js, Prisma ORM, and SQLite for managing users and posts.

## 🚀 Features

- **Users Management**: Create, view, update, and manage users.
- **Posts Management**: Create and manage posts linked to users with support for captions, image URLs, and locations.
- **Prisma ORM**: Type-safe database client using SQLite.
- **Health Check**: `/health` endpoint to monitor server uptime.

## 📁 Project Structure

```
├── prisma/
│   ├── migrations/     # Database migration history
│   └── schema.prisma   # Prisma schema models (User, Post)
├── src/
│   ├── controllers/    # Route controllers
│   ├── routes/         # Express routes
│   ├── services/       # Business logic & database operations
│   ├── db.js           # Prisma client initialization
│   ├── index.js        # Express app setup and server entry
│   └── server.js       # App export
├── .env.example        # Environment variable template
├── package.json
└── README.md
```

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file from the example:
```bash
cp .env.example .env
```

### 4. Database Setup & Migrations
```bash
npx prisma migrate dev
```

### 5. Running the Application
```bash
# Start server in development mode
npm run dev

# Or in production mode
npm start
```

The server will run on `http://localhost:3000`.

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health status

### Users
- `GET /users` - Retrieve users
- `POST /users` - Create a new user
- `GET /users/:id` - Retrieve user by ID
- `PUT /users/:id` - Update user details
- `DELETE /users/:id` - Delete a user

### Posts
- `GET /posts` - Retrieve posts
- `POST /posts` - Create a new post
- `GET /posts/:id` - Retrieve post by ID
- `PUT /posts/:id` - Update a post
- `DELETE /posts/:id` - Delete a post
