# Delux+ 帝樂旅遊平台

B2B2B Travel Supply Chain Platform connecting local travel suppliers with
Taiwanese travel agencies.

## Project Structure

```
delux-plus/
├── backend/          # Express.js backend API
│   ├── src/
│   │   ├── config/   # Database and storage configuration
│   │   └── index.ts  # Main application entry
│   ├── package.json
│   └── tsconfig.json
├── frontend/         # React frontend application
│   ├── src/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL (Google Cloud SQL for production)
- Google Cloud Storage account

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:
   - Database credentials (PostgreSQL)
   - JWT secret
   - Google Cloud Storage credentials

5. Run the development server:
   ```bash
   npm run dev
   ```

The backend will start on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment files:
   ```bash
   cp .env.example .env.local
   cp .env.example .env.staging
   cp .env.example .env.production
   ```

4. Run the development server (uses Vite proxy to local backend):
   ```bash
   npm run dev
   ```

   (Optional) Run with staging environment variables:
   ```bash
   npm run dev:staging
   ```

The frontend will start on `http://localhost:5173`

## Technology Stack

### Backend

- Node.js with Express
- TypeScript
- PostgreSQL (via pg)
- JWT for authentication
- Google Cloud Storage for images
- bcrypt for password hashing

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Axios for API calls

## Environment Variables

### Backend (.env)

- `PORT`: Server port (default: 3000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: PostgreSQL
  connection
- `JWT_SECRET`: Secret key for JWT tokens
- `GCS_PROJECT_ID`, `GCS_BUCKET_NAME`, `GCS_KEYFILE_PATH`: Google Cloud Storage
  config
- `CORS_ORIGIN`: Comma-separated list of allowed origins (e.g.,
  `http://localhost:5173,https://your-domain.web.app`)

### Frontend (.env.local / .env.staging / .env.production)

- `VITE_API_BASE_URL`: Backend API URL (Leave empty in `.env.local` to use the
  Vite proxy, specify Cloud Run URLs for staging and production)

## Development

- Backend runs on port 3000
- Frontend runs on port 5173 with proxy to backend
- Hot reload enabled for both frontend and backend

## Build for Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
```

## Deployment

### Manual Deployment

See the **[Development Workflow Guide](deployment/WORKFLOW.md)** for detailed
instructions on standard feature development, staging, testing and promotions.

See the [deployment guide](deployment/README.md) for detailed instructions on
initial cloud setup to Google Cloud Platform.

### Automated CI/CD

Automated deployment from GitHub to GCP is configured using GitHub Actions.

**Quick Setup:**

1. Run the setup script: `.github/setup-cicd.sh`
2. Add secrets to GitHub repository settings
3. Push to `main` branch to trigger deployment

**Documentation:**

- 🚀 [Quick Start Guide](.github/QUICK-START.md) - Get started in 5 minutes
- 📖 [Complete CI/CD Setup](.github/CICD-SETUP.md) - Detailed configuration
  guide
- 📋 [CI/CD Summary](CICD-SUMMARY.md) - Overview and usage examples

**What's Automated:**

- ✅ Backend deployment to Cloud Run
- ✅ Frontend deployment to Firebase Hosting
- ✅ Automated testing on push/PR
- ✅ Docker image building and pushing
- ✅ Health checks after deployment

Push to `main` branch and your changes will automatically deploy! 🎉

## Database Seeding

Create initial admin user and test data:

```bash
cd backend

# Create admin user
npm run seed:admin

# Create test data (optional)
npm run seed:test
```

See [backend/SEEDING.md](backend/SEEDING.md) for detailed instructions.

## License

See LICENSE file for details.
