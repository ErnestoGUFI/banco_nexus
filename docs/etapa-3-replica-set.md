# Banco Nexus - Etapa 3: Replica Set MongoDB

## Objetivo

Configurar una replica local de MongoDB con tres nodos (`rsBanco`) para que Banco Nexus mantenga disponibilidad y consistencia ante la caida de un nodo.

## Puertos y base de datos

| Nodo | Puerto | Ruta local |
| --- | --- | --- |
| 1 | `27017` | `.mongo-rs/node1` |
| 2 | `27018` | `.mongo-rs/node2` |
| 3 | `27019` | `.mongo-rs/node3` |

La aplicacion usa por defecto:

```text
mongodb://localhost:27017,localhost:27018,localhost:27019/banco_nexus?replicaSet=rsBanco
```

Se puede sobrescribir con `MONGO_URI` y `DB_NAME`.

## Configuracion paso a paso

1. Instalar dependencias del backend.

```bash
make backend-install
```

2. Iniciar los tres procesos locales de MongoDB.

```bash
make db-replica-start
```

3. Inicializar el replica set desde el nodo `27017`.

```bash
make db-replica-init
```

El script ejecutado es [IniciarReplica.js](/Users/ernestogf/Documents/banco_nexus_ids/backend/scripts/IniciarReplica.js).

4. Cargar datos iniciales.

```bash
make db-seed
```

5. Levantar backend y frontend.

```bash
make backend-start
make frontend-start
```

## Verificacion de failover

1. Ejecutar la prueba automatizada.

```bash
make db-replica-failover
```

La prueba imprime el primario actual, estados de los tres nodos, inserta una transaccion con `writeConcern: majority` y valida lectura desde secundarios disponibles.

2. Cambiar el nodo primario con `stepDown`.

Primero identifica el primario en la salida de la prueba. Luego ejecuta el comando contra ese puerto:

```bash
mongosh --port 27017 --eval 'rs.stepDown(60)'
```

Si el primario no es `27017`, cambia el puerto por `27018` o `27019`.

3. Repetir la prueba.

```bash
make db-replica-failover
```

El sistema debe detectar un nuevo primario y permitir lectura/escritura sin modificar el backend.

## Evidencias sugeridas

- Captura de `rs.status()` con los tres nodos y un `PRIMARY`.
- Captura de `make db-replica-failover` antes y despues de `rs.stepDown(60)`.
- Captura de la interfaz mostrando alerta si el replica set esta caido o con latencia elevada.
- Captura de una operacion de deposito/retiro persistiendo despues de reiniciar backend o un nodo MongoDB.

## Detener nodos

```bash
make db-replica-stop
```
