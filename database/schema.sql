-- =======================================================
-- GramConnect – PostgreSQL Database Schema
-- Compatible with local PostgreSQL & Cloud PostgreSQL (Neon, Render, Supabase)
-- =======================================================

-- 1. Create Users Table (for Admin, Worker, and Villager roles)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    village VARCHAR(100),
    role VARCHAR(30) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'WORKER', 'VILLAGER'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Create Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    category VARCHAR(60) NOT NULL,
    location VARCHAR(200),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    worker_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    admin_instructions VARCHAR(2000),
    deadline TIMESTAMP,
    resolution_notes VARCHAR(2000),
    assigned_at TIMESTAMP,
    resolved_at TIMESTAMP,
    CONSTRAINT complaints_status_check CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'RESOLVED', 'CLOSED')),
    CONSTRAINT complaints_priority_check CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH'))
);

CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_worker_id ON complaints(worker_id);

-- 3. Create Work Assignments Table
CREATE TABLE IF NOT EXISTS work_assignments (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    worker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    instructions VARCHAR(2000),
    deadline TIMESTAMP,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED'
);

CREATE INDEX IF NOT EXISTS idx_work_assignments_complaint ON work_assignments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_work_assignments_worker ON work_assignments(worker_id);

-- 4. Create Work Reports (Progress Updates & Completion Reports) Table
CREATE TABLE IF NOT EXISTS work_reports (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    worker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(30) NOT NULL DEFAULT 'COMPLETION', -- 'PROGRESS' or 'COMPLETION'
    work_description VARCHAR(2000) NOT NULL,
    materials_used VARCHAR(1000),
    remarks VARCHAR(2000),
    proof_details VARCHAR(2000),
    review_decision VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    admin_comments VARCHAR(2000),
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_work_reports_complaint_id ON work_reports(complaint_id);
CREATE INDEX IF NOT EXISTS idx_work_reports_review_decision ON work_reports(review_decision);
CREATE INDEX IF NOT EXISTS idx_work_reports_worker_id ON work_reports(worker_id);

-- 5. Create Complaint Audit History Table
CREATE TABLE IF NOT EXISTS complaint_history (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    changed_by_name VARCHAR(100),
    remarks VARCHAR(2000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_complaint_history_complaint_id ON complaint_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_history_created_at ON complaint_history(created_at DESC);
