firstrunfronted:
	cd app && npm install && npm run dev && cd ..
	
runfrontend:
	cd app && npm run dev && cd ..


stop:
	docker compose stop
