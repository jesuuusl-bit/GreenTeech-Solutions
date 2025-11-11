# ===== README.md =====
# 🌿 GreenTech Solutions

Plataforma integral para la gestión, monitoreo y análisis predictivo de proyectos de energía renovable.

## 🏗️ Arquitectura

### Backend - Microservicios
- **API Gateway** (Puerto 5000): Gateway central con autenticación JWT
- **Users Service** (Puerto 5001): Gestión de usuarios y roles
- **Projects Service** (Puerto 5002): Gestión de proyectos y tareas
- **Monitoring Service** (Puerto 5003): Monitoreo en tiempo real
- **Predictive Service** (Puerto 5004): Análisis predictivo con IA/ML
- **Documents Service** (Puerto 5005): Gestión documental

### Frontend
- **React 18** con Vite
- **TailwindCSS** para estilos
- **React Router** para navegación
- **Zustand** para estado global

### Base de Datos
- **MongoDB Atlas** (Cluster separado por servicio)

## 🚀 Instalación Local

### Prerequisitos
- Node.js 18+
- Docker y Docker Compose
- MongoDB Atlas cuenta

### 1. Clonar repositorio
```bash
git clone https://github.com/jesuuusl-bit/GreenTeech-Solutions.git
cd greentech-solutions
```

### 2. Configurar variables de entorno
Copia los archivos `.env.example` en cada servicio y renómbralos a `.env`.

### 3. Instalar dependencias

Backend:
```bash
cd backend/api-gateway && npm install
cd ../users-service && npm install
cd ../projects-service && npm install
cd ../monitoring-service && npm install
cd ../predictive-service && npm install
cd ../documents-service && npm install
```

Frontend:
```bash
cd frontend && npm install
```

### 4. Levantar con Docker Compose
```bash
docker-compose up -d
```

### 5. Acceder a la aplicación
- Frontend: https://green-teech-solutions.vercel.app
- API Gateway: https://greentech-api-gateway.onrender.com

## 📦 Despliegue

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Backend (Render)
Usa el archivo `render.yaml` o configura manualmente cada servicio en el dashboard de Render.

## 🧪 Pruebas

Backend:
```bash
cd backend/users-service
npm test
```

Frontend:
```bash
cd frontend
npm test
```

## 🔐 Roles y Permisos

- **admin**: Acceso total
- **manager**: Gestión de proyectos y reportes
- **operator**: Monitoreo de plantas
- **technician**: Mantenimiento y alertas
- **analyst**: Análisis predictivo
- **auditor**: Acceso de lectura a documentos

## 📚 Documentación API

La documentación completa de la API está disponible en `/docs/API.md`