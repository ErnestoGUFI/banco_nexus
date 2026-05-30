# MongoDB Atlas

Banco Nexus usa MongoDB como base administrada. Para cumplir la rubrica, la URI
de produccion debe apuntar a MongoDB Atlas y no a una base local dentro de un
contenedor.

## Pasos

1. Crear un proyecto en MongoDB Atlas.
2. Crear un cluster con replica set administrado.
3. Crear un usuario de base de datos con permisos de lectura/escritura sobre
   `banco_nexus`.
4. Configurar Network Access:
   - Para pruebas rapidas puedes permitir `0.0.0.0/0`.
   - Para entrega formal es mejor permitir las IP publicas de las EC2 backend.
5. Copiar el connection string y reemplazar usuario, password y base:

```text
mongodb+srv://USER:PASSWORD@cluster.mongodb.net/banco_nexus?retryWrites=true&w=majority
```

6. Crear el secreto en Docker Swarm:

```bash
printf '%s' 'mongodb+srv://USER:PASSWORD@cluster.mongodb.net/banco_nexus?retryWrites=true&w=majority' \
  | docker secret create mongo_uri -
```

## Verificacion

Con el backend desplegado:

```bash
curl http://<FRONTEND_PUBLIC_IP>/health
```

Debe responder `status: "OK"` o `status: "DEGRADED"` si la latencia supera el
umbral configurado. La app no guarda datos financieros en contenedores; los
modelos y transacciones viven en Atlas.
