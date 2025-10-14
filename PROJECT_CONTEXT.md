markdown# Beauty Booking App - Complete Project Context

## 🎯 Project Overview
A beauty booking platform connecting customers with local beauty professionals. Eliminates the inefficiency of Instagram DMs by providing portfolio browsing, instant booking, and review systems.

**Target Users:**
- **Customers:** Primarily women looking for beauty services
- **Vendors:** Beauty professionals (hair stylists, nail artists, makeup artists, estheticians)

**Problem Solved:** 
Current process requires customers to search Instagram, DM vendors, and coordinate times manually. This app streamlines discovery and booking.

---

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLite (development) → PostgreSQL (production)
- **Authentication:** JWT tokens stored in HTTP-only cookies
- **ORM:** SQLAlchemy
- **Password Hashing:** bcrypt via passlib
- **Port:** 8000

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** JavaScript (NOT TypeScript)
- **Styling:** Tailwind CSS v4
- **State Management:** React Context (AuthContext)
- **HTTP Client:** Axios
- **Port:** 3000

### Key Dependencies
**Backend:**
fastapi
uvicorn
python-dotenv
sqlalchemy
psycopg2-binary
python-jose[cryptography]
passlib[bcrypt]
python-multipart
pydantic-settings

**Frontend:**
next@latest
react
axios
js-cookie

---

## 🎨 Design System

### Color Palette (Tailwind v4)
**IMPORTANT:** Uses Tailwind v4 with CSS-based config, NOT `tailwind.config.js`

**Primary (Beige - Warm Neutrals):**
- `primary-50`: #fdfcfb (almost white)
- `primary-100`: #f8f6f3 (main page background)
- `primary-200`: #f0ebe4 (borders)
- `primary-300`: #e8e0d5 (soft beige accents)
- `primary-400`: #d4c5a0 (medium beige)
- `primary-500`: #c4b589
- `primary-600`: #a89668
- `primary-700`: #8c7a52
- `primary-800`: #6b5d3f
- `primary-900`: #4a4029

**Neutral (Black/Gray):**
- `neutral-50` to `neutral-400`: Light grays
- `neutral-500`: #737373 (medium gray)
- `neutral-600`: #525252 (dark gray text)
- `neutral-700`: #404040 (body text)
- `neutral-800`: #262626
- `neutral-900`: #171717 (black - buttons, headings)

**Design Philosophy:**
- Professional, minimal, luxury aesthetic
- Warm beige backgrounds with black accents
- Inspired by: Aesop, The Row, high-end minimalist brands
- No purple/pink (original prototype used purple, removed for neutral theme)

---

## 📁 Project Structure
beauty-booking/
├── backend/
│   ├── app/
│   │   ├── init.py
│   │   ├── main.py              # FastAPI app, CORS, routes
│   │   ├── config.py            # Settings, env vars
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── auth.py              # JWT, password hashing, auth deps
│   │   ├── models/
│   │   │   ├── init.py
│   │   │   ├── user.py          # User model (customer/vendor)
│   │   │   └── vendor.py        # Vendor profile model
│   │   ├── schemas/
│   │   │   ├── user.py          # Pydantic schemas for users
│   │   │   └── vendor.py        # Pydantic schemas for vendors
│   │   └── api/
│   │       ├── auth.py          # /api/auth endpoints
│   │       └── vendors.py       # /api/vendors endpoints
│   ├── requirements.txt
│   ├── .env
│   └── beauty_booking.db        # SQLite (dev only)
├── web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js        # Root layout with AuthProvider
│   │   │   ├── globals.css      # Tailwind v4 config (⚠️ @import style)
│   │   │   ├── page.js          # Landing page
│   │   │   ├── login/page.js
│   │   │   ├── register/page.js
│   │   │   ├── browse/page.js   # Customer: view vendors
│   │   │   ├── vendor/
│   │   │   │   ├── setup/page.js    # Vendor onboarding
│   │   │   │   └── dashboard/page.js # Vendor profile management
│   │   │   └── vendors/
│   │   │       └── [id]/page.js     # Public vendor detail page
│   │   ├── contexts/
│   │   │   └── AuthContext.js   # Auth state & methods
│   │   └── lib/
│   │       └── api.js           # Axios client, API helpers
│   ├── package.json
│   ├── .env.local               # NEXT_PUBLIC_API_URL
│   └── postcss.config.js
└── README.md

---

## 🔐 Authentication Flow

### Registration
1. User chooses account type: Customer or Vendor
2. POST `/api/auth/register` with `{email, password, full_name, phone, user_type}`
3. Backend creates User record
4. If vendor: Also creates empty Vendor profile with `is_active=False`
5. Returns JWT token + user object
6. Frontend stores token in cookie, redirects based on `user_type`:
   - Customer → `/browse`
   - Vendor → `/vendor/setup`

### Login
1. POST `/api/auth/login` with `{email, password}`
2. Backend verifies credentials
3. Returns JWT token + user object
4. Frontend redirects based on `user_type`

