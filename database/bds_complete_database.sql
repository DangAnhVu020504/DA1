-- =====================================================
-- DATABASE: bds_management_3nf (COMPLETE VERSION)
-- Cơ sở dữ liệu hoàn chỉnh cho hệ thống BatDongSanVIP
-- Bao gồm: 
--   - Cấu trúc 3NF đầy đủ
--   - Bảng Favorites (Yêu thích)
--   - Cột Address cho Users
--   - Dữ liệu khởi tạo Quận/Huyện
-- Ngày tạo: 2024-12-24
-- =====================================================

CREATE DATABASE IF NOT EXISTS bds_management_3nf
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bds_management_3nf;

-- =====================================================
-- PHẦN 1: KHỐI ĐỊA LÝ & DANH MỤC (LOOKUP TABLES)
-- =====================================================

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

-- Bảng Loại giao dịch (Bán / Cho thuê)
CREATE TABLE listing_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,  -- 'sale', 'rent'
  name VARCHAR(100) NOT NULL         -- 'Nhà đất bán', 'Nhà đất cho thuê'
);

-- =====================================================
-- PHẦN 2: KHỐI NGƯỜI DÙNG
-- =====================================================

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),                    -- Đường dẫn ảnh đại diện
  address VARCHAR(500),                   -- Địa chỉ người dùng
  role ENUM('admin','owner','agent','customer') NOT NULL DEFAULT 'customer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- PHẦN 3: KHỐI BẤT ĐỘNG SẢN (CORE)
-- =====================================================

CREATE TABLE properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  type_id INT NOT NULL,           -- FK -> property_types
  district_id INT NOT NULL,       -- FK -> districts
  listing_type_id INT NOT NULL,   -- FK -> listing_types (Bán/Thuê)
  
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

-- =====================================================
-- PHẦN 4: KHỐI CHI TIẾT BĐS
-- =====================================================

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

-- =====================================================
-- PHẦN 5: KHỐI TIN ĐĂNG & GIAO DỊCH
-- =====================================================

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

