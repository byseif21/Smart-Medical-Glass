# Backend Installation Guide

## Prerequisites

### 1. Python 3.8+
Ensure you have Python 3.8 or higher installed.

### 2. CMake (Required for face_recognition)
The `dlib` library (required by `face_recognition`) needs CMake to build.

#### Windows Installation:
1. Download CMake from [cmake.org](https://cmake.org/download/)
2. Run the installer
3. **Important**: During installation, select "Add CMake to system PATH"
4. Verify installation by opening a new terminal and running:
   ```cmd
   cmake --version
   ```

#### Linux Installation:
```bash
# Ubuntu/Debian
sudo apt install cmake

# RedHat/CentOS
sudo yum install cmake
```

#### macOS Installation:
```bash
brew install cmake
```

### 3. Visual Studio Build Tools (Windows Only)
For Windows users, you also need Visual Studio Build Tools:
1. Download from [Visual Studio Downloads](https://visualstudio.microsoft.com/downloads/)
2. Install "Desktop development with C++" workload

## Installation Steps

### 1. Create Virtual Environment (Recommended)
```bash
cd Smart-Medical-Glass/backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
```

### 2. Install Dependencies

#### Option A: Install All Dependencies (Recommended)
```bash
pip install -r requirements.txt
```

#### Option B: Install Without face_recognition (For Testing)
If you encounter issues with dlib/face_recognition, you can install other dependencies first:
```bash
pip install fastapi uvicorn[standard] python-multipart opencv-python Pillow supabase python-dotenv numpy pydantic
```

Then install face_recognition separately after setting up CMake:
```bash
pip install dlib face-recognition
```

### 3. Verify Installation
Run the test script to verify the installation:
```bash
python test_implementation.py
```

## Troubleshooting

### CMake Not Found Error
If you get "CMake is not installed" error:
1. Ensure CMake is installed from cmake.org (not via pip)
2. Verify it's in your PATH: `cmake --version`
3. Restart your terminal/IDE after installation
4. On Windows, you may need to restart your computer

### dlib Build Fails on Windows
If dlib fails to build:
1. Install Visual Studio Build Tools with C++ support
2. Ensure CMake is properly installed and in PATH
3. Try using a pre-built wheel (if available for your Python version)

### Alternative: Use Docker
If you continue to have issues, consider using Docker:
```bash
# From project root
docker build -t smart-glass-backend ./backend
docker run -p 8000:8000 smart-glass-backend
```

## Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration:
   - Supabase credentials
   - Face recognition settings
   - CORS origins

## Running the Server

```bash
# Development mode
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Verification

Once the server is running, visit:
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health (if implemented)

## Notes

- The `data/` directory will be created automatically for storing face encodings
- Ensure proper file permissions for the `data/` directory
- For production deployment, consider using a proper database instead of JSON storage
