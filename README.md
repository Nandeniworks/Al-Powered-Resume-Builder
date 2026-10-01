
# ResumeCraft

An AI-powered resume builder that helps users create, customize, improve, share, and download professional resumes through a full-stack web application.

ResumeCraft combines a React frontend with a Node.js and Express backend, MongoDB for data storage, Firebase Authentication, Gemini AI for resume assistance, and PDF generation for downloadable resumes.

## Live Application

Frontend: https://al-powered-resume-builder.vercel.app

Backend API: https://al-powered-resume-builder.onrender.com

## GitHub Repository

https://github.com/Nandeniworks/Al-Powered-Resume-Builder

---

## Overview

ResumeCraft is a full-stack resume management platform designed to simplify the process of creating and maintaining professional resumes.

Users can:

- Register and log in securely
- Create and manage multiple resumes
- Edit resume sections
- Select resume templates
- Improve resume content using AI
- Tailor resumes according to a target job description
- Generate professional PDF resumes
- Share resumes through public links
- Track resume views and downloads
- View personal analytics

Administrators can:

- Manage resume templates
- View platform-level analytics
- Access protected administrative functionality

The application uses JWT-based authorization for backend API protection and Firebase for user authentication.

---

## Key Features

### User Authentication

- User registration and login
- Firebase Authentication integration
- JWT-based backend authentication
- Protected API routes
- Role-based authorization
- User and administrator roles

### Resume Management

Users can create and manage resumes with sections including:

- Personal Information
- Professional Title
- Contact Information
- Professional Summary
- Education
- Work Experience
- Skills
- Projects
- Certifications
- Achievements
- Languages
- Interests
- LinkedIn
- GitHub
- Portfolio

Resume operations include:

- Create
- Read
- Update
- Delete

### AI Resume Assistance

Gemini AI is integrated to help users improve their resume content.

AI assistance is available for areas such as:

- Professional Summary
- Experience Descriptions
- Project Descriptions
- Skills
- Achievements

The user can review the AI-generated suggestion before accepting it.

### AI Resume Tailoring

Users can provide a target job description and generate a tailored version of an existing resume.

The original resume remains preserved while the tailored version is created separately.

This allows users to customize resumes for different job opportunities without modifying their original resume.

### Resume Templates

ResumeCraft provides multiple resume templates with different visual styles.

Current templates include:

- Modern
- Creative Designer Pro

Templates can be managed by administrators through protected administrative routes.

### PDF Generation

Users can generate and download their resumes as PDF files.

The PDF system supports:

- Professional resume formatting
- Multi-page resumes
- Structured sections
- Clickable contact links
- Professional template styling
- Creative template styling

### Resume Sharing

Users can generate a public sharing link for their resume.

Anyone with the public link can view the shared resume without requiring authentication.

### Analytics

ResumeCraft tracks resume activity through MongoDB.

Analytics include:

- Resume views
- Resume downloads

View and download counters are automatically incremented when the corresponding actions occur.

### Admin Analytics

Administrators can access platform-level analytics through protected routes.

Normal users cannot access administrator analytics.

### Admin Template Management

Administrators can:

- View templates
- Create templates
- Update templates

Administrative operations are protected using role-based authorization.

### Notifications

Firebase Cloud Messaging is integrated through Firebase Admin SDK for notification functionality.

The notification API validates requests and communicates with Firebase Cloud Messaging.

### Socket.io

Socket.io is initialized on the backend to support real-time communication capabilities.

---

## Technology Stack

### Frontend

- React.js
- Vite
- React Router
- CSS

### Backend

- Node.js
- Express.js
- Mongoose
- JWT
- Socket.io

### Database

- MongoDB
- MongoDB Atlas

### Authentication

- Firebase Authentication
- Firebase Admin SDK
- JSON Web Tokens

### Artificial Intelligence

- Google Gemini API
- Gemini 2.5 Flash

### PDF

- PDFKit

### Deployment

- Vercel for frontend
- Render for backend
- MongoDB Atlas for database

---

## System Architecture

```text
                         ResumeCraft
                              |
             +----------------+----------------+
             |                                 |
        React Frontend                    Express Backend
          (Vercel)                           (Render)
             |                                 |
             |                         +-------+-------+
             |                         |               |
             |                    MongoDB Atlas    Firebase
             |                         |               |
             |                         |        Authentication
             |                         |
             |                    Resume Data
             |                    User Data
             |                    Templates
             |                    Analytics
             |
             +----------------------+
                                    |
                              Gemini API
                                    |
                           AI Resume Assistance
```

---

## Project Structure

