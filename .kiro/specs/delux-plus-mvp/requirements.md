# Requirements Document

## Introduction

The Delux+ platform is a B2B2B supply chain platform connecting local travel suppliers with Taiwanese travel agencies, with 帝樂旅行社 acting as the central hub. This MVP focuses on validating the core business model: proving that local suppliers will upload tour products and Taiwanese agencies will browse and consider these products.

The MVP follows a "No Frills, Just Value" philosophy, focusing exclusively on the core user flow: Product Listing → Product Discovery.

## Glossary

- **Delux+ Platform**: The B2B2B travel supply chain web application
- **帝樂 Admin**: Platform administrator who manages users and content
- **當地供應商 (Local Supplier)**: Travel product suppliers who upload tour offerings
- **台灣旅行社 (Taiwanese Agency)**: Travel agencies who browse and discover products
- **旅遊產品 (Tour Product)**: A travel package or tour offering with details like destination, duration, description, and pricing
- **Authentication System**: Backend-managed username/password login mechanism
- **Product Status**: State of a tour product (待審核 - pending review, 已發佈 - published)

## Requirements

### Requirement 1: User Authentication and Role-Based Access

**User Story:** As a user of the Delux+ platform, I want to log in with my credentials and be directed to the appropriate interface for my role, so that I can access the features relevant to my responsibilities.

#### Acceptance Criteria

1. WHEN a user navigates to /login, THE Delux+ Platform SHALL display a login form with email and password fields
2. WHEN a user submits valid credentials, THE Delux+ Platform SHALL authenticate the user and identify their role
3. WHEN authentication succeeds for a 帝樂 Admin, THE Delux+ Platform SHALL redirect to /admin/users
4. WHEN authentication succeeds for a 當地供應商, THE Delux+ Platform SHALL redirect to /supplier/dashboard
5. WHEN authentication succeeds for a 台灣旅行社, THE Delux+ Platform SHALL redirect to /agency/dashboard
6. WHEN a user submits invalid credentials, THE Delux+ Platform SHALL display an error message and remain on the login page

### Requirement 2: Admin User Management

**User Story:** As a 帝樂 Admin, I want to manually create user accounts for suppliers and agencies, so that I can control platform access and maintain quality standards.

#### Acceptance Criteria

1. WHEN a 帝樂 Admin navigates to /admin/users, THE Delux+ Platform SHALL display a table listing all registered users with their name, email, and role
2. WHEN a 帝樂 Admin clicks the "Add User" button, THE Delux+ Platform SHALL display a form with fields for email, temporary password, name, and role selection
3. WHEN a 帝樂 Admin submits the user creation form with valid data, THE Delux+ Platform SHALL create a new user account and add it to the user table
4. WHEN a 帝樂 Admin submits the user creation form with an email that already exists, THE Delux+ Platform SHALL display an error message indicating the email is already registered
5. THE Delux+ Platform SHALL support three role types: 帝樂 Admin, 當地供應商, and 台灣旅行社

### Requirement 3: Supplier Product Creation

**User Story:** As a 當地供應商, I want to create and upload detailed tour products, so that I can showcase my offerings to Taiwanese travel agencies.

#### Acceptance Criteria

1. WHEN a 當地供應商 navigates to /supplier/tours/new, THE Delux+ Platform SHALL display a form with fields for 產品標題, 目的地, 天數, 產品描述, 封面圖, and 淨價
2. WHEN a 當地供應商 enters text in the 產品描述 field, THE Delux+ Platform SHALL provide rich text editing capabilities including basic formatting and image insertion
3. WHEN a 當地供應商 uploads a 封面圖, THE Delux+ Platform SHALL accept common image formats (JPEG, PNG, WebP) with a maximum file size of 5MB
4. WHEN a 當地供應商 submits the form with all required fields completed, THE Delux+ Platform SHALL create a new 旅遊產品 with status 待審核
5. WHEN a 當地供應商 submits the form with missing required fields, THE Delux+ Platform SHALL display validation errors for each incomplete field
6. WHEN a 旅遊產品 is created, THE Delux+ Platform SHALL store the 淨價 in TWD currency

### Requirement 4: Supplier Product Management

**User Story:** As a 當地供應商, I want to view and edit my tour products, so that I can manage my product catalog and update information as needed.

#### Acceptance Criteria

