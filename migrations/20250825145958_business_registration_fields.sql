-- +goose Up
-- +goose StatementBegin

-- Extend businesses table with new fields
ALTER TABLE businesses 
ADD COLUMN business_type TEXT,
ADD COLUMN description TEXT,
ADD COLUMN address TEXT,
ADD COLUMN city TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN email TEXT,
ADD COLUMN website TEXT,
ADD COLUMN currency TEXT DEFAULT 'USD',
ADD COLUMN enable_online_booking BOOLEAN DEFAULT true,
ADD COLUMN enable_sms_notifications BOOLEAN DEFAULT true,
ADD COLUMN enable_email_notifications BOOLEAN DEFAULT true;

-- Create users table for business owners and staff
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'staff')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create business working hours table
CREATE TABLE business_working_hours (
    id TEXT PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(business_id, day_of_week)
);

-- Add indexes for performance
CREATE INDEX idx_users_business_id ON users(business_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_business_working_hours_business_id ON business_working_hours(business_id);

-- Add triggers for updated_at
CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_business_working_hours_updated
    BEFORE UPDATE ON business_working_hours
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Drop triggers
DROP TRIGGER IF EXISTS trg_users_updated ON users;
DROP TRIGGER IF EXISTS trg_business_working_hours_updated ON business_working_hours;

-- Drop indexes
DROP INDEX IF EXISTS idx_users_business_id;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_business_working_hours_business_id;

-- Drop tables
DROP TABLE IF EXISTS business_working_hours;
DROP TABLE IF EXISTS users;

-- Remove added columns from businesses table
ALTER TABLE businesses 
DROP COLUMN IF EXISTS business_type,
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS website,
DROP COLUMN IF EXISTS currency,
DROP COLUMN IF EXISTS enable_online_booking,
DROP COLUMN IF EXISTS enable_sms_notifications,
DROP COLUMN IF EXISTS enable_email_notifications;

-- +goose StatementEnd