CREATE USER banking WITH PASSWORD 'banking';

CREATE DATABASE customer_db OWNER banking;
CREATE DATABASE account_db OWNER banking;
CREATE DATABASE transaction_db OWNER banking;
CREATE DATABASE audit_db OWNER banking;
CREATE DATABASE keycloak OWNER banking;

GRANT ALL PRIVILEGES ON DATABASE customer_db TO banking;
GRANT ALL PRIVILEGES ON DATABASE account_db TO banking;
GRANT ALL PRIVILEGES ON DATABASE transaction_db TO banking;
GRANT ALL PRIVILEGES ON DATABASE audit_db TO banking;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO banking;
