# VolunteerHub Docker Quick Start

## 🚀 Production (One Command)

```bash
docker-compose up -d --build
```

Access: http://localhost:8080  
Admin: `admin@volunteerhub.org` / `Admin123!`

## 🔧 Development (One Command)

```bash
docker-compose -f docker-compose.dev.yml up --build
```

Access: http://localhost:5173 (hot reload enabled)

## 📋 Common Commands

```bash
# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Restart
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build

# Execute command in container
docker-compose exec volunteerhub sh
```

## 📁 Files Created

- `Dockerfile` - Production multi-stage build
- `Dockerfile.dev` - Development environment
- `docker-compose.yml` - Production orchestration
- `docker-compose.dev.yml` - Development orchestration
- `nginx.conf` - Web server with security headers
- `.dockerignore` - Build optimization
- `DOCKER.md` - Complete documentation

## 🔒 Security Features

- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Content-Security-Policy configured
- Server tokens hidden
- Health checks enabled

## 📊 Container Info

- **Base Image**: nginx:alpine (production), node:20-alpine (dev)
- **Size**: ~25MB (production), ~200MB (development)
- **Port**: 8080 (production), 5173 (development)
- **Health Check**: Every 30s on `/health` endpoint

## 🆘 Troubleshooting

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

For detailed information, see `DOCKER.md`
