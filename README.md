# DevHub 🚀

A modern, full-stack developer community platform built with React and Node.js. DevHub provides a collaborative space for developers to share knowledge, discuss projects, and build community through posts, comments, and interactive features.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [API Documentation](#api-documentation)

## ✨ Features

### Core Functionality
- **User Authentication & Authorization** - JWT-based secure login/registration
- **Post Management** - Create, read, update, delete posts with rich content
- **Comment System** - Threaded comments and discussions
- **User Profiles** - Customizable developer profiles
- **Community Features** - Social interaction and content sharing

### Technical Features
- **Responsive Design** - Mobile-first approach with Material-UI
- **Real-time Updates** - Dynamic content loading and updates
- **Security** - Helmet, CORS, rate limiting, input validation
- **Performance** - Compression, optimization, caching strategies
- **Monitoring** - Health checks and performance monitoring
- **CI/CD** - Automated testing, security scanning, deployment

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Material-UI (MUI)** - Comprehensive UI component library
- **React Router DOM** - Client-side routing and navigation
- **Axios** - HTTP client for API communication
- **React Markdown** - Markdown rendering support

### Backend
- **Node.js & Express** - Server-side JavaScript runtime and web framework
- **MongoDB & Mongoose** - NoSQL database with ODM
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing and security
- **Joi** - Input validation and sanitization
- **Helmet** - Security headers and protection

### DevOps & Infrastructure
- **Docker & Docker Compose** - Containerization and orchestration
- **Jenkins** - CI/CD pipeline automation
- **Nginx** - Reverse proxy and load balancing
- **SonarCloud** - Code quality analysis
- **Snyk** - Security vulnerability scanning

## 📁 Project Structure

```
DevHub/
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── config/            # Database and app configuration
│   │   ├── controllers/       # Request handlers and business logic
│   │   ├── middleware/        # Authentication, validation, error handling
│   │   ├── models/           # MongoDB schemas and models
│   │   ├── routes/           # API route definitions
│   │   └── server.js         # Express server entry point
│   ├── tests/                # Jest test suites
│   └── package.json          # Backend dependencies and scripts
├── frontend/                  # React application
│   ├── public/               # Static assets and index.html
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/           # Page-level components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service functions
│   │   ├── utils/           # Utility functions
│   │   └── App.js           # Main React component
│   └── package.json         # Frontend dependencies and scripts
├── monitoring/               # Health monitoring and alerts
├── docker-compose.test.yml   # Testing environment setup
├── docker-compose.production.yml # Production deployment
├── Dockerfile.development   # Development container
├── Dockerfile.production    # Production-optimized container
├── Jenkinsfile             # CI/CD pipeline configuration
├── nginx.production.conf   # Production Nginx configuration
└── package.json           # Root workspace configuration
```

## 📋 Prerequisites

Before running DevHub, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download Node.js](https://nodejs.org/)
- **npm** (v8 or higher) - Comes with Node.js
- **MongoDB** (v6 or higher) - [Download MongoDB](https://www.mongodb.com/try/download/community)
- **Docker** (optional) - [Download Docker](https://www.docker.com/products/docker-desktop)
- **Git** - [Download Git](https://git-scm.com/downloads)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/stellajo99/DevHub.git
cd DevHub
```

### 2. Install Dependencies
```bash
# Install root dependencies and all workspace dependencies
npm run install-deps

# Or install manually
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. Environment Setup
```bash
# Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit environment files with your settings
```

### 4. Database Setup
```bash
# Start MongoDB (if using local installation)
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Start Development Servers
```bash
# Start both frontend and backend concurrently
npm run dev

# Or start individually
npm run server  # Backend on http://localhost:5000
npm run client  # Frontend on http://localhost:3000
```

## ⚙️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run server` | Start backend server with nodemon |
| `npm run client` | Start frontend React development server |
| `npm run build` | Build frontend for production |
| `npm run test` | Run backend test suite |
| `npm run lint` | Run ESLint code quality checks |

### Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/your-feature-name
   # Make your changes
   npm run test  # Ensure tests pass
   npm run lint  # Check code quality
   git commit -am "Add your feature"
   git push origin feature/your-feature-name
   ```

2. **Code Quality Checks**
   - ESLint for code styling and best practices
   - Jest for unit and integration testing
   - Prettier for code formatting (configured in IDE)

3. **Database Migrations**
   ```bash
   cd backend
   npm run migrate:up    # Run database migrations
   npm run seed:staging  # Seed development data
   ```

## 🧪 Testing

```bash
cd backend
npm test                    # Run all tests
npm run test:coverage      # Generate coverage report
npm test -- --watch       # Run tests in watch mode
```

## 🔄 CI/CD Pipeline

DevHub includes a comprehensive Jenkins pipeline with the following stages:

### Pipeline Stages

1. **🏗️ Build Stage**
   - Install dependencies with `npm ci`
   - Build frontend and backend applications
   - Create optimized Docker images with versioning
   - Generate build metadata and artifacts

2. **🧪 Test Stage**
   - **Unit Tests**: Jest tests for backend logic
   - **Integration Tests**: API and database integration testing
   - Coverage reporting and test result publication

3. **🔍 Code Quality Stage**
   - **SonarCloud Analysis**: Comprehensive code quality metrics
   - Code coverage, complexity analysis, and maintainability scores
   - Quality gates and threshold enforcement

4. **🛡️ Security Stage**
   - **Snyk Vulnerability Scanning**: Dependency and container security
   - CVE detection and severity assessment
   - Automated security reporting


## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/login` | User login | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |

### Posts Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/posts` | Get all posts | No |
| POST | `/api/posts` | Create new post | Yes |
| GET | `/api/posts/:id` | Get specific post | No |
| PUT | `/api/posts/:id` | Update post | Yes (owner) |
| DELETE | `/api/posts/:id` | Delete post | Yes (owner) |

### Comments Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/posts/:id/comments` | Get post comments | No |
| POST | `/api/posts/:id/comments` | Add comment | Yes |
| PUT | `/api/comments/:id` | Update comment | Yes (owner) |
| DELETE | `/api/comments/:id` | Delete comment | Yes (owner) |

### Request/Response Examples

#### User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "developer123",
    "email": "dev@example.com",
    "password": "securePassword123"
  }'
```

#### Create Post
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with React",
    "content": "This is a comprehensive guide to React...",
    "tags": ["react", "javascript", "frontend"]
  }'
```

---

**DevHub** - Built with ❤️ for the developer community