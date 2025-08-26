-- +goose Up
-- +goose StatementBegin

-- Update existing staff_schedule_templates to match our new requirements
-- Note: We'll keep the existing structure but add new columns
ALTER TABLE staff_schedule_templates ADD COLUMN description text;
ALTER TABLE staff_schedule_templates ADD COLUMN is_default boolean DEFAULT false;
ALTER TABLE staff_schedule_templates ADD COLUMN schedule_data jsonb; -- Store weekly schedule as JSON
ALTER TABLE staff_schedule_templates RENAME COLUMN template_name TO name;

-- Drop the old day-specific template approach since we're moving to weekly JSON structure
-- We'll handle this carefully to preserve existing data
-- First, let's add a new table for the comprehensive schedule templates

-- Enhanced Schedule Templates Table
CREATE TABLE schedule_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL,
    description text,
    is_default boolean DEFAULT false,
    schedule jsonb NOT NULL, -- Weekly schedule template as JSON
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    UNIQUE(staff_id, name)
);

-- Time Off Requests Table
CREATE TABLE time_off_requests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    start_date date NOT NULL,
    end_date date NOT NULL,
    type varchar(20) NOT NULL CHECK (type IN ('vacation', 'sick_leave', 'personal_day', 'emergency')),
    reason text NOT NULL,
    status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    is_half_day boolean DEFAULT false,
    half_day_type varchar(10) CHECK (half_day_type IN ('morning', 'afternoon')),
    requested_by uuid NOT NULL, -- ID of person who requested
    approved_by uuid, -- ID of person who approved/rejected
    comments text, -- Additional comments from approver
    requested_at timestamp NOT NULL DEFAULT now(),
    processed_at timestamp, -- When the request was approved/rejected
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

-- Recurring Schedule Patterns Table
CREATE TABLE recurring_schedule_patterns (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL,
    pattern_type varchar(20) NOT NULL CHECK (pattern_type IN ('daily', 'weekly', 'monthly')),
    recurrence_rule text, -- RRULE format for complex recurrence
    start_date date NOT NULL,
    end_date date, -- NULL means indefinite
    is_active boolean DEFAULT true,
    schedule jsonb NOT NULL, -- Weekly schedule pattern as JSON
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

-- Schedule Conflicts Table
CREATE TABLE schedule_conflicts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    type varchar(30) NOT NULL CHECK (type IN ('time_overlap', 'double_booking', 'time_off_conflict', 'unavailable_staff')),
    severity varchar(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description text NOT NULL,
    staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    conflict_date date NOT NULL,
    conflict_time time,
    related_shifts uuid[], -- Array of shift IDs involved in conflict
    metadata jsonb, -- Additional conflict information
    status varchar(10) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
    resolved_by uuid,
    resolved_at timestamp,
    created_at timestamp NOT NULL DEFAULT now()
);

-- Enhanced shift table with emergency shift support
ALTER TABLE staff_shifts ADD COLUMN IF NOT EXISTS shift_type varchar(20) DEFAULT 'regular' CHECK (shift_type IN ('regular', 'overtime', 'holiday', 'emergency'));

-- Update staff_shifts to ensure it has all required columns
ALTER TABLE staff_shifts ALTER COLUMN shift_type SET DEFAULT 'regular';

-- Schedule Generation Rules Table (for advanced scheduling logic)
CREATE TABLE schedule_generation_rules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    priority integer DEFAULT 0, -- Higher number = higher priority
    conditions jsonb NOT NULL, -- Conditions when this rule applies
    actions jsonb NOT NULL, -- Actions to take when conditions are met
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

-- Business Working Hours Integration
-- Add working hours template for businesses that can be used as default for staff
CREATE TABLE business_schedule_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name varchar(100) NOT NULL,
    description text,
    is_default boolean DEFAULT false,
    schedule jsonb NOT NULL, -- Weekly schedule template as JSON
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    UNIQUE(business_id, name)
);

