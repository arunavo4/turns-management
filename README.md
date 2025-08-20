# Turns Management System

A modern property turns management application for tracking property renovations, vendor assignments, and approval workflows.

## 🚀 Features

- **Property Management**: Full CRUD operations for property portfolio
- **Turn Workflow**: Kanban board for renovation tracking
- **Vendor Management**: Track vendor performance and assignments
- **Approval System**: DFO/HO approval workflow for turn budgets
- **Real-time Updates**: Optimistic UI updates with React Query
- **Performance Metrics**: Dashboard and reporting capabilities

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router) with TypeScript
- **Database**: PostgreSQL (Any provider - Azure, AWS RDS, Supabase, etc.)
- **ORM**: Drizzle ORM
- **UI**: Tailwind CSS v4 + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Authentication**: Better Auth

## 📋 Prerequisites

- Node.js 18+ 
- pnpm 8+
- PostgreSQL database (any provider)

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/turns-management.git
cd turns-management
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your PostgreSQL connection in `.env.local`:
```env
# PostgreSQL Database (works with any provider)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
DATABASE_URL_POOLED=postgresql://user:password@host:5432/dbname?sslmode=require

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Run database migrations:
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

6. Seed the database (optional):
```bash
pnpm tsx lib/db/seed.ts
```

7. Start the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📝 Database Providers

This application works with any PostgreSQL provider:

### Azure Database for PostgreSQL
```env
DATABASE_URL=postgresql://user@server:password@server.postgres.database.azure.com:5432/dbname?sslmode=require
```

### AWS RDS PostgreSQL
```env
DATABASE_URL=postgresql://user:password@instance.region.rds.amazonaws.com:5432/dbname
```

### Supabase
```env
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

### Railway
```env
DATABASE_URL=postgresql://postgres:[password]@[host].railway.app:5432/railway
```

### Local PostgreSQL
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/turns_management
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── api/               # REST API endpoints
│   ├── dashboard/         # Dashboard page
│   ├── properties/        # Property management
│   ├── turns/            # Turn workflow
│   └── vendors/          # Vendor management
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── layout/           # Layout components
├── lib/                   # Utilities and configurations
│   ├── db/               # Database schema and migrations
│   └── api/              # API client functions
└── public/               # Static assets
```

## 📚 Available Scripts

```bash
# Development
pnpm dev                   # Start development server
pnpm build                 # Build for production
pnpm start                 # Start production server
pnpm lint                  # Run ESLint

# Database
pnpm drizzle-kit generate  # Generate migrations
pnpm drizzle-kit migrate   # Apply migrations
pnpm drizzle-kit studio    # Open Drizzle Studio
pnpm tsx lib/db/seed.ts    # Seed database

# Type checking
pnpm typecheck            # Run TypeScript compiler
```

## 🔐 Default Test Users

After seeding the database:
- **Admin**: admin@example.com
- **Property Manager**: pm@example.com

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker
```bash
docker build -t turns-management .
docker run -p 3000:3000 --env-file .env.local turns-management
```

### Traditional Hosting
```bash
pnpm build
pnpm start
```

## 📖 API Documentation

REST API endpoints are available at:
- `/api/properties` - Property CRUD operations
- `/api/turns` - Turn management
- `/api/vendors` - Vendor management
- `/api/auth` - Authentication

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@example.com or open an issue in the repository.