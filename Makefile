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
