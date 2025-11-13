# Design Document: Delux+ MVP

## Overview

The Delux+ MVP is a B2B2B travel supply chain platform that connects local travel suppliers with Taiwanese travel agencies through 帝樂旅行社 as the central hub. This design focuses on the core value proposition: enabling suppliers to list tour products and agencies to discover them.

**Design Philosophy**: "No Frills, Just Value" - The MVP validates the business model by implementing only the essential Product Listing → Product Discovery flow.

**Technology Stack**:
- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL on Google Cloud SQL
- File Storage: Google Cloud Storage (for product images)
- Authentication: JWT-based session management

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   React SPA     │
│  (TypeScript)   │
└────────┬────────┘
         │ HTTPS/REST
         │
┌────────▼────────┐
│  Express API    │
│   (Node.js)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────────┐
│ Cloud│  │PostgreSQL │
│Storage│  │  (GCS)    │
└──────┘  └───────────┘
```

### System Boundaries

**Frontend Responsibilities**:
- User interface rendering
- Client-side routing
- Form validation
- Authentication state management
- API communication

**Backend Responsibilities**:
- User authentication and authorization
- Business logic enforcement
- Data validation
- Database operations
- File upload handling
- Role-based access control

## Components and Interfaces

### 1. Authentication System

**Design Decision**: Use JWT tokens for stateless authentication with role-based access control embedded in the token payload.

**Rationale**: JWTs provide a scalable, stateless authentication mechanism suitable for a B2B platform where session management across multiple user types is critical.

#### Components

**AuthService** (Backend)
- `login(email, password)`: Validates credentials and returns JWT
- `verifyToken(token)`: Validates JWT and extracts user info
- `hashPassword(password)`: Secures passwords using bcrypt

**AuthContext** (Frontend)
- Manages authentication state
- Stores JWT in localStorage
- Provides login/logout functions
- Handles role-based redirects

#### API Endpoints

```
POST /api/auth/login
Request: { email: string, password: string }
Response: { token: string, user: { id, email, name, role } }
```

### 2. User Management System

**Design Decision**: Admin-only user creation with manual approval process.

**Rationale**: Maintains platform quality by ensuring only vetted suppliers and agencies gain access, aligning with the B2B2B trust model.

#### Components

**UserService** (Backend)
- `createUser(userData)`: Creates new user account
- `getAllUsers()`: Retrieves all users for admin view
- `getUserById(id)`: Fetches specific user details
- `validateEmail(email)`: Checks for duplicate emails

**UserManagementUI** (Frontend)
- User list table with filtering
- User creation form with role selection
- Email uniqueness validation

#### API Endpoints

```
GET /api/admin/users
Response: [{ id, email, name, role, createdAt }]

POST /api/admin/users
Request: { email, password, name, role }
Response: { id, email, name, role }
```

### 3. Product Management System

**Design Decision**: Two-stage product lifecycle (待審核 → 已發佈) with admin approval gate.

**Rationale**: Quality control mechanism ensures only appropriate content reaches agencies, protecting platform reputation and user experience.

#### Components

**ProductService** (Backend)
- `createProduct(productData, supplierId)`: Creates product with 待審核 status
- `updateProduct(id, productData, supplierId)`: Updates existing product
- `getProductsBySupplier(supplierId)`: Retrieves supplier's products
- `getAllProducts(filters)`: Admin view of all products
- `getPublishedProducts(filters)`: Agency view of published products
- `updateProductStatus(id, status)`: Admin-only status change
- `uploadCoverImage(file)`: Handles image upload to Cloud Storage

**ProductFormUI** (Frontend - Supplier)
- Rich text editor for 產品描述
- Image upload with preview
- Form validation for required fields
- Currency input for 淨價 (TWD)

**ProductListUI** (Frontend - Supplier)
- Dashboard showing supplier's products
- Status indicators (待審核/已發佈)
- Edit navigation

#### API Endpoints

```
POST /api/supplier/tours
Request: FormData {
  產品標題: string,
  目的地: string,
  天數: number,
  產品描述: string (HTML),
  封面圖: File,
  淨價: number
}
Response: { id, ...productData, status: '待審核' }

