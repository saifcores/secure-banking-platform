.PHONY: package up down test

package:
	./mvnw -DskipTests package

up: package
	docker compose up --build

down:
	docker compose down

test:
	./mvnw test
