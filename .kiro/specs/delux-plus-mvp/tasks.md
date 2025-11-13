# Implementation Plan

- [x] 1. Set up project structure and dependencies
  - Initialize monorepo structure with backend and frontend directories
  - Configure TypeScript for both backend and frontend
  - Install core dependencies: Express, React, PostgreSQL client, JWT libraries
  - Set up environment configuration files for database and Cloud Storage credentials
  - _Requirements: 8.1, 8.2_

- [x] 2. Implement database schema and migrations
  - Create PostgreSQL migration files for users and products tables
  - Add indexes for email, role, status, destination, and duration fields
  - Create database connection pool configuration
  - Implement migration runner script
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 3. Build authentication system backend
  - [x] 3.1 Implement password hashing utilities using bcrypt
    - Create hashPassword and comparePassword functions
    - _Requirements: 1.2_
  
  - [x] 3.2 Implement JWT token generation and verification
    - Create generateToken function with role embedded in payload
    - Create verifyToken middleware for protected routes
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  
  - [x] 3.3 Create login API endpoint
    - Implement POST /api/auth/login with credential validation
    - Return JWT token and user info on success
    - Handle invalid credentials with appropriate error response
    - _Requirements: 1.1, 1.2, 1.6_
  
  - [x] 3.4 Write unit tests for authentication service
    - Test password hashing and comparison
    - Test JWT generation and verification
    - Test login endpoint with valid and invalid credentials
    - _Requirements: 1.2, 1.6_

- [x] 4. Build role-based access control middleware
  - Create requireAuth middleware to verify JWT tokens
  - Create requireRole middleware to check user roles
  - Implement authorization error handling (401, 403)
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 5. Implement user management backend
  - [x] 5.1 Create UserService with CRUD operations
    - Implement createUser with email uniqueness validation
    - Implement getAllUsers for admin user list
    - Implement getUserById for user details
    - _Requirements: 2.1, 2.3, 2.4, 2.5_
  
  - [x] 5.2 Create admin user management API endpoints
    - Implement GET /api/admin/users with role authorization
    - Implement POST /api/admin/users with validation
    - Handle duplicate email errors
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 5.3 Write unit tests for user service
    - Test user creation with valid and duplicate emails
    - Test user retrieval operations
    - _Requirements: 2.3, 2.4_

- [x] 6. Implement product management backend
  - [x] 6.1 Create ProductService with core operations
    - Implement createProduct with supplier association
    - Implement updateProduct with ownership validation
    - Implement getProductsBySupplier
    - Implement getAllProducts for admin view
    - Implement getPublishedProducts with filtering
    - _Requirements: 3.4, 4.5, 5.1, 6.1, 8.4_
  
  - [x] 6.2 Implement Cloud Storage integration for images
    - Configure Google Cloud Storage client
    - Create uploadCoverImage function with file validation
    - Generate unique filenames and store public URLs
    - Validate file type (JPEG, PNG, WebP) and size (5MB max)
    - _Requirements: 3.3, 8.3_
  
  - [x] 6.3 Create supplier product API endpoints
    - Implement POST /api/supplier/tours with multipart form handling
    - Implement GET /api/supplier/tours filtered by supplier
    - Implement PUT /api/supplier/tours/:id with ownership check
    - Set product status to 待審核 on creation
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 4.1, 4.4, 4.5_
  
  - [x] 6.4 Create admin product review API endpoints
    - Implement GET /api/admin/tours with all products
    - Implement GET /api/admin/tours/:id for product details
    - Implement PUT /api/admin/tours/:id/status for status updates
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  
  - [x] 6.5 Create agency product discovery API endpoints
    - Implement GET /api/agency/tours with published filter
    - Add query parameters for destination and duration filtering
    - Implement GET /api/agency/tours/:id for product details
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 7.1, 7.2_
  
  - [x] 6.6 Write integration tests for product APIs
    - Test product creation and image upload
    - Test product status workflow (pending → published)
    - Test filtering by destination and duration
    - Test authorization for different roles
    - _Requirements: 3.4, 5.3, 5.4, 6.1, 6.6_

- [x] 7. Build frontend authentication and routing
  - [x] 7.1 Create authentication context and hooks
    - Implement AuthContext with login/logout functions
    - Store JWT in localStorage
    - Create useAuth hook for components
    - _Requirements: 1.2_
  
  - [x] 7.2 Implement login page component
    - Create login form with email and password fields
    - Handle form submission and API call
    - Display error messages for invalid credentials
    - _Requirements: 1.1, 1.6_
  
  - [x] 7.3 Set up role-based routing
    - Configure React Router with protected routes
    - Implement role-based redirects after login
    - Redirect admin to /admin/users
    - Redirect supplier to /supplier/dashboard
    - Redirect agency to /agency/dashboard
    - _Requirements: 1.3, 1.4, 1.5_
  
  - [x] 7.4 Write tests for authentication flow
    - Test login form validation
    - Test successful login and redirect
    - Test failed login error display
    - _Requirements: 1.1, 1.2, 1.6_