1. WHEN a 當地供應商 navigates to /supplier/dashboard, THE Delux+ Platform SHALL display a list of all 旅遊產品 created by that supplier
2. WHILE displaying the product list, THE Delux+ Platform SHALL show each product's 產品標題 and current status (待審核 or 已發佈)
3. WHEN a 當地供應商 clicks on a product in the dashboard, THE Delux+ Platform SHALL navigate to /supplier/tours/edit/:id
4. WHEN a 當地供應商 navigates to /supplier/tours/edit/:id, THE Delux+ Platform SHALL display the product creation form pre-filled with existing product data
5. WHEN a 當地供應商 submits the edit form with valid changes, THE Delux+ Platform SHALL update the 旅遊產品 and maintain its current status

### Requirement 5: Admin Product Review and Publishing

**User Story:** As a 帝樂 Admin, I want to review submitted tour products and publish approved ones, so that I can ensure content quality before making products visible to agencies.

#### Acceptance Criteria

1. WHEN a 帝樂 Admin navigates to /admin/tours, THE Delux+ Platform SHALL display a table listing all submitted 旅遊產品 with their 產品標題, 供應商名稱, and status
2. WHEN a 帝樂 Admin clicks on a product in the table, THE Delux+ Platform SHALL display all product details including 產品描述, 封面圖, 目的地, 天數, and 淨價
3. WHEN a 帝樂 Admin changes a product status from 待審核 to 已發佈, THE Delux+ Platform SHALL update the product status and make it visible to 台灣旅行社 users
4. WHILE a product has status 待審核, THE Delux+ Platform SHALL NOT display the product to 台灣旅行社 users
5. WHEN a product status is changed to 已發佈, THE Delux+ Platform SHALL immediately make the product available in the agency product listing

### Requirement 6: Agency Product Discovery

**User Story:** As a 台灣旅行社, I want to browse and filter available tour products, so that I can discover offerings that match my customers' needs.

#### Acceptance Criteria

1. WHEN a 台灣旅行社 navigates to /agency/dashboard, THE Delux+ Platform SHALL display all 旅遊產品 with status 已發佈 in a card-based layout
2. WHILE displaying products in card layout, THE Delux+ Platform SHALL show each product's 封面圖, 產品標題, 天數, 供應商名稱, and 淨價
3. WHEN a 台灣旅行社 selects a 目的地 filter, THE Delux+ Platform SHALL display only products matching the selected destination
4. WHEN a 台灣旅行社 selects a 天數 filter, THE Delux+ Platform SHALL display only products matching the selected duration
5. WHEN a 台灣旅行社 applies multiple filters, THE Delux+ Platform SHALL display only products matching all selected filter criteria
6. WHEN no products match the applied filters, THE Delux+ Platform SHALL display a message indicating no products were found

### Requirement 7: Agency Product Details View

**User Story:** As a 台灣旅行社, I want to view complete details of a tour product, so that I can evaluate whether it meets my customers' requirements.

#### Acceptance Criteria

1. WHEN a 台灣旅行社 clicks on a product card, THE Delux+ Platform SHALL navigate to /agency/tours/:id
2. WHEN a 台灣旅行社 navigates to /agency/tours/:id, THE Delux+ Platform SHALL display all product information including 產品標題, 目的地, 天數, 供應商名稱, 淨價, 封面圖, and the complete 產品描述
3. WHILE displaying the 產品描述, THE Delux+ Platform SHALL render all rich text formatting and embedded images as originally created by the supplier
4. WHEN a 台灣旅行社 views a product detail page, THE Delux+ Platform SHALL display the 淨價 in TWD currency format

### Requirement 8: Data Persistence and Integrity

**User Story:** As the Delux+ platform, I need to reliably store and retrieve all user and product data, so that the system maintains data integrity and availability.

#### Acceptance Criteria

1. THE Delux+ Platform SHALL store all user accounts in a PostgreSQL database on Google Cloud SQL
2. THE Delux+ Platform SHALL store all 旅遊產品 data in a PostgreSQL database on Google Cloud SQL
3. WHEN a 封面圖 is uploaded, THE Delux+ Platform SHALL store the image file and maintain a reference to it in the product record
4. THE Delux+ Platform SHALL associate each 旅遊產品 with the 當地供應商 who created it
5. WHEN data is retrieved from the database, THE Delux+ Platform SHALL ensure data consistency and accuracy
