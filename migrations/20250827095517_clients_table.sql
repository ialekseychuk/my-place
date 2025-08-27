-- +goose Up
-- +goose StatementBegin
CREATE TABLE clients (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);
ALTER TABLE bookings DROP COLUMN customer_name;
ALTER TABLE bookings DROP COLUMN customer_email;
ALTER TABLE bookings ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE CASCADE;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE bookings DROP COLUMN client_id;
ALTER TABLE bookings ADD COLUMN customer_name TEXT NOT NULL DEFAULT '';
ALTER TABLE bookings ADD COLUMN customer_email TEXT NOT NULL DEFAULT '';

DROP TABLE IF EXISTS clients;
-- +goose StatementEnd
