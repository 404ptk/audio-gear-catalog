# Audio Gear Catalog

A web application for browsing and purchasing audio equipment - an online store. University project for Cloud Computing Services Programming (AI2).

![Home page](home_page.png)

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Technologies](#technologies)
- [Installation and Setup](#installation-and-setup)
- [Test Users](#test-users)
- [API Documentation](#api-documentation)
- [Project Documentation](#project-documentation)
- [Screenshots](#screenshots)

## Architecture

The project demonstrates modern web application architecture with clear separation of concerns:

### Backend (FastAPI + SQLAlchemy)
```
backend/
├── app/
│   ├── main.py           # Main application file, CORS configuration, DB initialization
│   ├── models.py         # ORM models (User, GearItem, CartItem)
│   ├── schemas.py        # Pydantic schemas for validation
│   ├── auth.py           # JWT authentication, login/registration
│   ├── db.py             # Database connection configuration
│   ├── docs.py           # Metadata for API documentation
│   └── routes/
│       ├── catalog.py    # Product catalog endpoints
│       ├── cart.py       # Cart management
│       └── admin.py      # Admin panel
└── requirements.txt
```

**Key Backend Features:**
- **REST API** - Full RESTful API with proper HTTP methods and status codes
- **SFWP** - Server-First Web Programming with centralized business logic
- **Database**: SQLite (`app.db`) with automatic data seeding
- **Authorization**: JWT tokens with bcrypt hashed passwords
- **API Documentation**: Interactive OpenAPI/Swagger documentation

### Frontend (React + TypeScript + Vite)
```
frontend/
├── src/
│   ├── main.tsx          # Application entry point
│   ├── App.tsx           # Routing and main catalog view
│   ├── Header.tsx        # Navigation and user info
│   ├── Login.tsx         # Login form
│   ├── Register.tsx      # Registration form
│   ├── ProductDetail.tsx # Product details
│   ├── Cart.tsx          # Cart view
│   ├── AdminPanel.tsx    # Admin panel
│   ├── api.ts            # API communication functions
│   ├── cart.ts           # Cart state management
│   └── images.ts         # Product image mapping
├── attachments/          # Product images
└── package.json
```

**Key Frontend Features:**
- **SPA** - Single Page Application with client-side routing
- **Styling**: Inline CSS with responsive design
- **State Management**: React hooks (useState, useEffect) + localStorage for cart persistence

## Features

### For all users:
- Browse audio equipment catalog with category filtering (microphones, headphones, interfaces)
- Search products by name and brand
- Detailed product information (description, price, rating, availability, image gallery)
- Shopping cart with localStorage persistence
- Responsive design for mobile and desktop

### For logged-in users:
- Registration and login with JWT authorization
- Persistent shopping cart synchronized with backend
- Order checkout (placing orders from cart products)
- Order history viewing
- Profile management

### For administrators:
- Full product CRUD operations (Create, Read, Update, Delete)
- Adding new products with image uploads
- Editing existing products
- Deleting products
- User management (viewing all users, granting admin privileges)
- Deleting user accounts
- Viewing all user orders

![Admin panel](admin_panel.png)

## Technologies

### Backend:
- **FastAPI** 0.115.2 - Modern, fast web framework for building APIs
- **SQLAlchemy** 2.0.36 - ORM for database management
- **Pydantic** - Data validation and settings management
- **Uvicorn** - Lightning-fast ASGI server
- **python-jose** - JWT token handling
- **passlib[bcrypt]** - Secure password hashing
- **SQLite** - Lightweight embedded database

### Frontend:
- **React** 19.3 - Modern UI library with hooks
- **TypeScript** 5.5.4 - Typed superset of JavaScript
- **Vite** 5.4.8 - Next generation frontend tooling
- **Fetch API** - Native HTTP client for API communication

### Documentation:
- **OpenAPI/Swagger** - Interactive API documentation
- **LaTeX** - Comprehensive project documentation (Polish)

## Installation and Setup

### Requirements:
- Python 3.11+
- Node.js 18+ and npm

### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a Python virtual environment:
```bash
python -m venv venv
```

3. Activate the environment:
- **Windows:**
  ```bash
  venv\Scripts\activate
  ```
- **Linux/Mac:**
  ```bash
  source venv/bin/activate
  ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Start the server (run from the **main project directory**, not from backend/):
```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

**Important:** The command must be run from the root directory of the project, not from the `backend/` folder.

Backend will be available at: `http://localhost:8000`

API Documentation (Swagger): `http://localhost:8000/docs`

Alternative API Documentation (ReDoc): `http://localhost:8000/redoc`

### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### Production Build

To build the production version of the frontend:
```bash
cd frontend
npm run build
```

The built application will be in the `frontend/dist` folder and can be served by any static file server.

## Test Users

After the first run, the backend automatically creates an administrator account and several test users:

### Administrator:
- **Username:** `admin`
- **Password:** `admin`

### Test Users:
- **user1** / `password1`
- **user2** / `password2`
- **testuser** / `test123`
- **jankowalski** / `kowalski123`
- **annanowak** / `nowak456`
- **testadmin** / `admin123` (has admin privileges)

## API Documentation

The backend provides interactive API documentation with the ability to test endpoints directly from the browser:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

![API Documentation](swagger.png)

### Authentication in Swagger

To test protected endpoints in Swagger UI:

1. **Option 1 - Using OAuth2 form:**
   - Click the "Authorize" button at the top
   - Enter username and password
   - Click "Authorize"

2. **Option 2 - Using Bearer token:**
   - Login through `/auth/token` endpoint
   - Copy the access token
   - Click "Authorize" and paste: `Bearer <your_token>`

### Main Endpoints:

#### Authentication:
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (returns JWT token)
- `POST /auth/token` - Get JWT token (OAuth2 compatible)
- `GET /auth/me` - Information about logged-in user

#### Catalog:
- `GET /api/catalog/items` - List of all products (with optional filtering)
- `GET /api/catalog/items/{id}` - Product details
- `GET /api/catalog/categories` - List of available categories

#### Cart (requires authentication):
- `GET /api/cart` - Contents of logged-in user's cart
- `POST /api/cart/add` - Add product to cart
- `PATCH /api/cart/update/{item_id}` - Update product quantity
- `DELETE /api/cart/remove/{item_id}` - Remove product from cart
- `DELETE /api/cart` - Clear entire cart
- `POST /api/cart/checkout` - Finalize order

#### Admin (requires administrator privileges):
- `POST /api/admin/items` - Add new product
- `PATCH /api/admin/items/{id}` - Edit product
- `DELETE /api/admin/items/{id}` - Delete product
- `GET /api/admin/users` - List of all users
- `PATCH /api/admin/users/{id}/admin` - Change user privileges
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/orders` - List of all orders

## 📸 Screenshots

### Home page with product catalog
![Home page](home_page.png)
*Browse the full catalog of audio equipment with filtering options*

### Shopping cart
![Cart](cart.png)
*Manage your cart with quantity controls and checkout*

### Admin panel
![Admin panel](admin_panel.png)
*Full admin dashboard for managing products and users*

### API Documentation (Swagger)
![Swagger](swagger.png)
*Interactive API documentation with testing capabilities*

## Database Structure

### Tables:

**users**
- `id` - PRIMARY KEY
- `username` - UNIQUE, indexed
- `hashed_password` - bcrypt hashed
- `is_admin` - BOOLEAN (default: false)
- `created_at` - TIMESTAMP

**gear_items**
- `id` - PRIMARY KEY
- `name` - indexed
- `category` - indexed (microphone, headphones, interface)
- `brand` - indexed
- `price` - FLOAT
- `rating` - FLOAT (0-5)
- `description` - TEXT
- `image_url` - VARCHAR(512)
- `in_stock` - BOOLEAN
- `created_at` - TIMESTAMP

**cart_items**
- `id` - PRIMARY KEY
- `user_id` - FOREIGN KEY → users.id (CASCADE DELETE)
- `gear_item_id` - FOREIGN KEY → gear_items.id (CASCADE DELETE)
- `quantity` - INTEGER
- `is_ordered` - BOOLEAN (default: false)
- `created_at` - TIMESTAMP

## Security

- **Password Security:** Passwords are hashed using bcrypt with automatic salt generation
- **Authentication:** JWT token-based authentication with configurable expiration
- **Authorization:** Role-based access control (admin vs regular users)
- **CORS:** Configured for local development with proper origin restrictions
- **Admin Protection:** Admin endpoints protected with privilege verification middleware
- **Input Validation:** All input data validated through Pydantic schemas
- **SQL Injection Prevention:** SQLAlchemy ORM prevents SQL injection attacks

## Development Notes

### Running Tests
The project includes test users and sample data that are automatically seeded on first run.

### Adding New Products
Use the admin panel or directly through Swagger UI to add new products with proper validation.

### Image Management
Product images are stored in `frontend/attachments/{product_slug}/` with multiple images per product.

## Project Goals (Educational)

This project demonstrates:
1. **REST API Implementation** - Full RESTful API with proper HTTP methods and status codes
2. **SPA Architecture** - Single Page Application with React and client-side routing
3. **SFWP Pattern** - Server-First Web Programming with centralized business logic
4. **Interactive API Documentation** - Swagger/OpenAPI with testing capabilities
5. **Modern Web Stack** - FastAPI + React + TypeScript + SQLAlchemy

## License

Educational project for University of Rzeszów - Cloud Computing Services Programming (AI2) course.
