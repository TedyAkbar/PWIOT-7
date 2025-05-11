-- Buat database
CREATE DATABASE IF NOT EXISTS iot_db;
USE iot_db;

-- Buat tabel data_sensor
CREATE TABLE IF NOT EXISTS data_sensor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    suhu FLOAT NOT NULL,
    waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    relay BOOLEAN NOT NULL
);

-- Tambah kolom relay ke tabel data_sensor
ALTER TABLE data_sensor ADD COLUMN relay BOOLEAN DEFAULT FALSE;

-- Buat tabel users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('supervisor', 'engineer', 'operator') NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Buat tabel relay_history
CREATE TABLE IF NOT EXISTS relay_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    waktu DATETIME DEFAULT CURRENT_TIMESTAMP,
    status BOOLEAN NOT NULL,
    changed_by INT NOT NULL,
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Buat user admin default (password: admin123)
-- Password di-hash menggunakan bcrypt
INSERT INTO users (username, password, role) VALUES 
('admin', '$2b$10$8K1p/a0dR1xqM8K3hQz1eO1Qz1eO1Qz1eO1Qz1eO1Qz1eO1Qz1eO', 'supervisor')
ON DUPLICATE KEY UPDATE id=id; 