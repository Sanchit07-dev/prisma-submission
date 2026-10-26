# InstaLite Backend API (Prisma Submission)

A RESTful backend service built with Express.js, Prisma ORM, and SQLite supporting relational data models, cascading deletes, atomic bulk seeding, and pagination.

## 🚀 Features & Relations

- **One-to-Many (`User` → `Post`)**: Each post belongs to a required author (`authorId`), with cascading delete when the author is deleted.
- **Many-to-Many (`User` ↔ `Post` via `Like`)**: Explicit join table with a composite primary key `@@id([userId, postId])` preventing duplicate likes and supporting cascading deletes.
- **Atomic Bulk Seeding**: Re-seeds 12 users, 24 posts, and 29 likes in batch operations with username/post key resolution.
- **Advanced Querying**:
  - Pagination (`page`, `limit`) with standard metadata (`{ page, limit, total, totalPages }`).
  - Filtering: `hasPosts=true|false`, `isPrivate=true|false`, `location`, `search`.
  - Sorting: `sortBy=createdAt|updatedAt|likes` with deterministic tie-breaking.
  - Safe nested projections: nested user summaries return only `{ id, username, fullname }`, never leaking emails.

## 📁 Project Structure

```
├── prisma/
│   ├── migrations/       # Migration history (init, add_post_author, add_likes)
│   ├── schema.prisma     # Prisma schema models (User, Post, Like)
│   ├── seed-data.js      # Relational seed data fixtures
│   └── seed.js           # Relational bulk seed runner
├── src/
│   ├── controllers/      # Route controllers (users, posts, likes)
│   ├── routes/           # Express routes (users, posts)
│   ├── services/         # Business logic & Prisma queries
│   ├── utils/            # Utilities (pagination parsing and metadata)
│   ├── db.js             # Prisma client initialization
│   ├── index.js          # Express app entry
│   └── server.js         # App export
├── .env.example
├── package.json
└── README.md
```

## 🛠️ Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Migrations & Seeding
```bash
# Run migrations
npx prisma migrate dev

# Seed database with users, posts, and likes
npm run seed
# or
npx prisma db seed
```

### 4. Running the Application
```bash
# Development
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### Users
- `GET /users` - List users (supports `search`, `isPrivate`, `hasPosts`, pagination)
- `POST /users` - Create user
- `GET /users/:id` - Get user by ID (includes `_count: { posts, likes }`)
- `PATCH /users/:id` - Update user details
- `DELETE /users/:id` - Delete user (cascades to posts and likes)
- `GET /users/:id/posts` - Paginated posts by user (newest first, includes `_count: { likes }`)
- `GET /users/:id/liked-posts` - Paginated posts liked by user (newest first)

### Posts
- `GET /posts` - List posts (supports `search`, `location`, `from`, `to`, `sortBy`, `order`, pagination, includes author summary and like count)
- `POST /posts` - Create post (requires `imageUrl` and `authorId`)
- `GET /posts/:id` - Get post by ID (includes author summary and like count)
- `PATCH /posts/:id` - Update post caption or location (`authorId` immutable)
- `DELETE /posts/:id` - Delete post (cascades to likes)
- `GET /posts/:id/likes` - List user summaries who liked the post (sorted by username ascending)
- `POST /posts/:id/likes` - Like a post (`userId` required, returns 409 if already liked)
- `DELETE /posts/:id/likes/:userId` - Unlike a post (returns 204 or 404)
