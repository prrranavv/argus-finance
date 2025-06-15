# Argus Finance - Technical Context Diagrams

This directory contains comprehensive technical documentation in SVG format for the Argus Finance application. These diagrams provide detailed insights into the architecture, data flow, and implementation details.

## 📋 Complete Diagram Collection

### 1. System Architecture
- **`01_overall_architecture.svg`** - Complete system overview showing all components and their relationships
- **`02_database_schema.svg`** - Entity-Relationship diagram with all tables, fields, and relationships

### 2. Core Processes
- **`03_statement_processing_flow.svg`** - Step-by-step file upload and AI processing workflow
- **`04_gmail_integration_flow.svg`** - Gmail OAuth setup and email transaction extraction process
- **`05_api_endpoints_overview.svg`** - Complete backend API architecture and endpoints

### 3. Technical Deep Dives
- **`06_ai_processing_pipeline.svg`** - OpenAI GPT-4 powered transaction extraction pipeline
- **`07_data_examples_with_real_fields.svg`** - Real database queries and API responses with actual field names
- **`08_authentication_security_flow.svg`** - JWT authentication and Row Level Security implementation

### 4. Overview & Features
- **`09_feature_map_overview.svg`** - Complete feature map showing all capabilities and future roadmap

## 🎯 Key Features Documented

### Authentication & Security
- JWT token-based authentication
- Row Level Security (RLS) implementation
- User data isolation and privacy controls
- Supabase authentication integration

### AI-Powered Processing
- OpenAI GPT-4 integration for transaction extraction
- Multi-format file support (CSV, PDF, Excel)
- Smart categorization and merchant recognition
- Duplicate detection and prevention

### Multi-Bank Support
- HDFC Bank account and credit card processing
- Axis Bank account and credit card processing
- Automatic bank detection and categorization
- Unified analytics across multiple banks

### Gmail Integration
- OAuth 2.0 setup and configuration
- Automatic email scanning for transactions
- Bank email recognition and filtering
- Privacy-focused email processing

### Dashboard Analytics
- Real-time balance tracking
- Credit card utilization monitoring
- Monthly spending analysis
- Interactive charts and visualizations

### Data Management
- PostgreSQL database with optimized schema
- Real-time data synchronization
- Automated backup and recovery
- Performance optimization and caching

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features and optimizations
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - Backend-as-a-Service platform
- **PostgreSQL** - Relational database with RLS
- **Zod** - Runtime type validation

### External Services
- **OpenAI GPT-4** - AI-powered transaction processing
- **Gmail API** - Email integration and transaction extraction
- **Supabase Storage** - File storage and management
- **Vercel** - Deployment and hosting

## 📊 Database Schema Overview

### Core Tables
- **`users`** - User profiles and authentication data
- **`statements`** - Uploaded financial statement metadata
- **`all_transactions`** - All financial transactions with comprehensive fields
- **`balances`** - Account balance snapshots and credit limits
- **`emails`** - Gmail integration data and processed emails

### Key Relationships
- One-to-many relationships between users and all data tables
- Foreign key constraints ensuring data integrity
- Row Level Security policies on all tables
- Optimized indexes for performance

## 🔐 Security Features

### Authentication
- Supabase Auth with JWT tokens
- Secure session management
- Automatic token refresh
- Cross-tab synchronization

### Data Protection
- Row Level Security (RLS) on all tables
- User-scoped data access
- Encrypted data transmission
- Privacy mode for sensitive information

### API Security
- JWT validation on all endpoints
- Rate limiting and abuse prevention
- Comprehensive error handling
- Audit logging and monitoring

## 🚀 Performance Optimizations

### Database
- Optimized query patterns
- Connection pooling
- Indexed searches
- Aggregation optimizations

### Frontend
- Component lazy loading
- Optimistic UI updates
- Caching strategies
- Mobile responsiveness

### API
- Efficient data serialization
- Bulk operations support
- Error recovery mechanisms
- Real-time subscriptions

## 📈 Analytics & Insights

### Dashboard Metrics
- Current bank balance with trend analysis
- Credit card outstanding balances
- Monthly spending patterns
- Transaction count and frequency

### Visualizations
- Balance progression over time
- Category-wise expense breakdown
- Credit card utilization trends
- Monthly income vs expense comparisons

### Filtering & Search
- Date range filtering
- Bank-specific views
- Category-based filtering
- Full-text transaction search

## 🔄 Real-time Features

### Live Updates
- WebSocket connections for real-time data
- Automatic refresh on data changes
- Cross-device synchronization
- Instant notification of new transactions

### Background Processing
- Automatic Gmail sync
- Scheduled data cleanup
- Performance monitoring
- Error tracking and alerts

## 📱 User Experience

### Interface Features
- Privacy mode toggle for sensitive data
- Responsive design for all devices
- Dark/light theme support
- Intuitive navigation and controls

### Accessibility
- Screen reader compatibility
- Keyboard navigation support
- High contrast mode
- Flexible font sizing

## 🛣️ Future Roadmap

### Planned Features
- Budget planning and goal setting
- Investment portfolio tracking
- Expense prediction using ML
- Advanced analytics dashboard
- Mobile app development
- Team collaboration features

### Technical Improvements
- Enhanced AI processing capabilities
- Additional bank integrations
- Advanced security features
- Performance optimizations
- Scalability enhancements

---

## 📝 Usage Notes

1. **SVG Format**: All diagrams are in SVG format for scalability and clarity
2. **Browser Compatibility**: Best viewed in modern browsers with SVG support
3. **Print Ready**: Diagrams are optimized for both screen viewing and printing
4. **Interactive Elements**: Some diagrams include hover states and clickable areas

## 🔗 Related Documentation

- [API Documentation](../docs/api.md)
- [Database Schema](../docs/database.md)
- [Deployment Guide](../docs/deployment.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

---

**Last Updated**: November 2024  
**Version**: 1.0.0  
**Maintainer**: Argus Finance Development Team 