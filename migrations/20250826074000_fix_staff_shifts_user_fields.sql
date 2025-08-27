-- +goose Up
-- +goose StatementBegin

-- Fix staff_shifts table to use TEXT for user ID fields instead of UUID
-- This aligns with the user table where id is TEXT (hex string)
ALTER TABLE staff_shifts ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE staff_shifts ALTER COLUMN updated_by TYPE TEXT;

-- Also fix staff_availability_logs table which has the same issue
ALTER TABLE staff_availability_logs ALTER COLUMN changed_by TYPE TEXT;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Revert back to UUID type
ALTER TABLE staff_shifts ALTER COLUMN created_by TYPE UUID USING created_by::UUID;
ALTER TABLE staff_shifts ALTER COLUMN updated_by TYPE UUID USING updated_by::UUID;
ALTER TABLE staff_availability_logs ALTER COLUMN changed_by TYPE UUID USING changed_by::UUID;

-- +goose StatementEnd