```text
AI-Powered-Resume-Builder/
│
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   ├── firebase.js
│   │   └── firebase-service-account.json
│   │
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── aiController.js
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── notificationController.js
│   │   ├── resumeController.js
│   │   ├── shareController.js
│   │   └── templateController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   └── validationMiddleware.js
│   │
│   ├── models/
│   │   ├── AISuggestion.js
│   │   ├── Analytics.js
│   │   ├── Resume.js
│   │   ├── Tailor.js
│   │   ├── Template.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── analyticsRoutes.js
│   │   ├── authRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── resumeRoutes.js
│   │   ├── shareRoutes.js
│   │   └── templateRoutes.js
│   │
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── App.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## API Endpoints

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Resumes

```text
GET    /api/resumes
GET    /api/resumes/:id
POST   /api/resumes
PUT    /api/resumes/:id
DELETE /api/resumes/:id
GET    /api/resumes/:id/pdf
```

### Templates

```text
GET  /api/templates
GET  /api/templates/:id
POST /api/templates
PUT  /api/templates/:id
```

### AI Suggestions

```text
POST /api/ai/suggestions
GET  /api/ai/suggestions
```

### AI Resume Tailoring

```text
POST /api/ai/tailor
GET  /api/ai/tailor
```

### Sharing

```text
POST /api/share
GET  /api/share/:id
```

### Analytics

```text
GET /api/analytics/views
GET /api/analytics/downloads
```

### Admin

```text
GET /api/admin/templates
GET /api/admin/analytics
```

### Notifications

```text
POST /api/notifications/send
```

---

## Authentication Flow

```text
User
 |
 | Register / Login
 v
Firebase Authentication
 |
 | Firebase UID
 v
MongoDB User Collection
 |
 | JWT
 v
Protected Express APIs
 |
 +---- User Routes
 |
 +---- Resume Routes
 |
 +---- AI Routes
 |
 +---- Analytics Routes
 |
 +---- Admin Routes
```

Firebase handles user authentication while the backend uses JWT tokens to protect API resources.

Role-based middleware ensures that administrative operations are accessible only to users with the appropriate role.

---

## Analytics Flow

### Resume Views

```text
User opens public resume
        |
        v
GET /api/share/:id
        |
        v
Shared resume retrieved
        |
        v
Analytics.views += 1
        |
        v
Resume returned
```

### Resume Downloads

```text
User requests PDF
        |
        v
GET /api/resumes/:id/pdf
        |
        v
Resume ownership verified
        |
        v
Analytics.downloads += 1
        |
        v
PDF generated
```

---

## AI Workflow

```text
Resume Content
      |
      v
User selects "Improve with AI"
      |
      v
Gemini API
      |
      v
AI Generated Suggestion
      |
      v
User Reviews Suggestion
      |
      +--------+
      |        |
      v        v
Accept     Keep Original
```

For resume tailoring:

```text
Existing Resume
      +
Target Job Description
      |
      v
Gemini AI
      |
      v
Tailored Resume
      |
      v
New Resume Record
```

The original resume is preserved.

---

## Database Collections

MongoDB is used to store application data.

Main collections include:

```text
users
resumes
templates
aisuggestions
tailors
analytics
shares
```

The exact collection names are managed through the Mongoose models and MongoDB configuration.

---

## Environment Variables

Create a `.env` file inside the `backend` directory.

Example:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FIREBASE_API_KEY=your_firebase_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Firebase Admin also requires the Firebase service-account configuration.

Never commit:

```text
.env
firebase-service-account.json
```

to GitHub.

These files are included in `.gitignore`.

---

## Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/Nandeniworks/Al-Powered-Resume-Builder.git
cd Al-Powered-Resume-Builder
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment variables

Create:

```text
backend/.env
```

and add the required environment variables.

### 4. Start the backend

```bash
node server.js
```

The backend will run locally using the configured port.

### 5. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

### 6. Start the frontend

```bash
npm run dev
```

The Vite development server will provide the local frontend URL.

---

## Deployment

### Frontend

The React/Vite frontend is deployed using Vercel.

```text
Frontend
   |
   v
Vercel
```

### Backend

The Node.js/Express backend is deployed using Render.

```text
Backend
   |
   v
Render
```

### Database

MongoDB Atlas provides the cloud database.

```text
Express API
     |
     v
MongoDB Atlas
```

---

## Security

ResumeCraft uses multiple layers of application security:

- Firebase Authentication
- JWT authentication
- Protected API routes
- Role-based authorization
- Request validation
- MongoDB access through Mongoose
- Environment variables for secrets
- Git ignore rules for sensitive files

Sensitive credentials should never be committed to the repository.

---

## Project Highlights

ResumeCraft demonstrates a complete full-stack application workflow:

```text
React
  |
  v
Express.js
  |
  v
MongoDB
```

with additional integrations:

```text
Firebase Authentication
        |
        v
      JWT
        |
        v
Protected APIs

Gemini API
    |
    v
AI Resume Assistance

PDFKit
    |
    v
Resume PDF Generation

Firebase Cloud Messaging
    |
    v
Notifications

Socket.io
    |
    v
Real-Time Communication Support
```

---

## Future Improvements

Possible future extensions include:

- Interview preparation tips API
- Additional resume templates
- Resume version history
- More detailed analytics
- Job-specific resume recommendations
- Additional notification workflows
- More real-time collaboration features
- Additional export formats

---

## Project Status

ResumeCraft is a deployed full-stack AI-powered resume builder with:

- React frontend
- Node.js and Express backend
- MongoDB Atlas database
- Firebase authentication
- JWT authorization
- Gemini AI integration
- Resume CRUD operations
- Resume tailoring
- PDF generation
- Public resume sharing
- View and download analytics
- Admin template management
- Admin analytics
- Firebase notification integration
- Socket.io initialization
- Vercel deployment
- Render deployment

---

## Author

### Nandeni Tiwari

B.Tech Computer Science and Engineering

GitHub: https://github.com/Nandeniworks

---

## License

This project was developed as an academic project and demonstration of full-stack web development concepts.
```
