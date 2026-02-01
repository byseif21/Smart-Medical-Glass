# Final dlib installation script

# Activate venv
& .\venv\Scripts\Activate.ps1

# Add CMake to PATH for this session
$env:PATH = "C:\Program Files\CMake\bin;$env:PATH"

# Verify cmake
Write-Host "Checking CMake..." -ForegroundColor Green
cmake --version

# Install dlib
Write-Host "`nInstalling dlib..." -ForegroundColor Green
pip install dlib

# Install face-recognition
Write-Host "`nInstalling face-recognition..." -ForegroundColor Green
pip install face-recognition==1.3.0

Write-Host "`nDone! Run: python main.py" -ForegroundColor Cyan
