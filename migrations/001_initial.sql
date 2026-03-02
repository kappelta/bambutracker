CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    tracking_mode VARCHAR(10) NOT NULL DEFAULT 'percent',
    low_threshold INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS filaments (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(255) NOT NULL,
    material VARCHAR(50) NOT NULL DEFAULT 'PLA',
    color VARCHAR(100) NOT NULL,
    color_hex VARCHAR(7) DEFAULT '#F97316',
    remaining INTEGER NOT NULL DEFAULT 100,
    total_weight INTEGER NOT NULL DEFAULT 1000,
    status VARCHAR(20) NOT NULL DEFAULT 'sealed',
    location VARCHAR(255),
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