GET /api/supplier/tours
Response: [{ id, 產品標題, status, createdAt }]

PUT /api/supplier/tours/:id
Request: FormData (same as POST)
Response: { id, ...updatedProductData }

GET /api/admin/tours
Response: [{ id, 產品標題, 供應商名稱, status, createdAt }]

PUT /api/admin/tours/:id/status
Request: { status: '已發佈' | '待審核' }
Response: { id, status }

GET /api/agency/tours
Query: ?目的地=string&天數=number
Response: [{ id, 產品標題, 封面圖, 天數, 供應商名稱, 淨價 }]

GET /api/agency/tours/:id
Response: { id, 產品標題, 目的地, 天數, 供應商名稱, 淨價, 封面圖, 產品描述 }
```

### 4. Product Discovery System

**Design Decision**: Card-based layout with client-side filtering for immediate feedback.

**Rationale**: Visual card layout optimizes for browsing behavior, while client-side filtering provides instant results without server round-trips.

#### Components

**ProductDiscoveryUI** (Frontend - Agency)
- Card grid layout
- Filter controls (目的地, 天數)
- Empty state messaging
- Product detail modal/page

**FilterService** (Frontend)
- `applyFilters(products, filters)`: Client-side filtering logic
- `getUniqueDestinations(products)`: Extracts filter options
- `getUniqueDurations(products)`: Extracts duration options

## Data Models

### User Model

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'supplier' | 'agency';
  createdAt: Date;
  updatedAt: Date;
}
```

**Database Schema**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'supplier', 'agency')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Product Model

```typescript
interface Product {
  id: string;
  supplierId: string;
  產品標題: string;
  目的地: string;
  天數: number;
  產品描述: string; // HTML content
  封面圖: string; // Cloud Storage URL
  淨價: number; // TWD
  status: 'pending' | 'published';
  createdAt: Date;
  updatedAt: Date;
}
```

**Database Schema**:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  duration_days INTEGER NOT NULL,
  description TEXT NOT NULL,
  cover_image_url VARCHAR(1000) NOT NULL,
  net_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_destination ON products(destination);
