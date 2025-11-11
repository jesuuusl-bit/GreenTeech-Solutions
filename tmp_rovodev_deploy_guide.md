# 🚀 Guía Completa de Despliegue - GreenTech Services

## Servicios a Desplegar en Render

### 📋 **Checklist de Servicios:**
- ✅ **API Gateway**: `greentech-api-gateway` (Puerto 5000) - Ya desplegado
- ✅ **Users Service**: `greentech-users` (Puerto 5001) - Ya desplegado
- ⏳ **Projects Service**: `greentech-projects` (Puerto 5002) - **Pendiente**
- ⏳ **Monitoring Service**: `greentech-monitoring` (Puerto 5003) - **Pendiente**
- ⏳ **Predictive Service**: `greentech-predictive` (Puerto 5004) - **Pendiente**
- ⏳ **Documents Service**: `greentech-documents` (Puerto 5005) - **Pendiente**

---

## 🛠️ **Configuración para cada servicio:**

### **2. Projects Service**
- **Nombre**: `greentech-projects`
- **Root Directory**: `backend/projects-service`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Variables de Entorno**:
  ```
  NODE_ENV=production
  PORT=5002
  MONGO_URI=mongodb+srv://admin:admin@cluster0.8mdsgox.mongodb.net/greentech_projects?appName=Cluster0
  ```
- **URL esperada**: `https://greentech-projects.onrender.com`

### **3. Monitoring Service**
- **Nombre**: `greentech-monitoring`
- **Root Directory**: `backend/monitoring-service`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Variables de Entorno**:
  ```
  NODE_ENV=production
  PORT=5003
  MONGO_URI=mongodb+srv://admin:admin@cluster0.8mdsgox.mongodb.net/greentech_monitoring?appName=Cluster0
  ```
- **URL esperada**: `https://greentech-monitoring.onrender.com`

### **4. Predictive Service**
- **Nombre**: `greentech-predictive`
- **Root Directory**: `backend/predictive-service`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Variables de Entorno**:
  ```
  NODE_ENV=production
  PORT=5004
  MONGO_URI=mongodb+srv://admin:admin@cluster0.8mdsgox.mongodb.net/greentech_predictive?appName=Cluster0
  WEATHER_API_KEY=your-openweathermap-api-key
  ```
- **URL esperada**: `https://greentech-predictive.onrender.com`

### **5. Documents Service**
- **Nombre**: `greentech-documents`
- **Root Directory**: `backend/documents-service`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Variables de Entorno**:
  ```
  NODE_ENV=production
  PORT=5005
  MONGO_URI=mongodb+srv://admin:admin@cluster0.8mdsgox.mongodb.net/greentech_documents?appName=Cluster0
  MAX_FILE_SIZE=10485760
  ```
- **URL esperada**: `https://greentech-documents.onrender.com`

---

## ⚠️ **IMPORTANTE:**
Una vez desplegados todos los servicios, actualizar `backend/api-gateway/src/config/services.js` con las URLs de producción.