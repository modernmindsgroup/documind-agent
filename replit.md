# AI Agent Dashboard - Multi-Tenant Voice AI Platform

## Overview

The AI Agent Dashboard is a comprehensive multi-tenant platform for creating, deploying, and managing voice and chat-based AI agents. Built with a modern React frontend and Express backend, it provides an intuitive interface for developers and businesses to build conversational AI solutions without extensive technical expertise. The platform supports multiple agent types (single prompt, multi-prompt, conversation flows, custom LLMs), visual workflow design, knowledge base management, and real-time monitoring capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system implementation
- **Styling**: Tailwind CSS with custom dark mode theming following Material Design principles
- **State Management**: TanStack React Query for server state and React Context for authentication
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **API Design**: RESTful API architecture with protected routes and tenant isolation
- **Middleware**: Custom authentication middleware and request logging

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Multi-tenant architecture with the following core entities:
  - **Users**: Authentication and user management with role-based access
  - **Tenants**: Multi-tenant isolation for organizations
  - **Agents**: AI agent configurations supporting multiple types (conversation_flow, single_prompt, multi_prompt, custom_llm)
  - **Workflows**: Visual workflow definitions with nodes and edges for conversation flows
  - **Knowledge Base**: Document and FAQ management system
  - **Logs**: Comprehensive logging for calls, chats, and webhooks
  - **Webhooks & API Keys**: Integration management and security

### Authentication & Authorization
- **Strategy**: JWT tokens with 7-day expiration stored in localStorage
- **Multi-tenancy**: Tenant-based data isolation enforced at the database and API level
- **Role System**: Super admin and tenant admin roles with appropriate permissions
- **Security**: Password hashing with bcrypt, protected routes, and CORS configuration

### UI/UX Design System
- **Theme**: Dark mode primary with Material Design principles for enterprise applications
- **Color System**: HSL-based color variables supporting both light and dark themes
- **Typography**: Inter font family for readability in data-heavy interfaces
- **Component Library**: Comprehensive set of accessible components built on Radix UI primitives
- **Responsive Design**: Mobile-first approach with Tailwind's responsive utilities

### Development Tooling
- **Build System**: Vite for fast development and optimized production builds
- **Type Safety**: Full TypeScript coverage across frontend, backend, and shared schemas
- **Code Quality**: ESLint and TypeScript strict mode for consistency
- **Development Features**: Hot module replacement, error overlays, and Replit integration

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Drizzle Kit**: Database migrations and schema management

### UI Framework
- **Radix UI**: Headless component primitives for accessibility and keyboard navigation
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Lucide React**: Consistent icon library for interface elements

### Authentication & Security
- **jsonwebtoken**: JWT token generation and verification
- **bcrypt**: Secure password hashing and comparison

### Development & Build Tools
- **Vite**: Modern build tool with fast HMR and optimized bundling
- **esbuild**: Fast JavaScript bundler for server-side builds
- **PostCSS**: CSS processing with Tailwind integration

### Form & Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation for forms and API data

### Query Management
- **TanStack React Query**: Server state management with caching, synchronization, and background updates

### Utilities
- **clsx & tailwind-merge**: Conditional className handling and Tailwind class merging
- **class-variance-authority**: Type-safe component variant API
- **nanoid**: Cryptographically secure ID generation