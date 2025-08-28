-- +goose Up
-- +goose StatementBegin
CREATE TABLE locations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    contact_info TEXT,
    timezone TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS locations;
-- +goose StatementEnd
