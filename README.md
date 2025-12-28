# AI Tools

A production-ready, full-stack web application for authenticated AI chat with secure backend proxying. Built with modern technologies and best practices for security, scalability, and developer experience.

## Overview

AI Tools provides a ChatGPT-like interface where authenticated users can interact with AI models through a secure backend proxy. All AI requests are routed through the server, ensuring API keys remain protected and usage can be monitored and controlled.

**Key Features:**
- Secure authentication with JWT tokens in HTTP-only cookies
- Real-time streaming responses using Server-Sent Events (SSE)
- Chat session management (create, rename, delete)
- Admin-controlled user creation (no public registration)
- Rate limiting and comprehensive security headers
- Docker-ready deployment configuration

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS v4 | Styling |
| React Router v7 | Client-side routing |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| TypeScript | Type safety |
| Prisma | ORM & database migrations |
| OpenAI SDK | AI integration |
| Winston | Logging |
| Zod | Request validation |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary database |
| Docker & Docker Compose | Containerization |
| Nginx | Reverse proxy & static files |

### Security
| Feature | Implementation |
|---------|----------------|
| Password Hashing | Argon2id (memory: 64MB, iterations: 3) |
| Authentication | JWT with access/refresh token rotation |
| Cookie Security | HttpOnly, Secure, SameSite=Strict |
| Rate Limiting | express-rate-limit (global, auth, chat) |
| Security Headers | Helmet.js with strict CSP |
| Input Validation | Zod schemas on all endpoints |

## Architecture

```
                     INTERNET
                         │
            ┌────────────▼────────────┐
            │    NGINX (443/80)       │
            │  - TLS Termination      │
            │  - Rate Limiting        │
            └────────────┬────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌───────────────────┐       ┌────────────────────────┐
│ /                 │       │ /api                   │
│ React SPA         │       │ Express.js Backend     │
│ (Static Files)    │       │ (Port 3001)            │
└───────────────────┘       └────────────┬───────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                         │
                    ▼                                         ▼
            ┌───────────────┐                       ┌─────────────────┐
            │ PostgreSQL    │                       │ OpenAI API      │
            │ - Users       │                       │ (Streaming)     │
            │ - Sessions    │                       └─────────────────┘
            │ - Messages    │
            └───────────────┘
```

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.x
- Docker & Docker Compose
- OpenAI API key

### Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/fvarli/ai-tools.git
cd ai-tools

# 2. Start PostgreSQL
docker-compose up postgres -d

# 3. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your OpenAI API key and generate JWT secrets

# Run database migrations
npx prisma migrate dev

# Create an admin user
npm run user:create

# Start backend server
npm run dev

# 4. Setup frontend (new terminal)
cd frontend
npm install
npm run dev

# 5. Open http://localhost:5173
```

### Environment Variables

#### Backend (`backend/.env`)

```bash
# Server
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_tools?schema=public

# JWT Secrets (generate with: openssl rand -hex 64)
JWT_ACCESS_SECRET=<your-access-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>

# JWT Expiration
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# App
APP_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Production Deployment (Docker - Local)

```bash
# 1. Configure environment
cp .env.example .env
# Edit with production values

# 2. Start all services
docker-compose up -d

# 3. Run migrations
docker-compose exec backend npx prisma migrate deploy

# 4. Create admin user
docker-compose exec backend node dist/cli/create-user.js

# 5. Access at http://localhost (or your domain)
```

### Production Deployment (VPS/Cloud Server)

This guide covers deploying to a VPS like DigitalOcean, Linode, or any Ubuntu server.

#### Prerequisites
- Ubuntu 22.04+ server with at least 1GB RAM
- Domain name pointing to your server IP
- SSH access to the server

#### Step 1: Initial Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Create swap (recommended for 1GB RAM servers)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

#### Step 2: Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

#### Step 3: Install Nginx & Certbot

```bash
apt install nginx certbot python3-certbot-nginx -y
```

#### Step 4: Clone and Configure Project

```bash
cd /opt
git clone https://github.com/fvarli/ai-tools.git
cd ai-tools

# Generate JWT secrets
JWT_ACCESS=$(openssl rand -hex 64)
JWT_REFRESH=$(openssl rand -hex 64)

# Create root .env file for Docker Compose
cat > .env << EOF
JWT_ACCESS_SECRET=$JWT_ACCESS
JWT_REFRESH_SECRET=$JWT_REFRESH
OPENAI_API_KEY=sk-your-openai-api-key-here
EOF

# Edit with your actual OpenAI API key
nano .env
```

