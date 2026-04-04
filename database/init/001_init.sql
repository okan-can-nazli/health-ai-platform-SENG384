CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('engineer', 'healthcare_professional', 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_status') THEN
        CREATE TYPE post_status AS ENUM ('draft', 'active', 'meeting_scheduled', 'partner_found', 'expired');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'interest_received',
            'meeting_request',
            'meeting_confirmed',
            'post_status_changed',
            'account_activity',
            'system'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    institution VARCHAR(255),
    expertise TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    profile_completeness INTEGER NOT NULL DEFAULT 0 CHECK (profile_completeness >= 0 AND profile_completeness <= 100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_token VARCHAR(255) NOT NULL UNIQUE,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role VARCHAR(100),
    action_type VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100),
    result_status VARCHAR(50) NOT NULL,
    ip_address VARCHAR(100),
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    expertise_required VARCHAR(255) NOT NULL,
    working_domain VARCHAR(255) NOT NULL,
    short_explanation TEXT NOT NULL,
    desired_technical_expertise TEXT,
    needed_healthcare_expertise TEXT,
    high_level_idea TEXT,
    level_of_commitment_required VARCHAR(255) NOT NULL,
    estimated_collaboration_type VARCHAR(100),
    confidentiality_level VARCHAR(100) NOT NULL,
    expiry_date DATE,
    auto_close BOOLEAN NOT NULL DEFAULT FALSE,
    project_stage VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    status post_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_city ON posts(city);
CREATE INDEX IF NOT EXISTS idx_posts_country ON posts(country);
CREATE INDEX IF NOT EXISTS idx_posts_working_domain ON posts(working_domain);
CREATE INDEX IF NOT EXISTS idx_posts_project_stage ON posts(project_stage);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_request_status') THEN
        CREATE TYPE meeting_request_status AS ENUM (
            'pending',
            'accepted',
            'declined',
            'cancelled',
            'scheduled',
            'completed'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS nda_acceptances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    accepted_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accepted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (post_id, accepted_by_user_id)
);

CREATE TABLE IF NOT EXISTS meeting_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_message TEXT,
    proposed_time_slots TEXT NOT NULL,
    selected_time_slot TEXT,
    status meeting_request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nda_acceptances_post_id ON nda_acceptances(post_id);
CREATE INDEX IF NOT EXISTS idx_nda_acceptances_user_id ON nda_acceptances(accepted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_post_id ON meeting_requests(post_id);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_requester_id ON meeting_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_post_owner_id ON meeting_requests(post_owner_id);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_status ON meeting_requests(status);

INSERT INTO users (
    full_name,
    email,
    password_hash,
    role,
    institution,
    expertise,
    city,
    country,
    is_email_verified,
    is_active,
    profile_completeness
)
VALUES (
    'System Admin',
    'admin@healthai.edu.tr',
    '$2b$10$HDc4odGOrcy2bxS0ZEKo/exM4llJXdnP03TXL5cyNajJ299GPLc9K',
    'admin',
    'HEALTH AI',
    'Platform Administration',
    'Ankara',
    'Turkey',
    TRUE,
    TRUE,
    100
)
ON CONFLICT (email) DO NOTHING;
