CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  guid VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  location VARCHAR(255),
  manufacturer VARCHAR(255),
  installation_date DATE,
  maintenance_interval_days INTEGER DEFAULT 90,
  last_maintenance_date DATE,
  status VARCHAR(50) DEFAULT 'healthy',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_orders (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER REFERENCES assets(id),
  title VARCHAR(255),
  description TEXT,
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);