-- Bảng Bình luận
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_comments_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng Đặt lịch hẹn
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  customer_id INT,                          -- NULL nếu khách vãng lai
  
  full_name VARCHAR(255) NOT NULL,          -- Họ tên người đặt
  phone VARCHAR(50) NOT NULL,               -- Số điện thoại Zalo
  scheduled_at DATE NOT NULL,               -- Ngày hẹn
  message TEXT,                             -- Lời nhắn
  
  status ENUM('pending','confirmed','rejected','completed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_appointments_listing FOREIGN KEY (listing_id) REFERENCES listings(id),
  CONSTRAINT fk_appointments_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Bảng Giao dịch
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

-- =====================================================
-- PHẦN 6: BẢNG YÊU THÍCH (FAVORITES)
-- =====================================================

CREATE TABLE favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Mỗi user chỉ có thể yêu thích 1 BĐS 1 lần
  UNIQUE KEY unique_favorite (user_id, property_id),
  
  -- Foreign keys
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- =====================================================
-- PHẦN 7: DỮ LIỆU KHỞI TẠO
-- =====================================================

-- 7.1 Loại giao dịch
INSERT INTO listing_types (code, name) VALUES 
('sale', 'Nhà đất bán'),
('rent', 'Nhà đất cho thuê');

-- 7.2 Loại bất động sản
INSERT INTO property_types (name) VALUES 
('Nhà phố'),
('Chung cư'),
('Đất nền'),
('Biệt thự'),
('Nhà mặt tiền'),
('Phòng trọ');

-- 7.3 Tiện ích
INSERT INTO amenities (name) VALUES 
('Wifi'),
('Điều hòa'),
('Hồ bơi'),
('Phòng gym'),
('Bãi đỗ xe'),
('An ninh 24/7'),
('Thang máy'),
('Ban công');

-- 7.4 Thành phố
INSERT INTO cities (name) VALUES 
('Hà Nội'),
('TP. Hồ Chí Minh'),
('Đà Nẵng'),
('Cần Thơ'),
('Hải Phòng');

-- 7.5 Quận/Huyện - TP.HCM (id = 2)
INSERT INTO districts (city_id, name) VALUES 
(2, 'Quận 1'),
(2, 'Quận 3'),
(2, 'Quận 7'),
(2, 'Bình Thạnh'),
(2, 'Thủ Đức');

-- 7.6 Quận/Huyện - HÀ NỘI (id = 1)
INSERT INTO districts (city_id, name) VALUES 
(1, 'Quận Ba Đình'),
(1, 'Quận Hoàn Kiếm'),
(1, 'Quận Đống Đa'),
(1, 'Quận Hai Bà Trưng'),
(1, 'Quận Thanh Xuân'),
(1, 'Quận Cầu Giấy'),
(1, 'Quận Hoàng Mai'),
(1, 'Quận Long Biên'),
(1, 'Quận Tây Hồ'),
(1, 'Quận Bắc Từ Liêm'),
(1, 'Quận Nam Từ Liêm'),
(1, 'Quận Hà Đông'),
(1, 'Huyện Đông Anh'),
(1, 'Huyện Gia Lâm'),
(1, 'Huyện Thanh Trì'),
(1, 'Huyện Hoài Đức'),
(1, 'Huyện Thường Tín'),
(1, 'Huyện Đan Phượng'),
(1, 'Huyện Sóc Sơn'),
(1, 'Thị xã Sơn Tây');

-- 7.7 Quận/Huyện - ĐÀ NẴNG (id = 3)
INSERT INTO districts (city_id, name) VALUES 
(3, 'Quận Hải Châu'),
(3, 'Quận Thanh Khê'),
(3, 'Quận Sơn Trà'),
(3, 'Quận Ngũ Hành Sơn'),
(3, 'Quận Liên Chiểu'),
(3, 'Quận Cẩm Lệ'),
(3, 'Huyện Hòa Vang'),
(3, 'Huyện Hoàng Sa');

-- 7.8 Quận/Huyện - CẦN THƠ (id = 4)
INSERT INTO districts (city_id, name) VALUES 
(4, 'Quận Ninh Kiều'),
(4, 'Quận Cái Răng'),
(4, 'Quận Bình Thủy'),
(4, 'Quận Ô Môn'),
(4, 'Quận Thốt Nốt'),
(4, 'Huyện Phong Điền'),
(4, 'Huyện Cờ Đỏ'),
(4, 'Huyện Vĩnh Thạnh'),
(4, 'Huyện Thới Lai');

-- 7.9 Quận/Huyện - HẢI PHÒNG (id = 5)
INSERT INTO districts (city_id, name) VALUES 
(5, 'Quận Hồng Bàng'),
(5, 'Quận Ngô Quyền'),
(5, 'Quận Lê Chân'),
(5, 'Quận Hải An'),
(5, 'Quận Kiến An'),
(5, 'Quận Đồ Sơn'),
(5, 'Quận Dương Kinh'),
(5, 'Huyện Thủy Nguyên'),
(5, 'Huyện An Dương'),
(5, 'Huyện An Lão'),
(5, 'Huyện Kiến Thụy'),
(5, 'Huyện Tiên Lãng'),
(5, 'Huyện Vĩnh Bảo'),
(5, 'Huyện Cát Hải'),
(5, 'Huyện Bạch Long Vĩ');

-- 7.10 Admin account (password: admin123)
INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
('admin@bdsvip.com', '$2b$10$5XGdcz1m9R.OKMIXp8g0IuDm.qM/JLcWqYPdNDHF/OaBx7zfZsJqm', 'Administrator', '0901234567', 'admin');

-- =====================================================
-- PHẦN 8: INDEXES (Tối ưu hiệu suất truy vấn)
-- =====================================================

-- Indexes cho bảng properties
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_district ON properties(district_id);
CREATE INDEX idx_properties_type ON properties(type_id);
CREATE INDEX idx_properties_listing_type ON properties(listing_type_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_price ON properties(price);

-- Indexes cho bảng listings
CREATE INDEX idx_listings_property ON listings(property_id);
CREATE INDEX idx_listings_status ON listings(status);

-- Indexes cho bảng comments
CREATE INDEX idx_comments_listing ON comments(listing_id);
CREATE INDEX idx_comments_user ON comments(user_id);

-- Indexes cho bảng appointments
CREATE INDEX idx_appointments_listing ON appointments(listing_id);
CREATE INDEX idx_appointments_date ON appointments(scheduled_at);

-- Indexes cho bảng favorites
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_property ON favorites(property_id);

-- =====================================================
-- PHẦN 9: KIỂM TRA DỮ LIỆU
-- =====================================================

-- Xem tổng số quận/huyện theo từng thành phố
SELECT c.name AS 'Thành phố', COUNT(d.id) AS 'Số quận/huyện'
FROM cities c
LEFT JOIN districts d ON c.id = d.city_id
GROUP BY c.id, c.name
ORDER BY c.id;

-- =====================================================
-- TỔNG KẾT CẤU TRÚC DATABASE
-- =====================================================
-- 
-- BẢNG LOOKUP (Tra cứu):
-- 1. cities           - Tỉnh/Thành phố
-- 2. districts        - Quận/Huyện
-- 3. amenities        - Tiện ích
-- 4. property_types   - Loại BĐS
-- 5. listing_types    - Loại giao dịch (Bán/Thuê)
--
-- BẢNG CHÍNH:
-- 6. users            - Người dùng
-- 7. properties       - Bất động sản
-- 8. property_images  - Ảnh BĐS
-- 9. property_amenities - Tiện ích BĐS (Many-to-Many)
-- 10. listings        - Tin đăng
-- 11. comments        - Bình luận
-- 12. appointments    - Đặt lịch hẹn
-- 13. transactions    - Giao dịch
-- 14. favorites       - Yêu thích
--
-- =====================================================
