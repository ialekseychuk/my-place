-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
create table businesses(
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    timezone text not null default 'UTC',
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create table services(
    id uuid primary key default uuid_generate_v4(),
    business_id uuid not null references businesses(id) on delete cascade,
    name text not null,
    duration_min int not null check(duration_min > 0),
    price_cents int not null check(price_cents > 0),
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create table staff (
    id uuid primary key default uuid_generate_v4(),
    business_id uuid not null references businesses(id) on delete cascade,
    full_name text not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);


create table bookings (
    id uuid primary key default uuid_generate_v4(),
    -- business_id uuid not null references businesses(id) on delete cascade,
    staff_id uuid not null references staff(id) on delete cascade,
    service_id uuid not null references services(id) on delete cascade,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    start_at timestamp not null,
    end_at timestamp not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);


CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_businesses_updated
    BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_services_updated
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_staff_updated
    BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS businesses;
DROP FUNCTION IF EXISTS set_updated_at();
DROP EXTENSION IF EXISTS "uuid-ossp";
-- +goose StatementEnd
