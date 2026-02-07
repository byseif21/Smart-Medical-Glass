<div align="center">
  <img src="frontend/public/MedLens_w.png" alt="MedLens Logo" width="1000" />
</div>


## Project Overview

MedLens is a medical-focused smart glasses system designed to assist healthcare professionals and patients by recognizing people's faces and retrieving relevant medical information in real-time. The system demonstrates face recognition technology through an intuitive web interface, enabling secure access to patient data, medical history, and emergency contacts.

## Features

- **Medical Identity Recognition**: Instantly identify patients and medical personnel from face images
- **Patient Profile Management**: Securely manage medical history, emergency contacts, and personal data
- **Real-time Processing**: Fast face detection and matching for immediate information retrieval
- **Secure Access Control**: Role-based access (Doctors, Patients, Admins) ensuring data privacy
- **Intuitive Dashboard**: React-based interface for managing connections and medical records

## Technology Stack

- **Frontend**: React (Vite) with modern UI components
- **Backend**: Python FastAPI with face recognition capabilities
- **Database**: Supabase (PostgreSQL) for data persistence and image storage
- **AI/ML**: OpenCV and face_recognition library for facial analysis

## Folder Structure

```
MedLens/
├── frontend/          # React web application
├── backend/           # Python FastAPI server with face recognition
├── database/          # Supabase configuration and setup
└── README.md          # This file
```

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v18 or higher) and npm/yarn
- **Python** (v3.9 or higher) and pip
- **Git** for version control
- **Supabase Account** for database and storage services

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MedLens
```

### 2. Database Setup

Navigate to the `database/` folder and follow the instructions in its README.md to:
- Create a Supabase project
- Configure environment variables
- Set up database tables

```bash
cd database
# See database/README.md for detailed setup instructions
```

> **Detailed Instructions:** [database/README.md](./database/README.md)

### 3. Backend Setup

Navigate to the `backend/` folder and follow the instructions in its README.md to:
- Install Python dependencies
- Configure environment variables
- Start the FastAPI server

```bash
cd backend
# See backend/README.md for detailed setup instructions
```

> **Detailed Instructions:** [backend/README.md](./backend/README.md)

### 4. Frontend Setup

Navigate to the `frontend/` folder and follow the instructions in its README.md to:
- Install Node.js dependencies
- Configure environment variables
- Start the development server

```bash
cd frontend
# See frontend/README.md for detailed setup instructions
```

> **Detailed Instructions:** [frontend/README.md](./frontend/README.md)

## Quick Start

After completing the setup for all components:

1. Start the backend server (runs on http://localhost:8000)
2. Start the frontend application (runs on http://localhost:3000 or http://localhost:5173)
3. Open your browser and navigate to the frontend URL
4. Register a new user with a face image
5. Test recognition by uploading another image

## Project Architecture

The system follows a three-tier architecture:

1. **Frontend Layer**: React-based web interface for user interactions
2. **Backend Layer**: FastAPI server with face recognition engine and local JSON caching
3. **Data Layer**: Supabase for persistent storage of user data, face encodings, and images

## API Endpoints

- `POST /api/register` - Register a new user with face image
- `POST /api/recognize` - Recognize a face from uploaded image
- `GET /api/health` - Check system health status

## Development Workflow

1. Make changes to the relevant component (frontend/backend/database)
2. Test locally using the development servers
3. Ensure all tests pass before committing
4. Follow the contribution guidelines for pull requests

## Troubleshooting

- **Face not detected**: Ensure the image has good lighting and a clear frontal face
- **Multiple faces detected**: Upload an image with only one person
- **Connection errors**: Verify Supabase credentials and network connectivity
- **Dependencies issues**: Check that all prerequisites are installed correctly

## Documentation

For detailed information about each component, refer to the README.md files in their respective folders:

- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)
- [Database Documentation](./database/README.md)

## Support

For issues or questions, please refer to the component-specific README files or create an issue in the repository.
