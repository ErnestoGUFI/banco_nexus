# AWS EC2 para Banco Nexus

Esta carpeta contiene la plantilla CloudFormation para crear la topologia minima
del proyecto:

- 1 EC2 backend manager/worker.
- 1 EC2 backend worker.
- 1 EC2 frontend worker.
- 1 VPC con tres subredes publicas.
- Security Group con puertos de SSH, HTTP y Docker Swarm overlay.

## Crear infraestructura

Requisitos locales:

- AWS CLI configurado.
- Un key pair EC2 existente.
- Permisos para crear VPC, EC2 y Security Groups.

```bash
aws cloudformation deploy \
  --stack-name banco-nexus-ec2 \
  --template-file infra/aws/cloudformation.yml \
  --parameter-overrides \
    KeyName=<TU_KEY_PAIR> \
    SshCidr=<TU_IP_PUBLICA>/32 \
    AppIngressCidr=0.0.0.0/0 \
  --capabilities CAPABILITY_NAMED_IAM
```

Obtener salidas:

```bash
aws cloudformation describe-stacks \
  --stack-name banco-nexus-ec2 \
  --query "Stacks[0].Outputs"
```

## Inicializar Docker Swarm

Usa las IP publicas que entrega CloudFormation:

```bash
MANAGER_HOST=<BackendManagerPublicIp> \
BACKEND_WORKER_HOST=<BackendWorkerPublicIp> \
FRONTEND_WORKER_HOST=<FrontendWorkerPublicIp> \
SSH_KEY=~/.ssh/<tu-key>.pem \
scripts/bootstrap-swarm.sh
```

El script crea el Swarm, une los dos workers y etiqueta los nodos:

- `banco_role=backend` en los dos nodos backend.
- `banco_role=frontend` en el nodo frontend.

El stack `deploy/swarm-stack.yml` usa esas etiquetas para forzar la topologia
pedida por la rubrica.

## Desplegar la app

Primero publica las imagenes Docker en GHCR o Docker Hub. Luego:

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

## Eliminar infraestructura

```bash
aws cloudformation delete-stack --stack-name banco-nexus-ec2
```
