-- GramConnect PostgreSQL Schema Reference

CREATE TABLE IF NOT EXISTS complaints (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    category VARCHAR(60) NOT NULL,
    location VARCHAR(200),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Migration script to add priority column if upgrading existing database:
-- ALTER TABLE complaints ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM' NOT NULL;