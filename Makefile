backend-install:
	cd backend && npm install

backend-start:
	cd backend && npm start

backend-test:
	cd backend && npm test

backend-concurrent-transactions:
	cd backend && ACCOUNT=1000000002 RUNS=3 node scripts/simulateConcurrentBranches.js

backend-dev:
	cd backend && npm run dev

db-install:
	docker run -d --name banco_nexus_db -p 27017:27017 mongo:latest

db-start:
	docker start banco_nexus_db

db-stop:
	docker stop banco_nexus_db

db-replica-start:
	mkdir -p .mongo-rs/node1 .mongo-rs/node2 .mongo-rs/node3 .mongo-rs/logs
	docker compose up -d mongo-rs

db-replica-init:
	docker compose exec -T mongo-rs mongosh --port 27017 /scripts/initializeReplicaSet.js

db-replica-failover:
	cd backend && npm run replica:failover

db-replica-stepdown:
	cd backend && npm run replica:stepdown

db-replica-stop:
	docker compose down

db-replica-logs:
	docker compose logs -f mongo-rs

db-seed:
	cd backend && node seed.js

frontend-install:
	cd frontend && npm install

frontend-start:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

docker-app-build:
	docker compose build backend frontend

docker-app-start:
	docker compose up -d mongo-rs backend frontend

project-start:
	./run-project.sh

project-stop:
	./stop-project.sh

swarm-deploy:
	docker stack deploy -c deploy/swarm-stack.yml banco_nexus

swarm-status:
	docker stack services banco_nexus

aws-deploy-infra:
	aws cloudformation deploy --stack-name banco-nexus-ec2 --template-file infra/aws/cloudformation.yml --parameter-overrides KeyName=$$KEY_NAME SshCidr=$$SSH_CIDR AppIngressCidr=$${APP_INGRESS_CIDR:-0.0.0.0/0}

aws-outputs:
	aws cloudformation describe-stacks --stack-name banco-nexus-ec2 --query "Stacks[0].Outputs"

aws-delete-infra:
	aws cloudformation delete-stack --stack-name banco-nexus-ec2
