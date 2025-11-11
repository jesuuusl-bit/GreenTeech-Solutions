# 🚀 Configuración de Auto-Deploy para Render

Este documento explica cómo configurar el auto-deploy y keep-alive para los servicios de Render.

## 🎯 Objetivos

1. **Auto-deploy**: Cada commit a `main` despliega automáticamente todos los servicios
2. **Keep-alive**: Los servicios se mantienen activos y no se "duermen"
3. **Monitoreo**: Seguimiento del estado de todos los servicios

## ⚙️ Configuración en GitHub

### 1. Obtener Deploy Hooks de Render

Para cada servicio en Render:

1. Ve a tu servicio en el dashboard de Render
2. Ve a **Settings** → **Build & Deploy**
3. Busca la sección **Deploy Hook**
4. Copia la URL del webhook

### 2. Configurar Secrets en GitHub

Ve a tu repositorio → **Settings** → **Secrets and variables** → **Actions** y agrega:

#### Deploy Hooks (Requeridos para auto-deploy):
```
RENDER_DEPLOY_HOOK_API_GATEWAY=https://api.render.com/deploy/srv-xxxxx?key=yyyyy
RENDER_DEPLOY_HOOK_USERS_SERVICE=https://api.render.com/deploy/srv-xxxxx?key=yyyyy
RENDER_DEPLOY_HOOK_PROJECTS_SERVICE=https://api.render.com/deploy/srv-xxxxx?key=yyyyy
RENDER_DEPLOY_HOOK_MONITORING_SERVICE=https://api.render.com/deploy/srv-xxxxx?key=yyyyy
RENDER_DEPLOY_HOOK_PREDICTIVE_SERVICE=https://api.render.com/deploy/srv-xxxxx?key=yyyyy
RENDER_DEPLOY_HOOK_DOCUMENTS_SERVICE=https://api.render.com/deploy/srv-xxxxx?key=yyyyy
```

#### URLs de Servicios (Opcionales para keep-alive):
```
RENDER_API_GATEWAY_URL=https://tu-api-gateway.onrender.com
RENDER_USERS_SERVICE_URL=https://tu-users-service.onrender.com
RENDER_PROJECTS_SERVICE_URL=https://tu-projects-service.onrender.com
RENDER_MONITORING_SERVICE_URL=https://tu-monitoring-service.onrender.com
RENDER_PREDICTIVE_SERVICE_URL=https://tu-predictive-service.onrender.com
RENDER_DOCUMENTS_SERVICE_URL=https://tu-documents-service.onrender.com
```

## 🔄 Workflows Configurados

### 1. `backend-deploy.yml`
- **Trigger**: Push a `main` en carpeta `backend/`
- **Función**: 
  - Ejecuta tests de todos los servicios
  - Activa deploy hooks de Render
  - Hace ping a los servicios después del deploy

### 2. `keep-services-alive.yml` 
- **Trigger**: Cada 10 minutos (cron) + manual
- **Función**:
  - Hace ping a todos los servicios para mantenerlos activos
  - Puede triggear deploys manualmente si es necesario

### 3. `frontend-deploy.yml`
- **Trigger**: Push a `main` en carpeta `frontend/`
- **Función**: Deploy automático a Vercel

## 🏃‍♂️ Flujo de Trabajo

### Automático (cada commit):
1. **Commit** → Push a `main`
2. **GitHub Actions** detecta cambios
3. **Tests** se ejecutan en paralelo
4. **Deploy hooks** se activan en Render
5. **Servicios** se despliegan automáticamente
6. **Keep-alive** pings los mantienen activos

### Keep-alive (cada 10 minutos):
1. **Cron job** se ejecuta
2. **Ping** a todos los servicios
3. **Servicios** se mantienen despiertos
4. **Logs** muestran el estado de cada servicio

## 📊 Beneficios

✅ **Sin servicios dormidos**: Los servicios responden instantáneamente  
✅ **Deploy automático**: No necesitas deploy manual  
✅ **Monitoreo**: Sabes el estado de todos los servicios  
✅ **Rollback fácil**: Si hay problemas, Render puede hacer rollback  
✅ **Logs centralizados**: Todo se registra en GitHub Actions  

## 🎮 Uso Manual

### Ejecutar keep-alive manualmente:
1. Ve a **Actions** → **Keep Render Services Alive**
2. Click **Run workflow**
3. Esto hace ping a todos los servicios y puede triggear deploys

### Ver logs de deployment:
1. Ve a **Actions** 
2. Selecciona el workflow que quieres revisar
3. Ve los logs detallados de cada step

## 🔧 Troubleshooting

### Los servicios siguen durmiendo:
- Verifica que los URLs en los secrets sean correctos
- Asegúrate de que el endpoint `/health` existe
- Reduce el intervalo del cron a `*/5 * * * *` (cada 5 minutos)

### Deploy hooks no funcionan:
- Verifica que los deploy hooks en Render estén activos
- Revisa que las URLs en los secrets sean correctas
- Ve los logs en GitHub Actions para errores específicos

### Tests fallan pero quieres deploy:
- Los workflows están configurados con `continue-on-error: true`
- Los deploys se ejecutan incluso si los tests fallan
- Revisa los logs para ver qué tests están fallando

## 💡 Tips

- **Cron scheduling**: El keep-alive usa UTC time
- **Rate limiting**: Render tiene límites en deploy hooks, no abuses
- **Costs**: Keep-alive mantiene servicios activos = más tiempo facturado
- **Monitoring**: Usa los logs de GitHub Actions para debugging

---

**¡Ahora tus servicios se mantendrán activos y se actualizarán automáticamente con cada commit!** 🎉