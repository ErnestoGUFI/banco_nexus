# Banco Nexus

Sistema de transferencias bancarias con backend monolitico en Node.js/Express,
frontend React desacoplado y persistencia en MongoDB compatible con MongoDB
Atlas. El despliegue de produccion esta preparado para Docker Swarm sobre AWS
EC2: dos replicas de backend y una instancia dedicada para el frontend.

## Modulos

- Usuarios y autenticacion con JWT, registro, login y perfil editable.
- Generacion automatica de cuenta de 10 digitos con prefijo `180`, secuencia de
  6 digitos y digito verificador por suma modulo 10.
- Dashboard con saldo disponible e historial de movimientos.
- Alta de cuentas destino y transferencias validadas con transacciones ACID de
  MongoDB.
- Bitacora en base de datos para login, registro, alta de destino,
  actualizacion de perfil y transferencias exitosas o fallidas.

## Desarrollo local

Requisitos: Node.js 18+, npm, Docker y `make`.

Forma rapida para levantar todo el proyecto local:

```bash
./run-project.sh
```

Esto inicia MongoDB replica set en Docker, carga datos de prueba, levanta el
backend en `http://localhost:3001` y el frontend en `http://localhost:5173`.

Para apagar todo:

```bash
./stop-project.sh
```

Si quieres borrar tambien los datos locales de MongoDB:

```bash
./stop-project.sh --clean-data
```

Para mostrar en vivo que el proyecto cumple con AWS, EC2, Docker Swarm,
MongoDB Atlas y CI/CD:

```bash
./show-compliance.sh
```

Tambien se puede ejecutar como:

```bash
make project-proof
```

```bash
make backend-install
make frontend-install
make db-replica-start
make db-replica-init
make db-seed
make backend-start
make frontend-start
```

URLs locales:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Health: `http://localhost:3001/health`

Para pruebas locales, carga los datos seed con `make db-seed` y crea una
cuenta desde la interfaz o consulta las cuentas de prueba directamente en tu
entorno local.

Tambien puedes levantar frontend y backend en contenedores locales:

```bash
make docker-app-build
make db-replica-init
make db-seed
make docker-app-start
```

El frontend contenedorizado queda en `http://localhost:8080`.

## Variables de entorno

Copia `.env.example` como referencia. En produccion, `MONGO_URI` debe apuntar a
MongoDB Atlas u otro servicio administrado compatible con MongoDB. No se guarda
persistencia financiera dentro de contenedores.

```bash
PORT=3001
DB_NAME=banco_nexus
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/banco_nexus?retryWrites=true&w=majority
JWT_SECRET=change-me-with-a-long-random-secret
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173,http://localhost
```

## API principal

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/dashboard`
- `PATCH /api/me`
- `POST /api/beneficiaries`
- `POST /api/transfers`
- `GET /api/transactions`
- `GET /api/audit`

Todas las rutas de `/api` excepto autenticacion requieren `Authorization:
Bearer <token>`.

## Docker Swarm en AWS EC2

Topologia objetivo:

- EC2 backend 1: nodo Swarm manager/worker.
- EC2 backend 2: nodo Swarm worker.
- EC2 frontend: nodo Swarm worker con el servicio frontend publicado en puerto
  `80`.
- MongoDB Atlas como base de datos administrada externa.

Crear infraestructura con CloudFormation:

```bash
aws cloudformation deploy \
  --stack-name banco-nexus-ec2 \
  --template-file infra/aws/cloudformation.yml \
  --parameter-overrides \
    KeyName=<TU_KEY_PAIR> \
    SshCidr=<TU_IP_PUBLICA>/32 \
    AppIngressCidr=0.0.0.0/0
```

Ver salidas:

```bash
make aws-outputs
```

Inicializar Swarm y etiquetar nodos:

```bash
MANAGER_HOST=<BackendManagerPublicIp> \
BACKEND_WORKER_HOST=<BackendWorkerPublicIp> \
FRONTEND_WORKER_HOST=<FrontendWorkerPublicIp> \
SSH_KEY=~/.ssh/<tu-key>.pem \
scripts/bootstrap-swarm.sh
```

El stack fuerza la topologia con labels:

- `banco_role=backend` para las 2 EC2 backend.
- `banco_role=frontend` para la EC2 frontend.
- `max_replicas_per_node: 1` para que las 2 replicas backend queden en nodos
  distintos.

Desplegar el stack con MongoDB Atlas y secrets Swarm:

```bash
MANAGER_HOST=<BackendManagerPublicIp> \
SSH_KEY=~/.ssh/<tu-key>.pem \
MONGO_URI='mongodb+srv://...' \
JWT_SECRET='<secreto-largo>' \
BACKEND_IMAGE='ghcr.io/<owner>/<repo>/backend:latest' \
FRONTEND_IMAGE='ghcr.io/<owner>/<repo>/frontend:latest' \
GHCR_USER='<usuario-ghcr>' \
GHCR_TOKEN='<token-ghcr>' \
scripts/deploy-swarm.sh
```

El stack usa red overlay `banco_nexus_overlay`, `replicas: 2` para el backend y
rolling update progresivo. El backend usa `order: stop-first` para respetar
`max_replicas_per_node: 1`; el frontend usa `order: start-first` en su nodo
dedicado.

Mas detalle:

- `infra/aws/README.md`
- `docs/mongodb-atlas.md`
- `docs/github-secrets.md`
- `docs/entrega-checklist.md`

## CI/CD

El workflow `.github/workflows/ci-cd.yml` ejecuta tests y build en pull request.
En push a `main`, construye y publica imagenes en GHCR y ordena al Swarm un
rolling update de:

- `banco_nexus_backend`
- `banco_nexus_frontend`

Secrets requeridos en GitHub:

- `SWARM_MANAGER_HOST`
- `SWARM_USER`
- `SWARM_SSH_PRIVATE_KEY`
- `GHCR_TOKEN`

## Validacion

```bash
make backend-test
make frontend-build
```

Para comprobar el numero de cuenta, registra un usuario nuevo. La secuencia `34`
debe generar `1800000346`.

Para guardar evidencia del despliegue real:

```bash
MANAGER_HOST=<BackendManagerPublicIp> \
SSH_KEY=~/.ssh/<tu-key>.pem \
FRONTEND_URL=http://<FrontendWorkerPublicIp> \
scripts/collect-evidence.sh
```
