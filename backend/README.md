# Backend - Smart Glass AI

## Overview

The backend component is a Python FastAPI server that provides face recognition capabilities through RESTful API endpoints. It uses OpenCV and the face_recognition library to extract facial features, compare them against stored encodings, and manage user data through Supabase integration.

## Contents

This folder contains:

- **main.py**: FastAPI application initialization and configuration
- **routers/**: API endpoint definitions (registration, recognition)
- **services/**: Business logic (face recognition, Supabase integration)
- **models/**: Pydantic data models for request/response validation
- **utils/**: Helper functions (image processing, configuration)
- **data/**: Local JSON storage for face encodings cache
- **requirements.txt**: Python dependencies

## Technology Stack

- **FastAPI**: Modern web framework for building APIs
- **OpenCV (cv2)**: Image processing and manipulation
- **face_recognition**: Face detection and encoding extraction (dlib-based)
- **Supabase**: Database and storage client
- **python-multipart**: File upload handling
- **python-dotenv**: Environment variable management

## Prerequisites

- Python 3.9 or higher
- pip (Python package manager)
- cmake (required for dlib installation)
- Visual Studio Build Tools (Windows) or build-essential (Linux)

### Installing System Dependencies

**Windows:**
```bash
# Install Visual Studio Build Tools from:
# https://visualstudio.microsoft.com/visual-cpp-build-tools/

# Install cmake
pip install cmake
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install build-essential cmake python3-dev
```

**macOS:**
```bash
brew install cmake
```

## Setup Instructions

### 1. Create Virtual Environment

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

**Note**: Installing `dlib` (required by face_recognition) may take several minutes as it compiles from source.

### 3. Configure Environment Variables

Create a `.env` file in the backend folder:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
FACE_RECOGNITION_TOLERANCE=0.6
MAX_IMAGE_SIZE_MB=5
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. Create Data Directory

```bash
mkdir -p data
```

### 5. Start the Server

```bash
# Development mode with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### POST /api/register

Register a new user with face image and personal information.

**Request:**
- Content-Type: multipart/form-data
- Fields:
  - `image`: File (JPEG/PNG)
  - `name`: string
  - `email`: string
  - `phone`: string (optional)

**Response:**
```json
{
  "success": true,
  "user_id": "uuid-string",
  "message": "User registered successfully"
}
```

### POST /api/recognize

Recognize a face from uploaded image.

**Request:**
- Content-Type: multipart/form-data
- Fields:
  - `image`: File (JPEG/PNG)

**Response (Match Found):**
```json
{
  "recognized": true,
  "user": {
    "id": "uuid-string",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "registered_at": "2025-11-13T10:30:00Z"
  },
  "confidence": 0.85
}
```

**Response (No Match):**
```json
{
  "recognized": false,
  "message": "No matching face found"
}
```

### GET /api/health

Check system health and service status.

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "face_recognition": "operational",
    "supabase": "connected"
  }
}
```

## Project Structure

```
backend/
├── main.py                 # FastAPI app initialization
├── routers/
│   ├── __init__.py
│   ├── registration.py     # Registration endpoint
│   └── recognition.py      # Recognition endpoint
├── services/
│   ├── __init__.py
│   ├── face_service.py     # Face recognition logic
│   └── storage_service.py  # Supabase integration
├── models/
│   ├── __init__.py
│   ├── user.py            # User data models
│   └── face_encoding.py   # Face encoding models
├── utils/
│   ├── __init__.py
│   ├── image_processor.py # Image preprocessing
│   └── config.py          # Configuration management
├── data/
│   └── encodings.json     # Local face encodings cache
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
└── README.md             # This file
```

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html
```

### Code Formatting

```bash
# Install formatting tools
pip install black isort

# Format code
black .
isort .
```

## Troubleshooting

### dlib Installation Issues

If you encounter errors installing dlib:

1. Ensure cmake is installed: `cmake --version`
2. Install Visual Studio Build Tools (Windows) or build-essential (Linux)
3. Try installing dlib separately: `pip install dlib`
4. If still failing, install pre-built wheel from: https://github.com/z-mahmud22/Dlib_Windows_Python3.x

### Face Recognition Not Working

- Ensure images have good lighting and clear frontal faces
- Check that face_recognition library is properly installed
- Verify image format is JPEG or PNG
- Try with different images

### Supabase Connection Errors

- Verify SUPABASE_URL and SUPABASE_KEY in .env file
- Check network connectivity
- Ensure Supabase project is active
- Verify API keys have correct permissions

### CORS Errors

- Add frontend URL to CORS_ORIGINS in .env file
- Restart the server after changing environment variables

## Performance Optimization

- Images are automatically resized to 800x800px before processing
- Face encodings are cached locally in JSON for faster recognition
- Async operations are used for I/O-bound tasks
- Connection pooling is implemented for Supabase client

## Security Considerations

- Never commit .env files to version control
- Use environment variables for sensitive data
- Implement rate limiting in production
- Validate and sanitize all user inputs
- Restrict file upload sizes and types

## Deployment

For production deployment:

1. Set environment variables in your hosting platform
2. Use a production ASGI server (uvicorn with workers)
3. Enable HTTPS
4. Configure proper CORS origins
5. Set up monitoring and logging
6. Implement rate limiting and authentication

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [face_recognition Library](https://github.com/ageitgey/face_recognition)
- [OpenCV Documentation](https://docs.opencv.org/)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)