### Protected Routes
- `AuthContext` checks for token on mount
- GET `/api/auth/me` validates token and returns user
- If invalid/missing: Redirect to `/login`
- Token sent as `Authorization: Bearer {token}` header

---

## 🗄️ Database Schema

### User Model
```python
- id: Integer (PK)
- email: String (unique, indexed)
- password_hash: String
- full_name: String
- phone: String (optional)
- user_type: Enum('customer', 'vendor')
- avatar_url: String (optional)
- created_at: DateTime
Vendor Model
python- id: Integer (PK)
- user_id: Integer (FK to users.id, unique)
- business_name: String
- bio: String (optional)
- location: String (optional)
- rating: Float (default 0.0)
- is_pro: Boolean (default False)
- is_active: Boolean (default True)
- created_at: DateTime
- user: relationship to User
Note: Vendor profile is inactive (is_active=False) until they complete setup (add bio, location).

🚀 Current Status: Phase 1 Complete ✅
Completed Features

 User registration (Customer/Vendor)
 Login/logout with JWT auth
 Auth context with automatic redirects
 Vendor profile setup flow
 Vendor profile editing
 Vendor dashboard (view/edit profile)
 Customer browse page (list all active vendors)
 Public vendor detail page
 Professional landing page with beige theme
 Responsive design
 CORS configured
 Protected routes

Known Issues & Quirks

Tailwind v4: Uses @import "tailwindcss" in globals.css with @theme block for colors

DO NOT create tailwind.config.js - will break the app
Color config lives in CSS, not JS


localStorage: NOT supported in Claude artifacts (use React state instead)
Hydration Warning: Browser extensions add attributes - suppressed with suppressHydrationWarning


📋 Phase 2 - Next Steps (Not Started)
Portfolio Upload

 Image upload component (vendor dashboard)
 Cloud storage integration (Cloudinary/AWS S3)
 Gallery view on vendor detail page
 Image reordering (drag & drop)
 Delete images

Services Management

 Add/edit/delete services
 Service name, price, duration
 Display services on vendor page

Availability System

 Set weekly opening hours
 Block specific dates/times
 Calculate available time slots
 Display availability calendar

Booking System

 Select service, date, time
 Create booking record
 Confirmation emails
 View upcoming bookings (customer & vendor)
 Cancel/reschedule bookings

Reviews

 Leave review after appointment
 Star rating + text
 Display reviews on vendor page
 Calculate average rating


🎯 Phase 3 - PRO Features ($5/month)
Vendor Subscription

 Stripe integration
 PRO badge on profile
 Booking deposit collection
 Higher search placement
 Unlimited portfolio images
 Analytics dashboard


🔧 Development Commands
Backend
bashcd backend
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows
uvicorn app.main:app --reload --port 8000
API Docs: http://localhost:8000/docs
Frontend
bashcd web
npm run dev
App: http://localhost:3000
Reset Database
bashcd backend
rm beauty_booking.db
# Restart backend (tables recreate automatically)
Clear Next.js Cache
bashcd web
rm -rf .next
rm -rf node_modules/.cache
npm run dev

🚨 Critical Reminders

Tailwind v4: Colors defined in globals.css with @theme directive
No tailwind.config.js: Delete it if it exists
CORS: Backend allows http://localhost:3000
Token Storage: HTTP-only cookies via js-cookie
User Types: Always check user.user_type for routing logic
Vendor Active State: Only show vendors where is_active=True on browse page
bcrypt Issue: Use passlib==1.7.4 and bcrypt==4.0.1 for compatibility


📝 Design Decisions Log
Color Palette
Decision: Warm beige/neutral instead of purple/pink
Reason: More professional, luxury aesthetic for beauty industry
Date: Phase 1
Tailwind Version
Decision: Stick with Tailwind v4 (CSS config)
Reason: Already installed, works well, modern approach
Date: Phase 1
Separate User Types
Decision: Single User table with user_type enum, separate Vendor table
Reason: Cleaner than multiple user tables, allows future user types
Date: Phase 1
JWT in Cookies
Decision: Store JWT in cookies, not localStorage
Reason: More secure, works in artifacts, better for SSR
Date: Phase 1

🤝 Working with Claude
In New Conversations, Say:

"Continue working on Beauty Booking - check project files"
"Reference our previous work on [feature]"
"What did we decide about [topic]?"

I Will Automatically:

Read all uploaded project files
Search past conversations in this project
Maintain context about architecture and decisions


📸 Current UI Screenshots
(Upload screenshots of landing page, dashboard, browse page here)

Last Updated: January 2025
Project Status: Phase 1 Complete, Ready for Phase 2
Next Milestone: Portfolio Upload System

---

**Now save this as `PROJECT_CONTEXT.md` and upload it to your Claude project!** 

This gives me everything I need to remember your project in future conversations. 🎯RetryClaude can make mistakes. Please double-check responses.Bbeum Sonnet 4.5