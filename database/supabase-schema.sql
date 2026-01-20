-- Supabase Database Schema for Smart Glass AI Medical System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (stores user credentials and basic info)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50), -- Added phone number for users
    age INTEGER,
    gender VARCHAR(20),
    nationality VARCHAR(100),
    id_number VARCHAR(100),
    face_encoding TEXT, -- Store face encoding as JSON string
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- User role: 'user', 'doctor', 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical info table
CREATE TABLE medical_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    health_history TEXT,
    chronic_conditions TEXT,
    allergies TEXT,
    current_medications TEXT,
    previous_surgeries TEXT,
    emergency_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Relatives/Connections table (for external contacts)
CREATE TABLE relatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relation VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    is_external BOOLEAN NOT NULL DEFAULT TRUE, -- TRUE for external contacts not in the system
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User connections table (for linked connections between registered users)
CREATE TABLE user_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connected_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_connection UNIQUE(user_id, connected_user_id),
    CONSTRAINT no_self_connection CHECK (user_id != connected_user_id)
);

-- Connection requests table (for request-based linked connections)
CREATE TABLE connection_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_request UNIQUE(sender_id, receiver_id),
    CONSTRAINT no_self_request CHECK (sender_id != receiver_id)
);

-- Face images table (for multiple face angles)
CREATE TABLE face_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(50) NOT NULL, -- 'front', 'left', 'right', 'up', 'down'
    face_encoding TEXT, -- Store individual encoding for this angle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_name ON users(name); -- For user search functionality
CREATE INDEX idx_medical_info_user_id ON medical_info(user_id);
CREATE INDEX idx_relatives_user_id ON relatives(user_id);
CREATE INDEX idx_face_images_user_id ON face_images(user_id);
CREATE INDEX idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX idx_user_connections_connected_user_id ON user_connections(connected_user_id);
CREATE INDEX idx_user_connections_relationship ON user_connections(relationship);
CREATE INDEX idx_connection_requests_sender_id ON connection_requests(sender_id);
CREATE INDEX idx_connection_requests_receiver_id ON connection_requests(receiver_id);
CREATE INDEX idx_connection_requests_status ON connection_requests(status);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Medical info policies
CREATE POLICY "Users can view own medical info" ON medical_info
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own medical info" ON medical_info
    FOR ALL USING (auth.uid() = user_id);

-- Relatives policies
CREATE POLICY "Users can manage own relatives" ON relatives
    FOR ALL USING (auth.uid() = user_id);

-- Face images policies
CREATE POLICY "Users can manage own face images" ON face_images
    FOR ALL USING (auth.uid() = user_id);

-- User connections policies
CREATE POLICY "Users can view own connections" ON user_connections
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can create own connections" ON user_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" ON user_connections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections" ON user_connections
    FOR DELETE USING (auth.uid() = user_id);

-- Connection requests policies
CREATE POLICY "Users can view own connection requests" ON connection_requests
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create connection requests" ON connection_requests
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own connection requests" ON connection_requests
    FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can delete own connection requests" ON connection_requests
    FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_info_updated_at BEFORE UPDATE ON medical_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relatives_updated_at BEFORE UPDATE ON relatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_connections_updated_at BEFORE UPDATE ON user_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connection_requests_updated_at BEFORE UPDATE ON connection_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
