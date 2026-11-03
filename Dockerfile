# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/frontend/package*.json ./
RUN npm install
COPY frontend/frontend/ ./
RUN npm run build

# Stage 2: Python Flask Backend
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PORT=5000

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY --from=frontend-builder /app/frontend/dist /app/frontend/frontend/dist

EXPOSE 5000

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT} app:app"]
