# Docker Deployment Guide

This guide covers how to deploy VolunteerHub using Docker containers.

## 📦 What's Included

- **Dockerfile** - Multi-stage production build
- **Dockerfile.dev** - Development environment
- **docker-compose.yml** - Production orchestration
- **docker-compose.dev.yml** - Development orchestration
- **nginx.conf** - Optimized Nginx configuration with security headers

## 🚀 Quick Start

### Production Deployment

1. **Build and start the container:**
   ```bash
   docker-compose up -d --build
   ```

2. **Access the application:**
   - Open http://localhost:8080 in your browser
   - Default admin credentials: `admin@volunteerhub.org` / `Admin123!`

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Stop the container:**
   ```bash
   docker-compose down
   ```

### Development Environment

1. **Start development server:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Access the dev server:**
   - Open http://localhost:5173
   - Hot reload is enabled

3. **Stop development server:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

## 🔧 Configuration

### Environment Variables

You can customize the deployment by creating a `.env` file:

```env
# Application
NODE_ENV=production
PORT=80

# SMTP Configuration (for email functionality)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Application Settings
APP_NAME=VolunteerHub
APP_URL=http://localhost:8080
```

### Custom Port Mapping

To run on a different port, modify `docker-compose.yml`:

```yaml
ports:
  - "3000:80"  # Maps host port 3000 to container port 80
```

Then access at http://localhost:3000

## 🏗️ Build Options

### Build Without Cache

```bash
docker-compose build --no-cache
```

### Rebuild Specific Service

```bash
docker-compose build volunteerhub
```

### View Build Logs

```bash
docker-compose build --progress=plain
```

## 📊 Container Management

### List Running Containers

```bash
docker-compose ps
```

### Restart Container

```bash
docker-compose restart
```

### Execute Commands in Container

```bash
# Access shell
docker-compose exec volunteerhub sh

# Run npm commands
docker-compose exec volunteerhub npm run build
```

### View Resource Usage

```bash
docker stats volunteerhub-app
```

## 🔒 Security Features

The Nginx configuration includes:

- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: XSS filter
- **Content-Security-Policy**: Controls resource loading
- **Referrer-Policy**: Controls referrer information
- **Server Tokens Off**: Hides Nginx version

## 📈 Health Checks

The container includes automatic health checks:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' volunteerhub-app

# View health check logs
docker inspect --format='{{json .State.Health}}' volunteerhub-app | jq
```

Health endpoint: http://localhost:8080/health

## 🔄 Updating the Application

1. **Pull latest code:**
   ```bash
   git pull origin main
   ```

2. **Rebuild and restart:**
   ```bash
   docker-compose up -d --build
   ```

3. **Clean up old images:**
   ```bash
   docker image prune -f
   ```

## 💾 Data Persistence

Currently, the application uses browser localStorage for data storage. For production deployments with persistent storage, consider:

### Option 1: Mount Volume for LocalStorage Backup

```yaml
services:
  volunteerhub:
    volumes:
      - ./data:/app/data
```

### Option 2: Add Database Service

Create a `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  volunteerhub:
    build: .
    ports:
      - "8080:80"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/volunteerhub
    depends_on:
      - db
  
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=volunteerhub
      - POSTGRES_PASSWORD=your-secure-password
      - POSTGRES_DB=volunteerhub
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## 🌐 Reverse Proxy Setup

### Using Nginx as Reverse Proxy

Create `nginx-proxy.conf`:

```nginx
server {
    listen 80;
    server_name volunteer.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Using Caddy (Automatic HTTPS)

```yaml
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config

volumes:
  caddy_data:
  caddy_config:
```

`Caddyfile`:
```
volunteer.yourdomain.com {
    reverse_proxy volunteerhub:80
}
```

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs

# Check container status
docker-compose ps

# Remove and recreate
docker-compose down
docker-compose up -d --build
```

### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080

# Or change port in docker-compose.yml
ports:
  - "3000:80"
```

### Build Fails

```bash
# Clear Docker cache
docker system prune -a

# Rebuild
docker-compose build --no-cache
```

### Can't Access Application

1. Check container is running: `docker-compose ps`
2. Check logs for errors: `docker-compose logs`
3. Verify port mapping: `docker port volunteerhub-app`
4. Test health endpoint: `curl http://localhost:8080/health`

## 📊 Monitoring

### View Container Stats

```bash
docker stats volunteerhub-app
```

### Access Logs

```bash
# Application logs
docker-compose logs -f volunteerhub

# Nginx access logs
docker-compose exec volunteerhub tail -f /var/log/nginx/access.log

# Nginx error logs
docker-compose exec volunteerhub tail -f /var/log/nginx/error.log
```

## 🚢 Production Deployment

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml volunteerhub

# List services
docker stack services volunteerhub

# Remove stack
docker stack rm volunteerhub
```

### Using Kubernetes

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: volunteerhub
spec:
  replicas: 3
  selector:
    matchLabels:
      app: volunteerhub
  template:
    metadata:
      labels:
        app: volunteerhub
    spec:
      containers:
      - name: volunteerhub
        image: your-registry/volunteerhub:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: volunteerhub-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: volunteerhub
```

## 📝 Best Practices

1. **Use specific image tags** instead of `latest` in production
2. **Enable health checks** for automatic recovery
3. **Set resource limits** to prevent resource exhaustion
4. **Use secrets management** for sensitive data (passwords, API keys)
5. **Implement logging aggregation** (ELK stack, Loki, etc.)
6. **Set up monitoring** (Prometheus, Grafana, etc.)
7. **Use reverse proxy** with SSL/TLS termination
8. **Regular security updates** - rebuild images periodically
9. **Backup data** regularly if using persistent storage
10. **Test disaster recovery** procedures

## 🔐 SSL/TLS Configuration

For production, always use HTTPS. Example with Let's Encrypt:

```yaml
services:
  nginx-proxy:
    image: nginxproxy/nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - certs:/etc/nginx/certs
      - vhost:/etc/nginx/vhost.d
      - html:/usr/share/nginx/html
  
  letsencrypt:
    image: nginxproxy/acme-companion
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - certs:/etc/nginx/certs
      - vhost:/etc/nginx/vhost.d
      - html:/usr/share/nginx/html
    environment:
      - DEFAULT_EMAIL=your-email@domain.com

volumes:
  certs:
  vhost:
  html:
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review container logs: `docker-compose logs`
3. Verify configuration files
4. Check Docker daemon status: `docker info`
