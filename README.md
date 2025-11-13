# Smart Glass AI

## Project Overview

Smart Glass AI is a prototype system that simulates smart glasses capable of recognizing people's faces and displaying their information in real-time. The system demonstrates face recognition technology through an intuitive web interface, allowing users to register faces with personal information and test recognition capabilities.

## Features

- **Face Registration**: Register users with facial images and personal information
- **Face Recognition**: Identify registered individuals from uploaded images
- **Real-time Processing**: Fast face detection and matching using AI-powered algorithms
- **User-Friendly Interface**: Intuitive React-based web application
- **Secure Data Storage**: Supabase integration for reliable data persistence

## Technology Stack

- **Frontend**: React/Next.js with modern UI components
- **Backend**: Python FastAPI with face recognition capabilities
- **Database**: Supabase (PostgreSQL) for data persistence and image storage
- **AI/ML**: OpenCV and face_recognition library for facial analysis

## Folder Structure

```
Smart-Glass-AI/
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
cd Smart-Glass-AI
```

### 2. Database Setup

Navigate to the `database/` folder and follow the instructions in its README.md to:
- Create a Supabase project
- Configure environment variables
- Set up database tables

```bash
cd database
# Follow instructions in database/README.md
```

### 3. Backend Setup

Navigate to the `backend/` folder and follow the instructions in its README.md to:
- Install Python dependencies
- Configure environment variables
- Start the FastAPI server

```bash
cd backend
# Follow instructions in backend/README.md
```

### 4. Frontend Setup

Navigate to the `frontend/` folder and follow the instructions in its README.md to:
- Install Node.js dependencies
- Configure environment variables
- Start the development server

```bash
cd frontend
# Follow instructions in frontend/README.md
```

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

## License

This is a prototype project for demonstration purposes.

## Support

For issues or questions, please refer to the component-specific README files or create an issue in the repository.