CREATE INDEX idx_products_duration ON products(duration_days);
```

## Error Handling

### Authentication Errors

- **Invalid Credentials**: Return 401 with message "Invalid email or password"
- **Expired Token**: Return 401 with message "Session expired, please login again"
- **Missing Token**: Return 401 with message "Authentication required"
- **Insufficient Permissions**: Return 403 with message "Access denied"

### Validation Errors

- **Missing Required Fields**: Return 400 with field-specific error messages
- **Duplicate Email**: Return 409 with message "Email already registered"
- **Invalid File Type**: Return 400 with message "Only JPEG, PNG, and WebP images are allowed"
- **File Too Large**: Return 413 with message "Image must be less than 5MB"

### Database Errors

- **Connection Failure**: Return 503 with message "Service temporarily unavailable"
- **Constraint Violation**: Return 400 with appropriate message
- **Not Found**: Return 404 with message "Resource not found"

### Frontend Error Handling

**Design Decision**: Use toast notifications for transient errors and inline validation for form errors.

**Rationale**: Provides immediate feedback without disrupting user flow, while form validation prevents invalid submissions.

## Security Considerations

### Authentication Security

- Passwords hashed using bcrypt with salt rounds = 10
- JWT tokens expire after 24 hours
- Tokens include role information for authorization
- HTTPS enforced for all API communication

### Authorization Model

**Role-Based Access Control**:

| Route Pattern | Admin | Supplier | Agency |
|--------------|-------|----------|--------|
| /admin/* | ✓ | ✗ | ✗ |
| /supplier/* | ✗ | ✓ | ✗ |
| /agency/* | ✗ | ✗ | ✓ |

**Backend Middleware**: `requireRole(allowedRoles)` validates JWT and checks role before allowing access.

### Data Security

- SQL injection prevention via parameterized queries
- XSS prevention via HTML sanitization in rich text editor
- File upload validation (type, size, content)
- CORS configuration limiting allowed origins

## File Storage Strategy

**Design Decision**: Use Google Cloud Storage for product images with public read access.

**Rationale**: Separates static assets from database, provides CDN capabilities, and scales independently.

### Upload Flow

1. Frontend validates file (type, size)
2. Backend receives file via multipart/form-data
3. Backend generates unique filename: `${productId}-${timestamp}.${ext}`
4. Backend uploads to GCS bucket: `delux-plus-products`
5. Backend stores public URL in database
6. Frontend displays image via public URL

### Image Specifications

- Accepted formats: JPEG, PNG, WebP
- Maximum size: 5MB
- Recommended dimensions: 1200x800px
- Compression: Applied server-side before upload

## Testing Strategy

### Unit Testing

**Backend**:
- Service layer functions (AuthService, UserService, ProductService)
- Validation logic
- Utility functions (password hashing, token generation)

**Frontend**:
- Form validation logic
- Filter functions
- Authentication context

### Integration Testing

- API endpoint testing with test database
- Authentication flow (login → token → protected routes)
- Product lifecycle (create → review → publish → discover)
- File upload and retrieval

### End-to-End Testing

**Critical User Flows**:
1. Supplier creates product → Admin reviews → Agency discovers
2. Admin creates users → Users login → Role-based redirect
3. Agency filters products → Views details

**Testing Tools**:
- Backend: Jest + Supertest
- Frontend: React Testing Library
- E2E: Playwright or Cypress

## Performance Considerations

### Database Optimization

- Indexes on frequently queried fields (email, role, status, destination)
- Connection pooling for database connections
- Prepared statements for repeated queries

### Frontend Optimization

- Lazy loading for routes
- Image optimization and lazy loading
- Debounced filter inputs
- Pagination for product lists (future enhancement)

### Caching Strategy

**Phase 1 (MVP)**: No caching - prioritize correctness
**Phase 2**: Consider caching published products list with TTL

## Deployment Architecture

### Google Cloud Platform Setup

**Cloud SQL (PostgreSQL)**:
- Instance tier: db-f1-micro (MVP)
- Automated backups enabled
- Private IP for backend access

**Cloud Storage**:
- Bucket: `delux-plus-products`
- Public read access
- Lifecycle policy: None (MVP)

**Cloud Run** (Backend):
- Auto-scaling: 0-10 instances
- Environment variables: DB credentials, JWT secret
- Health check endpoint: `/health`

**Firebase Hosting** (Frontend):
- SPA configuration with rewrites
- CDN enabled
- Custom domain support

## Internationalization

**Design Decision**: Chinese (Traditional) as primary language with English fallbacks for technical terms.

**Rationale**: Target users are Taiwanese agencies and Chinese-speaking suppliers. Technical terms remain in English for clarity.

### Implementation

- UI labels in Traditional Chinese
- Database fields store Chinese content
- Error messages in Chinese
- Currency display: TWD format (NT$X,XXX)

## Future Considerations (Post-MVP)

These are explicitly out of scope for MVP but inform design decisions:

- **Messaging System**: Design allows for future user-to-user communication
- **Booking Flow**: Product model can extend to include availability
- **Payment Integration**: Price field structure supports future payment processing
- **Multi-language Support**: Architecture allows for i18n layer addition
- **Advanced Filtering**: Database indexes support complex queries
- **Analytics**: Event tracking hooks can be added to existing components

## Migration Strategy

### Initial Data Seeding

1. Create admin user via SQL script
2. Admin creates initial supplier and agency test accounts
3. Suppliers create sample products for testing

### Database Migrations

- Use migration tool (e.g., node-pg-migrate)
- Version-controlled migration files
- Rollback capability for each migration

## Monitoring and Observability

### Logging

- Structured logging with Winston
- Log levels: ERROR, WARN, INFO, DEBUG
- Request/response logging with correlation IDs

### Metrics

- API response times
- Error rates by endpoint
- Authentication success/failure rates
- Product creation and publishing rates

### Alerts

- Database connection failures
- High error rates (>5% of requests)
- Storage upload failures
