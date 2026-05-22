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
	mongod --replSet rsBanco --port 27017 --dbpath .mongo-rs/node1 --bind_ip localhost --fork --logpath .mongo-rs/logs/node1.log
	mongod --replSet rsBanco --port 27018 --dbpath .mongo-rs/node2 --bind_ip localhost --fork --logpath .mongo-rs/logs/node2.log
	mongod --replSet rsBanco --port 27019 --dbpath .mongo-rs/node3 --bind_ip localhost --fork --logpath .mongo-rs/logs/node3.log

db-replica-init:
	cd backend && npm run replica:init

db-replica-failover:
	cd backend && npm run replica:failover

db-replica-stop:
	mongosh --port 27017 --eval 'db.adminCommand({ shutdown: 1 })' || true
	mongosh --port 27018 --eval 'db.adminCommand({ shutdown: 1 })' || true
	mongosh --port 27019 --eval 'db.adminCommand({ shutdown: 1 })' || true

db-seed:
	cd backend && node seed.js

frontend-install:
	cd frontend && npm install

frontend-start:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build
