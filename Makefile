.PHONY: backend-install backend-start backend-dev db-install db-start db-stop db-seed frontend-install frontend-start frontend-build

backend-install:
	cd backend && npm install

backend-start:
	cd backend && npm start

backend-test:
	cd backend && npm test

backend-dev:
	cd backend && npm run dev

db-install:
	docker run -d --name banco_nexus_db -p 27017:27017 mongo:latest

db-start:
	docker start banco_nexus_db

db-stop:
	docker stop banco_nexus_db

db-seed:
	cd backend && node seed.js

frontend-install:
	cd frontend && npm install

frontend-start:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build
