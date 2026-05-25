# Banco Nexus

Banco Nexus es una aplicacion bancaria de practica para base de datos distribuida. El proyecto incluye:

- Backend Node.js/Express con Mongoose.
- Frontend React/Vite.
- MongoDB Replica Set local de 3 nodos con Docker.
- Scripts para seed, failover y simulacion de operaciones desde sucursales.

## Requisitos

- Node.js 18 o superior.
- npm.
- Docker Desktop o Docker Engine con Docker Compose.
- `make`.

No necesitas instalar MongoDB localmente. El replica set usa Docker y expone los puertos `27017`, `27018` y `27019`.

## Setup Desde Cero

Ejecuta estos comandos desde la raiz del proyecto.

1. Instalar dependencias del backend.

```bash
make backend-install
```

2. Instalar dependencias del frontend.

```bash
make frontend-install
```

3. Levantar el replica set de MongoDB con Docker.

```bash
make db-replica-start
```

4. Inicializar el replica set `rsBanco`.

```bash
make db-replica-init
```

Este comando se puede correr mas de una vez. Si el replica set ya existe, solo imprime el estado actual.

5. Cargar datos iniciales.

```bash
make db-seed
```

6. Levantar el backend.

```bash
make backend-start
```

El backend queda en:

```text
http://localhost:3001
```

7. En otra terminal, levantar el frontend.

```bash
make frontend-start
```

El frontend queda normalmente en:

```text
http://localhost:5173
```

## Flujo Diario

Si ya instalaste dependencias y ya inicializaste el replica set antes, normalmente basta con:

```bash
make db-replica-start
make backend-start
make frontend-start
```

Si quieres reiniciar datos de prueba:

```bash
make db-seed
```

Para detener MongoDB:

```bash
make db-replica-stop
```

Los datos del replica set quedan persistidos en `.mongo-rs/`.

## Probar Y Validar

### 1. Tests del backend

```bash
make backend-test
```

Resultado esperado: todos los tests pasan.

### 2. Build del frontend

```bash
make frontend-build
```

Resultado esperado: Vite genera `frontend/dist` sin errores.

### 3. Validar seed

```bash
make db-seed
```

Resultado esperado:

- 15 clientes insertados.
- 15 cuentas insertadas.
- 19 transacciones insertadas.
- Lista de cuentas de prueba impresa en terminal.

### 4. Validar health del replica set

Con el backend corriendo:

```bash
curl http://localhost:3001/health
```

Resultado esperado:

- `status` debe ser `OK`.
- Debe existir un `primary`.
- Deben aparecer 3 miembros en `members`.
- Uno debe estar en `PRIMARY` y dos en `SECONDARY`.

### 5. Validar lectura de una cuenta

Con el backend corriendo:

```bash
curl http://localhost:3001/api/accounts/1000000001
```

Resultado esperado:

- Respuesta con `accountNumber`, `balance`, `client` y `transactions`.
- `accountNumber` debe ser `1000000001`.

### 6. Validar failover automatizado

```bash
make db-replica-failover
```

Resultado esperado:

- Muestra el estado de los 3 nodos.
- Inserta una transaccion con `writeConcern: majority`.
- Lee correctamente desde los secundarios.

### 7. Cambiar el primario y volver a validar

```bash
make db-replica-stepdown
```

Espera unos segundos y vuelve a correr:

```bash
make db-replica-failover
```

Resultado esperado:

- El primario cambia a otro nodo.
- La escritura sigue funcionando.
- La lectura desde secundarios sigue funcionando.

### 8. Validar desde la interfaz

Con backend y frontend corriendo:

1. Abre `http://localhost:5173`.
2. Busca la cuenta `1000000001`.
3. Realiza un deposito o retiro.
4. Verifica que el saldo y la tabla de transacciones se actualicen.
5. Reinicia el backend o corre `make db-replica-stepdown`.
6. Vuelve a buscar la cuenta y confirma que los datos persisten.

## Comandos Utiles

```bash
make db-replica-logs
```

Muestra logs del contenedor Mongo.

```bash
make backend-concurrent-transactions
```

Simula operaciones concurrentes desde varias sucursales contra la API.

```bash
cd backend && npm run simulate-gdl
```

Ejecuta una operacion remota desde una sucursal especifica. Tambien existen `simulate-cdmx`, `simulate-mty`, `simulate-pue` y `simulate-tij`.

## Variables De Entorno

Backend:

```bash
MONGO_URI=mongodb://localhost:27017,localhost:27018,localhost:27019/banco_nexus?replicaSet=rsBanco
DB_NAME=banco_nexus
PORT=3001
DB_LATENCY_WARNING_MS=1000
```

Si no defines variables, el proyecto usa esos valores por defecto.

## Notas

- No uses `mongod` ni `mongosh` locales para la practica normal. Usa los comandos `make db-replica-*`.
- Si Docker dice que los puertos `27017`, `27018` o `27019` ya estan ocupados, detén cualquier Mongo local o contenedor viejo que los este usando.
- Si el estado del replica set se ve raro, revisa logs con `make db-replica-logs` y vuelve a ejecutar `make db-replica-init`.
