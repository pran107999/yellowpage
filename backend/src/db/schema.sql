-- Yellow Pages Database Schema

-- Create tables if not exists
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  email_verified_at TIMESTAMP,
  email_verification_token VARCHAR(255),
  email_verification_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, state)
);

CREATE TABLE IF NOT EXISTS classifieds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  visibility VARCHAR(50) DEFAULT 'all_cities' CHECK (visibility IN ('all_cities', 'selected_cities')),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classified_cities (
  classified_id UUID REFERENCES classifieds(id) ON DELETE CASCADE,
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  PRIMARY KEY (classified_id, city_id)
);

CREATE INDEX IF NOT EXISTS idx_classifieds_user_id ON classifieds(user_id);
CREATE INDEX IF NOT EXISTS idx_classifieds_status ON classifieds(status);
CREATE INDEX IF NOT EXISTS idx_classifieds_category ON classifieds(category);
CREATE INDEX IF NOT EXISTS idx_classifieds_created_at ON classifieds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classified_cities_classified_id ON classified_cities(classified_id);
CREATE INDEX IF NOT EXISTS idx_classified_cities_city_id ON classified_cities(city_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
