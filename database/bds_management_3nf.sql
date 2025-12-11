-- =====================================================
-- DATABASE: bds_management_3nf
-- Cơ sở dữ liệu chuẩn 3NF cho hệ thống BatDongSanVIP
-- Đã bổ sung các bảng cho chức năng: Bình luận, Avatar, Đặt lịch
-- =====================================================

CREATE DATABASE IF NOT EXISTS bds_management_3nf
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bds_management_3nf;

-- ================= KHỐI ĐỊA LÝ & DANH MỤC (LOOKUP TABLES) =================

-- Bảng Tỉnh/Thành phố
CREATE TABLE cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Bảng Quận/Huyện (Phụ thuộc vào City)
CREATE TABLE districts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  CONSTRAINT fk_districts_city FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- Bảng Danh sách Tiện ích (Ví dụ: Wifi, Hồ bơi, Garage...)
CREATE TABLE amenities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- Bảng Loại Bất động sản (Nhà phố, Chung cư, Đất nền...)
CREATE TABLE property_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- ★ [MỚI] Bảng Loại giao dịch (Bán / Cho thuê)
CREATE TABLE listing_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,  -- 'sale', 'rent'
  name VARCHAR(100) NOT NULL         -- 'Nhà đất bán', 'Nhà đất cho thuê'
);

-- ================= KHỐI NGƯỜI DÙNG =================

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),                    -- ★ [MỚI] Đường dẫn ảnh đại diện
  role ENUM('admin','owner','agent','customer') NOT NULL DEFAULT 'customer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================= KHỐI BẤT ĐỘNG SẢN (CORE) =================

CREATE TABLE properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  type_id INT NOT NULL,           -- FK -> property_types
  district_id INT NOT NULL,       -- FK -> districts
  listing_type_id INT NOT NULL,   -- ★ [MỚI] FK -> listing_types (Bán/Thuê)
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(15,2) NOT NULL,
  area DECIMAL(10,2) NOT NULL,
  address VARCHAR(255) NOT NULL,
  
  bedrooms INT NOT NULL DEFAULT 0,
  bathrooms INT NOT NULL DEFAULT 0,
  direction ENUM('Dong', 'Tay', 'Nam', 'Bac', 'Dong Nam', 'Dong Bac', 'Tay Nam', 'Tay Bac'),
  legal_status VARCHAR(100),
  status ENUM('available','pending','sold','rented','draft') NOT NULL DEFAULT 'draft',
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_properties_owner FOREIGN KEY (owner_id) REFERENCES users(id),
  CONSTRAINT fk_properties_district FOREIGN KEY (district_id) REFERENCES districts(id),
  CONSTRAINT fk_properties_type FOREIGN KEY (type_id) REFERENCES property_types(id),
  CONSTRAINT fk_properties_listing_type FOREIGN KEY (listing_type_id) REFERENCES listing_types(id)
);

-- ================= KHỐI CHI TIẾT BĐS =================

-- Bảng Ảnh (Quan hệ 1-Nhiều với Properties)
CREATE TABLE property_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  is_thumbnail TINYINT(1) DEFAULT 0,
  CONSTRAINT fk_images_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Bảng Tiện ích của BĐS (Quan hệ Nhiều-Nhiều)
CREATE TABLE property_amenities (
  property_id INT NOT NULL,
  amenity_id INT NOT NULL,
  PRIMARY KEY (property_id, amenity_id),
  CONSTRAINT fk_pa_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_pa_amenity FOREIGN KEY (amenity_id) REFERENCES amenities(id)
);

-- ================= KHỐI TIN ĐĂNG & GIAO DỊCH =================

CREATE TABLE listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  user_id INT NOT NULL,
  
  title VARCHAR(255),
  status ENUM('draft','published','expired','hidden') NOT NULL DEFAULT 'draft',
  views INT NOT NULL DEFAULT 0,
  
  published_at DATETIME,
  expired_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_listings_property FOREIGN KEY (property_id) REFERENCES properties(id),
  CONSTRAINT fk_listings_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ★ [MỚI] Bảng Bình luận
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_comments_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng Đặt lịch hẹn (Đã cập nhật thêm fields cho form đặt lịch)
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  customer_id INT,                          -- NULL nếu khách vãng lai
  
  full_name VARCHAR(255) NOT NULL,          -- ★ [MỚI] Họ tên người đặt
  phone VARCHAR(50) NOT NULL,               -- ★ [MỚI] Số điện thoại Zalo
  scheduled_at DATE NOT NULL,               -- Ngày hẹn
  message TEXT,                             -- ★ [MỚI] Lời nhắn
  
  status ENUM('pending','confirmed','rejected','completed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_appointments_listing FOREIGN KEY (listing_id) REFERENCES listings(id),
  CONSTRAINT fk_appointments_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  customer_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status ENUM('in_progress','completed','cancelled') NOT NULL DEFAULT 'in_progress',
  contract_url VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_transactions_listing FOREIGN KEY (listing_id) REFERENCES listings(id),
  CONSTRAINT fk_transactions_customer FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- ================= DỮ LIỆU KHỞI TẠO =================

-- Loại giao dịch
INSERT INTO listing_types (code, name) VALUES 
('sale', 'Nhà đất bán'),
('rent', 'Nhà đất cho thuê');

-- Loại bất động sản
INSERT INTO property_types (name) VALUES 
('Nhà phố'),
('Chung cư'),
('Đất nền'),
('Biệt thự'),
('Nhà mặt tiền'),
('Phòng trọ');

-- Tiện ích
INSERT INTO amenities (name) VALUES 
('Wifi'),
('Điều hòa'),
('Hồ bơi'),
('Phòng gym'),
('Bãi đỗ xe'),
('An ninh 24/7'),
('Thang máy'),
('Ban công');

-- Thành phố
INSERT INTO cities (name) VALUES 
('Hà Nội'),
('TP. Hồ Chí Minh'),
('Đà Nẵng'),
('Cần Thơ'),
('Hải Phòng');

-- Quận/Huyện mẫu (TP.HCM - id=2)
INSERT INTO districts (city_id, name) VALUES 
(2, 'Quận 1'),
(2, 'Quận 3'),
(2, 'Quận 7'),
(2, 'Bình Thạnh'),
(2, 'Thủ Đức');

-- Admin account (password: admin123)
INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
('admin@bdsvip.com', '$2b$10$5XGdcz1m9R.OKMIXp8g0IuDm.qM/JLcWqYPdNDHF/OaBx7zfZsJqm', 'Administrator', '0901234567', 'admin');

-- ================= INDEXES =================

CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_district ON properties(district_id);
CREATE INDEX idx_properties_type ON properties(type_id);
CREATE INDEX idx_properties_listing_type ON properties(listing_type_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_price ON properties(price);

CREATE INDEX idx_listings_property ON listings(property_id);
CREATE INDEX idx_listings_status ON listings(status);

CREATE INDEX idx_comments_listing ON comments(listing_id);
CREATE INDEX idx_comments_user ON comments(user_id);

CREATE INDEX idx_appointments_listing ON appointments(listing_id);
CREATE INDEX idx_appointments_date ON appointments(scheduled_at);
