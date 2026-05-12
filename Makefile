# Backend

backend-install:
	cd backend && npm install

backend-start:
	cd backend && npm start

# Databae

db-install:
	docker run mongo:latest --name banco_nexus_db -p 27017:27017

db-start:
	docker start banco_nexus_db

db-seed:
	cd database && node seed.js

# Frontend

frontend-install:
	cd frontend && npm install

frontend-start:
	cd frontend && npm start
