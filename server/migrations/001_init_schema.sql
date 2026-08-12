-- Database creation/selection is handled by migrations/run.js using DB_NAME from .env.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','volunteer','manager','donor') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS families (
  id INT AUTO_INCREMENT PRIMARY KEY,
  head_of_family_id INT NULL,
  secondary_contact_id INT NULL,
  family_size INT NOT NULL DEFAULT 1,
  registered_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registered_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS refugees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  age INT NOT NULL,
  gender ENUM('male','female','other') NOT NULL,
  relationship_to_head ENUM('self','spouse','child','parent','sibling','other') NOT NULL,
  phone_number VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id)
);

ALTER TABLE families
  ADD CONSTRAINT fk_families_head FOREIGN KEY (head_of_family_id) REFERENCES refugees(id),
  ADD CONSTRAINT fk_families_secondary FOREIGN KEY (secondary_contact_id) REFERENCES refugees(id);

CREATE TABLE IF NOT EXISTS inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity_available INT NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resource_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  requested_by INT NOT NULL,
  item_id INT NOT NULL,
  quantity_requested INT NOT NULL,
  status ENUM('pending','manager_approved','donor_approved','rejected','distributed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (item_id) REFERENCES inventory_items(id)
);

CREATE TABLE IF NOT EXISTS distribution_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  family_id INT NOT NULL,
  distributed_by INT NOT NULL,
  distributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  collected_by_id INT NOT NULL,
  FOREIGN KEY (request_id) REFERENCES resource_requests(id),
  FOREIGN KEY (family_id) REFERENCES families(id),
  FOREIGN KEY (distributed_by) REFERENCES users(id),
  FOREIGN KEY (collected_by_id) REFERENCES refugees(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_id INT NOT NULL,
  channel ENUM('sms','voucher') NOT NULL,
  message TEXT NOT NULL,
  status ENUM('sent','failed','logged') NOT NULL,
  external_response TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id)
);
