# GitHub Actions y Secrets

El workflow `.github/workflows/ci-cd.yml` valida pull requests y despliega en
push a `main`.

## Secrets requeridos

Configura estos valores en GitHub:

- `SWARM_MANAGER_HOST`: IP publica o DNS de la EC2 manager.
- `SWARM_USER`: normalmente `ec2-user`.
- `SWARM_SSH_PRIVATE_KEY`: llave privada PEM para entrar al manager.
- `GHCR_TOKEN`: token con permiso para leer paquetes privados desde GHCR.

## Flujo

En pull request:

1. Instala dependencias backend.
2. Ejecuta tests backend.
3. Instala dependencias frontend.
4. Compila frontend.

En push a `main`:

1. Construye imagen backend.
2. Construye imagen frontend.
3. Publica ambas en GHCR.
4. Entra por SSH al Swarm manager.
5. Ejecuta rolling update sobre:
   - `banco_nexus_backend`
   - `banco_nexus_frontend`

## Evidencia sugerida

Guarda capturas o salidas de:

```bash
docker stack services banco_nexus
docker service ps banco_nexus_backend --no-trunc
docker service ps banco_nexus_frontend --no-trunc
curl http://<FRONTEND_PUBLIC_IP>/health
```
