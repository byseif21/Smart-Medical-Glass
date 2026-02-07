FROM python:3.10-slim

# Install system dependencies required for dlib and opencv
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    python3-dev \
    pkg-config \
    libjpeg-dev \
    zlib1g-dev \
    libx11-6 \
    libgl1 \
    libxext6 \
    libsm6 \
    libxrender1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install build tools and Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Make the start script executable
RUN chmod +x scripts/start.sh

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application using the start script
CMD ["./scripts/start.sh"]