-- Indexes for performance
CREATE INDEX idx_staff_shifts_staff_date ON staff_shifts(staff_id, shift_date);
CREATE INDEX idx_staff_shifts_date_range ON staff_shifts(shift_date, start_time, end_time);
CREATE INDEX idx_staff_shifts_availability ON staff_shifts(is_available, is_manually_disabled);
CREATE INDEX idx_time_off_requests_staff_dates ON time_off_requests(staff_id, start_date, end_date);
CREATE INDEX idx_time_off_requests_status ON time_off_requests(status, requested_at);
CREATE INDEX idx_schedule_conflicts_staff_date ON schedule_conflicts(staff_id, conflict_date);
CREATE INDEX idx_schedule_conflicts_status ON schedule_conflicts(status, created_at);
CREATE INDEX idx_schedule_templates_staff ON schedule_templates(staff_id, is_default);
CREATE INDEX idx_recurring_patterns_staff ON recurring_schedule_patterns(staff_id, is_active);
CREATE INDEX idx_availability_logs_staff_date ON staff_availability_logs(staff_id, changed_at);

-- Add constraints to ensure data integrity
ALTER TABLE schedule_templates ADD CONSTRAINT chk_one_default_per_staff 
    EXCLUDE (staff_id WITH =) WHERE (is_default = true);

ALTER TABLE business_schedule_templates ADD CONSTRAINT chk_one_default_per_business
    EXCLUDE (business_id WITH =) WHERE (is_default = true);

-- Ensure time off dates are logical
ALTER TABLE time_off_requests ADD CONSTRAINT chk_logical_dates 
    CHECK (end_date >= start_date);

-- Ensure shift times are logical  
ALTER TABLE staff_shifts ADD CONSTRAINT chk_logical_shift_times 
    CHECK (end_time > start_time);

-- Add trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER update_schedule_templates_updated_at 
    BEFORE UPDATE ON schedule_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_off_requests_updated_at 
    BEFORE UPDATE ON time_off_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_patterns_updated_at 
    BEFORE UPDATE ON recurring_schedule_patterns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_templates_updated_at 
    BEFORE UPDATE ON business_schedule_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Drop triggers
DROP TRIGGER IF EXISTS update_schedule_templates_updated_at ON schedule_templates;
DROP TRIGGER IF EXISTS update_time_off_requests_updated_at ON time_off_requests;
DROP TRIGGER IF EXISTS update_recurring_patterns_updated_at ON recurring_schedule_patterns;
DROP TRIGGER IF EXISTS update_business_templates_updated_at ON business_schedule_templates;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_staff_shifts_staff_date;
DROP INDEX IF EXISTS idx_staff_shifts_date_range;
DROP INDEX IF EXISTS idx_staff_shifts_availability;
DROP INDEX IF EXISTS idx_time_off_requests_staff_dates;
DROP INDEX IF EXISTS idx_time_off_requests_status;
DROP INDEX IF EXISTS idx_schedule_conflicts_staff_date;
DROP INDEX IF EXISTS idx_schedule_conflicts_status;
DROP INDEX IF EXISTS idx_schedule_templates_staff;
DROP INDEX IF EXISTS idx_recurring_patterns_staff;
DROP INDEX IF EXISTS idx_availability_logs_staff_date;

-- Drop new tables
DROP TABLE IF EXISTS business_schedule_templates;
DROP TABLE IF EXISTS schedule_generation_rules;
DROP TABLE IF EXISTS schedule_conflicts;
DROP TABLE IF EXISTS recurring_schedule_patterns;
DROP TABLE IF EXISTS time_off_requests;
DROP TABLE IF EXISTS schedule_templates;

-- Revert changes to existing tables
ALTER TABLE staff_shifts DROP CONSTRAINT IF EXISTS chk_logical_shift_times;
ALTER TABLE staff_schedule_templates DROP CONSTRAINT IF EXISTS chk_one_default_per_staff;
ALTER TABLE staff_schedule_templates DROP COLUMN IF EXISTS schedule_data;
ALTER TABLE staff_schedule_templates DROP COLUMN IF EXISTS is_default;
ALTER TABLE staff_schedule_templates DROP COLUMN IF EXISTS description;
ALTER TABLE staff_schedule_templates RENAME COLUMN name TO template_name;

-- +goose StatementEnd