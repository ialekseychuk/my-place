-- +goose Up
-- +goose StatementBegin

-- Add location_id column to staff table
ALTER TABLE staff ADD COLUMN location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

-- Add location_id column to services table
ALTER TABLE services ADD COLUMN location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

-- Add location_id column to bookings table
ALTER TABLE bookings ADD COLUMN location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_staff_location_id ON staff(location_id);
CREATE INDEX idx_services_location_id ON services(location_id);
CREATE INDEX idx_bookings_location_id ON bookings(location_id);

-- Update existing records to set location_id based on business_id
-- For each business, we'll assign the first location (if exists) to existing records
-- This is a temporary solution until we implement proper location assignment

-- Update staff records
UPDATE staff 
SET location_id = (
    SELECT id 
    FROM locations 
    WHERE business_id = staff.business_id 
    LIMIT 1
)
WHERE location_id IS NULL;

-- Update services records
UPDATE services 
SET location_id = (
    SELECT id 
    FROM locations 
    WHERE business_id = services.business_id 
    LIMIT 1
)
WHERE location_id IS NULL;

-- Update bookings records
UPDATE bookings 
SET location_id = (
    SELECT location_id 
    FROM staff 
    WHERE id = bookings.staff_id
)
WHERE location_id IS NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Remove indexes
DROP INDEX IF EXISTS idx_bookings_location_id;
DROP INDEX IF EXISTS idx_services_location_id;
DROP INDEX IF EXISTS idx_staff_location_id;

-- Remove location_id column from bookings table
ALTER TABLE bookings DROP COLUMN location_id;

-- Remove location_id column from services table
ALTER TABLE services DROP COLUMN location_id;

-- Remove location_id column from staff table
ALTER TABLE staff DROP COLUMN location_id;

-- +goose StatementEnd