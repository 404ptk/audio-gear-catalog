# Extended API metadata for Swagger UI
API_METADATA = {
    "title": "Audio Gear Catalog API",
    "description": """
## 🎵 Audio Gear Catalog - Professional Audio Equipment Store API

This REST API provides comprehensive management for an online audio equipment catalog.

### Features

* **🔍 Advanced Search & Filtering** - Search by name, filter by category, sort by multiple criteria
* **📄 Pagination** - Efficient data retrieval with customizable page sizes
* **🔐 JWT Authentication** - Secure user authentication with token-based authorization
* **👥 User Management** - Registration, login, and profile management
* **🛡️ Role-Based Access Control** - Admin-only endpoints for catalog management
* **📊 Complete CRUD Operations** - Full Create, Read, Update, Delete for gear items

### Categories

* **Microphones** - Studio, dynamic, condenser microphones
* **Headphones** - Studio monitoring and professional headphones
* **Audio Interfaces** - USB/Thunderbolt audio interfaces

### Authentication

Most endpoints are public (read-only). Administrative operations require authentication:
1. Register via `/auth/register` or use default admin account
2. Login via `/auth/token` to obtain JWT token
3. Use the **Authorize** button (🔒) and enter: `Bearer YOUR_TOKEN`

**Default Admin Account:**
- Username: `admin`
- Password: `admin`

### Demo Data

The API is pre-seeded with 14 professional audio gear items for testing purposes.
    """,
    "version": "1.0.0",
    "contact": {
        "name": "Audio Gear Catalog Team",
        "email": "support@audiogear.example.com",
    },
    "license_info": {
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
}

OPENAPI_TAGS = [
    {
        "name": "General",
        "description": "General API information and health checks",
    },
    {
        "name": "Catalog",
        "description": "Public endpoints for browsing audio gear catalog. **No authentication required.**",
    },
    {
        "name": "Authentication",
        "description": "User registration and login endpoints. Returns JWT tokens for authenticated requests.",
    },
    {
        "name": "User",
        "description": "User profile management. **Requires authentication.**",
    },
    {
        "name": "Admin",
        "description": "Administrative operations for catalog management. **Requires admin privileges.** 🔒",
    },
]
