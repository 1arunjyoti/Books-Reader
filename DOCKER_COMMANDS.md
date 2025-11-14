# 🐳 Docker Commands Reference - BooksReader

This guide provides essential Docker commands for managing the BooksReader project.

---

## 🚀 Quick Start

### Start Everything
```powershell
cd D:\Projects\BooksReader
docker-compose up -d
```

### Stop Everything
```powershell
cd D:\Projects\BooksReader
docker-compose down
```

### Restart Everything
```powershell
cd D:\Projects\BooksReader
docker-compose restart
```

---

## 📦 Building

### Build the Latest Image
```powershell
cd D:\Projects\BooksReader
docker-compose build
```

### Build Without Cache (Force Fresh Build)
```powershell
cd D:\Projects\BooksReader
docker-compose build --no-cache
```

### Build Specific Service
```powershell
docker-compose build booksreader-server
```

### Build with Custom Tag
```powershell
docker build -t booksreader-server:v1.0 .
```

---

## ▶️ Running Containers

### Start All Services in Background
```powershell
docker-compose up -d
```

### Start All Services in Foreground (See Logs)
```powershell
docker-compose up
```

### Start Specific Service
```powershell
docker-compose up -d booksreader-server
```

### Run Container Without Docker Compose
```powershell
docker run -it --rm `
  -p 5000:5000 `
  --env-file .env.production `
  booksreader-server:latest
```

---

## 🔍 Viewing Information

### List All Running Containers
```powershell
docker ps
```

### List All Containers (Including Stopped)
```powershell
docker ps -a
```

### View Container Logs (Last 50 Lines)
```powershell
docker-compose logs --tail 50
```

### View Live Container Logs
```powershell
docker-compose logs -f
```

### View Logs for Specific Service
```powershell
docker-compose logs -f booksreader-server
```

### View Container Details
```powershell
docker inspect booksreader-server
```

### Check Container Health Status
```powershell
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 🧹 Cleanup

### Stop All Containers
```powershell
docker-compose down
```

### Stop and Remove All Volumes (WARNING: Deletes Data)
```powershell
docker-compose down -v
```

### Remove Stopped Containers
```powershell
docker container prune
```

### Remove Unused Images
```powershell
docker image prune
```

### Remove All Unused Docker Resources
```powershell
docker system prune
```

### Remove Everything (WARNING: Includes Images, Containers, Volumes)
```powershell
docker system prune -a --volumes
```

---

## 🐛 Debugging

### Execute Command Inside Running Container
```powershell
docker-compose exec booksreader-server sh
```

### Execute npm Command in Container
```powershell
docker-compose exec booksreader-server npm --version
```

### View Container Resource Usage
```powershell
docker stats
```

### Get Container IP Address
```powershell
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' booksreader-server
```

### Check If Container Is Healthy
```powershell
docker inspect --format='{{.State.Health.Status}}' booksreader-server
```

---

## 🔄 Database & Migrations

### Run Prisma Migrations in Container
```powershell
docker-compose exec booksreader-server npx prisma migrate deploy
```

### Generate Prisma Client
```powershell
docker-compose exec booksreader-server npx prisma generate
```

### Open Prisma Studio (For Viewing Database)
```powershell
docker-compose exec booksreader-server npx prisma studio
```

---

## 📝 Environment & Configuration

### View Environment Variables in Container
```powershell
docker-compose exec booksreader-server env
```

### Rebuild & Deploy with Fresh Environment
```powershell
cd D:\Projects\BooksReader
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🔐 Common Issues & Solutions

### Container Won't Start
```powershell
# Check logs for errors
docker-compose logs booksreader-server

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

### Port Already in Use (5000)
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or change the port in docker-compose.yml
# Change: ports: - "5000:5000" to - "5001:5000"
```

### Need to Clear All Docker Data
```powershell
# CAUTION: This removes everything
docker system prune -a --volumes --force
docker-compose build --no-cache
docker-compose up -d
```

### Container Running But Not Responding
```powershell
# Restart the container
docker-compose restart booksreader-server

# Or fully recreate it
docker-compose down
docker-compose up -d
```

---

## 📊 Useful Aliases (Optional)

Add these to your PowerShell profile (`$PROFILE`) for quick access:

```powershell
# Docker Compose shortcuts
Set-Alias -Name dc -Value docker-compose
Set-Alias -Name dcup -Value 'docker-compose up -d'
Set-Alias -Name dcdown -Value 'docker-compose down'
Set-Alias -Name dclogs -Value 'docker-compose logs -f'

# Docker shortcuts
Set-Alias -Name dps -Value 'docker ps'
Set-Alias -Name dpsa -Value 'docker ps -a'
```

Then you can use:
```powershell
dcup         # Start containers
dcdown       # Stop containers
dclogs       # View logs
dps          # List running containers
```

---

## 🔗 Useful Links

- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose Reference**: https://docs.docker.com/compose/compose-file/
- **BooksReader RUN_LOCALLY Guide**: See `RUN_LOCALLY.md`
- **Server README**: See `Server/Readme.md`

---

## 📋 Quick Reference Table

| Command | Purpose |
|---------|---------|
| `docker-compose up -d` | Start all services in background |
| `docker-compose down` | Stop all services |
| `docker-compose build` | Build the latest image |
| `docker-compose logs -f` | View live logs |
| `docker ps` | List running containers |
| `docker-compose exec booksreader-server sh` | SSH into container |
| `docker system prune` | Clean up unused resources |

---

**Last Updated**: November 12, 2025  
**Project**: BooksReader  
**Branch**: test