- [x] 8. Build admin user management UI
  - [x] 8.1 Create user list table component
    - Display all users with name, email, and role columns
    - Fetch users from GET /api/admin/users
    - _Requirements: 2.1_
  
  - [x] 8.2 Create user creation form component
    - Build form with email, password, name, and role fields
    - Implement form validation for required fields
    - Handle form submission to POST /api/admin/users
    - Display success message on user creation
    - Display error for duplicate email
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  
  - [x] 8.3 Write tests for user management UI
    - Test user list rendering
    - Test form validation
    - Test duplicate email error handling
    - _Requirements: 2.1, 2.3, 2.4_

- [-] 9. Build supplier product creation UI
  - [x] 9.1 Create product form component
    - Build form with fields: 產品標題, 目的地, 天數, 產品描述, 封面圖, 淨價
    - Integrate rich text editor for 產品描述 (e.g., TinyMCE or Quill)
    - Implement image upload with preview
    - Add form validation for required fields
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  
  - [x] 9.2 Implement product creation submission
    - Handle multipart form data submission to POST /api/supplier/tours
    - Display validation errors for incomplete fields
    - Redirect to dashboard on successful creation
    - _Requirements: 3.4, 3.5_
  
  - [x] 9.3 Write tests for product form
    - Test form validation
    - Test image upload validation (type and size)
    - Test successful submission
    - _Requirements: 3.3, 3.4, 3.5_

- [x] 10. Build supplier product management UI
  - [x] 10.1 Create supplier dashboard component
    - Display list of supplier's products with 產品標題 and status
    - Fetch products from GET /api/supplier/tours
    - Show status badges (待審核/已發佈)
    - _Requirements: 4.1, 4.2_
  
  - [x] 10.2 Create product edit page
    - Reuse product form component with pre-filled data
    - Fetch product details for editing
    - Handle update submission to PUT /api/supplier/tours/:id
    - Maintain product status on update
    - _Requirements: 4.3, 4.4, 4.5_
  
  - [x] 10.3 Write tests for supplier dashboard
    - Test product list rendering with status
    - Test navigation to edit page
    - Test product update flow
    - _Requirements: 4.1, 4.2, 4.5_

- [x] 11. Build admin product review UI
  - [x] 11.1 Create admin product list component
    - Display table with 產品標題, 供應商名稱, and status columns
    - Fetch all products from GET /api/admin/tours
    - _Requirements: 5.1_
  
  - [x] 11.2 Create product detail view for admin
    - Display all product details including 產品描述, 封面圖, 目的地, 天數, 淨價
    - Fetch product details from GET /api/admin/tours/:id
    - _Requirements: 5.2_
  
  - [x] 11.3 Implement product status update
    - Add status dropdown or buttons (待審核/已發佈)
    - Submit status change to PUT /api/admin/tours/:id/status
    - Update UI immediately on status change
    - _Requirements: 5.3, 5.5_
  
  - [x] 11.4 Write tests for admin product review
    - Test product list rendering
    - Test product detail display
    - Test status update flow
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 12. Build agency product discovery UI
  - [x] 12.1 Create product card grid component
    - Display published products in card layout
    - Show 封面圖, 產品標題, 天數, 供應商名稱, 淨價 on each card
    - Fetch products from GET /api/agency/tours
    - _Requirements: 6.1, 6.2_
  
  - [x] 12.2 Implement product filtering
    - Create filter controls for 目的地 and 天數
    - Apply filters via API query parameters
    - Display "no products found" message when filters return empty results
    - Support multiple simultaneous filters
    - _Requirements: 6.3, 6.4, 6.5, 6.6_
  
  - [x] 12.3 Create product detail page for agencies
    - Display complete product information
    - Render rich text 產品描述 with formatting and images
    - Format 淨價 in TWD currency (NT$X,XXX)
    - Navigate from card click to detail page
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 12.4 Write tests for product discovery
    - Test product card rendering
    - Test filter functionality
    - Test empty state display
    - Test product detail navigation
    - _Requirements: 6.1, 6.3, 6.5, 6.6, 7.1_

- [x] 13. Implement error handling and validation
  - Add global error handler middleware in backend
  - Implement consistent error response format
  - Add frontend error boundary component
  - Create toast notification system for user feedback
  - Add inline validation messages for forms
  - _Requirements: 1.6, 2.4, 3.5_

- [x] 14. Set up deployment configuration
  - [x] 14.1 Configure Google Cloud SQL instance
    - Create PostgreSQL instance on Google Cloud
    - Set up connection credentials
    - Run database migrations
    - _Requirements: 8.1, 8.2_
  
  - [x] 14.2 Configure Google Cloud Storage bucket
    - Create storage bucket for product images
    - Set public read access permissions
    - Configure CORS for frontend uploads
    - _Requirements: 8.3_
  
  - [x] 14.3 Deploy backend to Cloud Run
    - Create Dockerfile for Express backend
    - Configure environment variables
    - Set up health check endpoint
    - Deploy and test API endpoints
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 14.4 Deploy frontend to Firebase Hosting
    - Build React production bundle
    - Configure Firebase hosting with SPA rewrites
    - Deploy and verify routing
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [x] 15. Create initial data and admin account
  - Write SQL script to create initial admin user
  - Document admin credentials securely
  - Create seed data script for testing (optional sample products)
  - _Requirements: 2.1, 2.2_
