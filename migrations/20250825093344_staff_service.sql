-- +goose Up
-- +goose StatementBegin
Create Table staff_services (
    id uuid primary key default uuid_generate_v4(),
    staff_id uuid not null references staff(id) on delete cascade,
    service_id uuid not null references services(id) on delete cascade,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    UNIQUE(staff_id, service_id)
);

ALTER TABLE staff RENAME COLUMN full_name  TO first_name;
Alter Table staff ADD COLUMN last_name  text;
ALTER TABLE staff ADD COLUMN phone varchar(20);
ALTER TABLE staff ADD COLUMN gender varchar(10) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
ALTER TABLE staff ADD COLUMN position varchar(255);
ALTER TABLE staff ADD COLUMN description text;
ALTER TABLE staff ADD COLUMN specialization varchar(100);
ALTER TABLE staff ADD COLUMN is_active boolean DEFAULT true;


-- Таблица для плавающего графика персонала
-- Каждая запись представляет рабочую смену в конкретный день
CREATE TABLE staff_shifts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    shift_date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    break_start_time time,
    break_end_time time,
    is_available boolean DEFAULT true, -- общая доступность смены
    is_manually_disabled boolean DEFAULT false, -- ручное отключение администратором
    manual_disable_reason text, -- причина ручного отключения
    shift_type varchar(20) DEFAULT 'regular', -- 'regular', 'overtime', 'holiday'
    notes text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    created_by uuid, -- кто создал смену (staff_id или admin_id)
    updated_by uuid, -- кто последний раз обновлял
    UNIQUE(staff_id, shift_date, start_time)
);

-- Таблица для шаблонов расписания (опционально для упрощения создания смен)
CREATE TABLE staff_schedule_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    template_name varchar(100) NOT NULL,
    day_of_week integer NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7), -- 1=Monday, 7=Sunday
    start_time time NOT NULL,
    end_time time NOT NULL,
    break_start_time time,
    break_end_time time,
    is_active boolean DEFAULT true,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);


CREATE TABLE staff_availability_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    shift_id uuid REFERENCES staff_shifts(id) ON DELETE CASCADE,
    action varchar(50) NOT NULL, -- 'enabled', 'disabled', 'shift_created', 'shift_deleted', 'shift_modified'
    previous_status boolean, -- предыдущий статус доступности
    new_status boolean, -- новый статус доступности
    reason text, -- причина изменения
    changed_by uuid NOT NULL, -- ID пользователя, который внёс изменения
    changed_at timestamp NOT NULL DEFAULT now(),
    metadata jsonb -- дополнительная информация (например, IP адрес, user agent)
);


-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table staff_availability_logs;
drop table staff_schedule_templates;
drop table staff_shifts;
drop table staff_services;
ALTER TABLE staff DROP COLUMN description;
ALTER TABLE staff DROP COLUMN specialization;
ALTER TABLE staff DROP COLUMN is_active;
ALTER TABLE staff DROP COLUMN position;
ALTER TABLE staff DROP COLUMN gender;
ALTER TABLE staff DROP COLUMN phone;
ALTER TABLE staff DROP COLUMN last_name;
ALTER TABLE staff RENAME COLUMN first_name TO full_name;
-- +goose StatementEnd
