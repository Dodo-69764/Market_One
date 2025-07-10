# ./Dockerfile
FROM python:3.12-slim

# Set Python path to include /app and /src
ENV PYTHONPATH="${PYTHONPATH}:/app:/app/src"

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ALL files (except .dockerignore)
COPY . .

CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000"]