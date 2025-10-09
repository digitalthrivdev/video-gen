# Video Generation Platform

AI-powered video and image generation platform built with Next.js, FAL AI, and Google Veo3.

## 🚀 Quick Start

1. **Setup**: See [docs/START_HERE.md](docs/START_HERE.md)
2. **Deploy**: See [docs/QUICK_DEPLOY.md](docs/QUICK_DEPLOY.md)

## 📚 Documentation

All documentation is organized in the [`docs/`](docs/) folder:

- **📖 [Documentation Index](docs/INDEX.md)** - Browse all documentation
- **🚀 [Deployment Guide](docs/DEPLOYMENT.md)** - Deploy to production
- **🗄️ [Database Setup](docs/DATABASE_SETUP.md)** - Configure database
- **🔐 [Auth Setup](docs/NEXTAUTH_SETUP.md)** - Configure authentication
- **🐛 [Troubleshooting](docs/ISSUES_FOUND_AND_FIXED.md)** - Common issues

## ✨ Features

- **Video Generation**: AI-powered video creation using Google Veo3
- **Image Generation**: Text-to-image with FAL AI Nano Banana
- **Image-to-Image**: Transform images with AI guidance
- **Token System**: Credit-based usage with Cashfree payments
- **Real-Time Pricing**: Database-driven package management
- **Authentication**: Secure login with NextAuth (Google OAuth)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: NextAuth.js
- **AI**: FAL AI, Google Veo3
- **CDN**: ImageKit
- **Payments**: Cashfree
- **Deployment**: Vercel

## 🔧 Environment Setup

```bash
# Install dependencies
pnpm install

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Run development server
pnpm dev
```

## 📖 Key Documentation

| Topic | Documentation |
|-------|---------------|
| Getting Started | [START_HERE.md](docs/START_HERE.md) |
| Deployment | [DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Database | [DATABASE_SETUP.md](docs/DATABASE_SETUP.md) |
| Security | [SECURITY_FIX_PAYMENT.md](docs/SECURITY_FIX_PAYMENT.md) |
| Features | [IMAGE_GENERATION_FEATURE.md](docs/IMAGE_GENERATION_FEATURE.md) |
| Caching | [NO_CACHE_CONFIGURATION.md](docs/NO_CACHE_CONFIGURATION.md) |

## 🔒 Security

- Server-side pricing validation
- Database-driven package management
- Secure payment processing
- Multi-layer security checks
- Audit logging

## 📦 Project Structure

```
├── app/              # Next.js app directory
├── components/       # React components
├── lib/              # Utilities and configurations
├── prisma/           # Database schema and migrations
├── docs/             # 📚 All documentation files
└── public/           # Static assets
```
---

For detailed documentation, see the [`docs/`](docs/) folder or start with the [Documentation Index](docs/INDEX.md).
