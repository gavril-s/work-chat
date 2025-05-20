run: 
	docker-compose -f docker-compose.yml up --build -d

test-env-up: 
	docker-compose -f docker-compose.test.yml up -d

test-env-down: 
	docker-compose -f docker-compose.test.yml down --volumes

test-run-fuzz:
	cd fuzzy/tests && go test -fuzz FuzzAuth -fuzztime 10s
	cd fuzzy/tests && go test -fuzz FuzzFileUpload -fuzztime 10s
	cd fuzzy/tests && go test -fuzz FuzzMessage -fuzztime 10s

fuzz: test-env-up test-run-fuzz test-env-down
