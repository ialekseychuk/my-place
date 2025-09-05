-- +goose Up
-- +goose StatementBegin
CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);
ALTER TABLE services ADD COLUMN category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL;
ALTER TABLE services ADD COLUMN order_index INT NOT NULL DEFAULT 0;

CREATE INDEX idx_service_categories_business_id ON service_categories(business_id);
CREATE INDEX idx_services_category_id ON services(category_id);
CREATE INDEX idx_services_order_index ON services(order_index);
CREATE INDEX idx_service_categories_order_index ON service_categories(order_index);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX idx_service_categories_business_id;
DROP INDEX idx_services_category_id;
DROP INDEX idx_services_order_index;
DROP INDEX idx_service_categories_order_index;


ALTER TABLE services DROP COLUMN order_index;
ALTER TABLE services DROP COLUMN category_id;
DROP TABLE service_categories;
-- +goose StatementEnd
