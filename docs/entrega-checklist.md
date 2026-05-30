# Checklist de Entrega

## Codigo

- [x] Backend monolitico contenedorizado.
- [x] Frontend desacoplado en contenedor independiente.
- [x] Registro, login JWT y perfil.
- [x] Dashboard con saldo.
- [x] Historial de movimientos.
- [x] Alta de cuentas destino.
- [x] Transferencias con validacion de saldo y transaccion ACID.
- [x] Auditoria en base de datos.
- [x] Alertas visuales de exito/error.
- [x] Numero de cuenta de 10 digitos con prefijo `180`.
- [x] Indices unicos para cuenta y email.
- [x] Validacion regex `/^\d{10}$/`.

## Infraestructura

- [x] Dockerfile backend.
- [x] Dockerfile frontend.
- [x] Stack Docker Swarm con red overlay.
- [x] Backend con 2 replicas y maximo 1 replica por nodo.
- [x] Frontend forzado al nodo dedicado de frontend.
- [x] CloudFormation para 2 EC2 backend + 1 EC2 frontend.
- [x] Scripts de bootstrap Swarm.
- [x] Scripts de deploy del stack.
- [x] EC2 reales creadas en AWS.
- [x] Swarm real inicializado.
- [x] MongoDB Atlas real conectado.
- [x] Primer despliegue real ejecutado.

## CI/CD

- [x] Workflow para pull request.
- [x] Workflow para push a main.
- [x] Build y push de imagenes Docker.
- [x] Rolling update remoto del Swarm.
- [x] Secrets configurados en GitHub.
- [x] Ejecucion real del workflow en GitHub.

## Evidencia para la presentacion

- [x] URL del repositorio.
- [x] PDF de arquitectura.
- [ ] Captura de la app en navegador.
- [ ] Captura de MongoDB Atlas con colecciones/datos.
- [x] Captura o salida de 3 EC2 en AWS.
- [x] Salida de `docker node ls`.
- [x] Salida de `docker stack services banco_nexus`.
- [x] Salida de `docker service ps banco_nexus_backend`.
- [x] Salida de GitHub Actions exitoso.