#### Step 5: Configure Nginx Reverse Proxy

Create Nginx configuration:

```bash
cat > /etc/nginx/sites-available/your-domain.com << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;  # Required for SSE streaming
    }
}
EOF

# Enable site and remove default
ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t && systemctl reload nginx
```

#### Step 6: Obtain SSL Certificate

```bash
certbot --nginx -d your-domain.com
```

#### Step 7: Start Application

```bash
cd /opt/ai-tools

# Build and start all containers
docker compose up -d --build

# Wait for services to be ready, then run migrations
docker compose exec backend npx prisma migrate deploy

# Create admin user
docker compose exec -it backend node dist/cli/create-user.js
```

#### Step 8: Configure Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

#### Useful Commands

```bash
# View logs
docker compose logs -f              # All services
docker compose logs -f backend      # Backend only

# Restart services
docker compose restart

# Rebuild after code changes
cd /opt/ai-tools
git pull
docker compose up -d --build

# Database backup
docker compose exec postgres pg_dump -U postgres ai_tools > backup.sql

# Enter database shell
docker compose exec postgres psql -U postgres ai_tools
```

#### Troubleshooting

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check if containers are running: `docker compose ps` |
| 404 on API | Verify Nginx location for `/api/` and backend is running |
| 500 Internal Error | Check backend logs: `docker compose logs backend` |
| Database errors | Run migrations: `docker compose exec backend npx prisma migrate deploy` |
| SSL not working | Re-run certbot: `certbot --nginx -d your-domain.com` |

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/logout` | Clear auth cookies |
| GET | `/api/auth/me` | Get current user info |
| POST | `/api/auth/refresh` | Refresh access token |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/sessions` | List user's chat sessions |
| POST | `/api/chat/sessions` | Create new session |
| GET | `/api/chat/sessions/:id` | Get session details |
| PATCH | `/api/chat/sessions/:id` | Update session title |
| DELETE | `/api/chat/sessions/:id` | Delete session |
| GET | `/api/chat/sessions/:id/messages` | Get session messages |
| POST | `/api/chat/sessions/:id/messages/stream` | Send message (SSE) |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check with DB status |

## Project Structure

```
ai-tools/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # LoginForm, ProtectedRoute
│   │   │   ├── chat/          # ChatContainer, MessageList, MessageInput
│   │   │   ├── sidebar/       # Sidebar, SessionItem
│   │   │   └── common/        # Spinner, shared components
│   │   ├── contexts/          # AuthContext, ChatContext
│   │   ├── lib/
│   │   │   ├── api/           # API client functions
│   │   │   └── types/         # TypeScript interfaces
│   │   ├── pages/             # LoginPage, ChatPage
│   │   └── App.tsx            # Router setup
│   ├── Dockerfile
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── cli/               # create-user.ts (admin CLI)
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # auth, rateLimit, validate, error
│   │   ├── routes/            # Route definitions
│   │   ├── services/          # Business logic
│   │   ├── schemas/           # Zod validation schemas
│   │   └── utils/             # Helpers (password, logger, errors)
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── Dockerfile
│
├── docker-compose.yml
└── .env.example
```

## Database Schema

```prisma
model User {
  id           String        @id @default(uuid())
  username     String        @unique
  email        String        @unique
  passwordHash String
  createdAt    DateTime      @default(now())
  isActive     Boolean       @default(true)
  sessions     ChatSession[]
}

model ChatSession {
  id        String    @id @default(uuid())
  userId    String
  title     String    @default("New Chat")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  user      User      @relation(fields: [userId], references: [id])
  messages  Message[]
}

model Message {
  id               String      @id @default(uuid())
  sessionId        String
  role             String      // 'user' | 'assistant'
  content          String
  createdAt        DateTime    @default(now())
  promptTokens     Int?
  completionTokens Int?
  model            String?
  session          ChatSession @relation(fields: [sessionId], references: [id])
}
```

## Security Considerations

- **No Direct AI Access**: All OpenAI API calls are server-side only. The API key never reaches the client.
- **Admin-Only Registration**: Users can only be created via CLI by administrators.
- **Token Rotation**: Access tokens expire in 15 minutes; refresh tokens in 7 days.
- **Rate Limiting**:
  - Global: 100 requests per 15 minutes
  - Auth endpoints: 5 attempts per 15 minutes
  - Chat: 20 messages per minute per user

## Scripts

### Backend

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run user:create  # Interactive CLI to create users
```

### Frontend

```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
