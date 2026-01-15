-- =====================================================
-- DATABASE: bds_management_3nf
-- Cơ sở dữ liệu chuẩn 3NF cho hệ thống BatDongSanVIP
-- Đã bổ sung các bảng cho chức năng: Bình luận, Avatar, Đặt lịch, Favorites
-- Cập nhật: 2025-12-28 - Thêm dữ liệu mẫu đầy đủ
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

-- Bảng Loại giao dịch (Bán / Cho thuê)
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
  avatar VARCHAR(255),                    -- Đường dẫn ảnh đại diện
  address VARCHAR(500),                   -- Địa chỉ người dùng
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
  views INT NOT NULL DEFAULT 0,   -- Số lượt xem
  
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

-- Bảng Video (Quan hệ 1-Nhiều với Properties)
CREATE TABLE property_videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  video_url VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_videos_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
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

-- Bảng Yêu thích (Favorites)
CREATE TABLE favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_property (user_id, property_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
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

-- ================= DỮ LIỆU KHỞI TẠO - LOOKUP TABLES =================

-- Loại giao dịch
INSERT INTO listing_types (code, name) VALUES 
('sale', 'Nhà đất bán'),
('rent', 'Nhà đất cho thuê');

-- Loại bất động sản (10 loại)
INSERT INTO property_types (name) VALUES 
('Nhà riêng'),
('Nhà biệt thự, liền kề'),
('Căn hộ chung cư'),
('Nhà mặt phố'),
('Shophouse'),
('Đất nền dự án'),
('Đất thổ cư'),
('Trang trại, Khu nghỉ dưỡng'),
('Condotel'),
('Kho, nhà xưởng');

-- Tiện ích (15 loại)
INSERT INTO amenities (name) VALUES 
('Bãi đỗ xe'),
('Hồ bơi'),
('Phòng gym'),
('Sân vườn'),
('Thang máy'),
('An ninh 24/7'),
('Camera giám sát'),
('Điều hòa'),
('Nội thất đầy đủ'),
('Sân thượng'),
('Khu vui chơi trẻ em'),
('Siêu thị gần'),
('Gần trường học'),
('Gần bệnh viện'),
('Gần công viên');

-- Thành phố (10 tỉnh/thành)
INSERT INTO cities (name) VALUES 
('Hà Nội'),
('TP. Hồ Chí Minh'),
('Đà Nẵng'),
('Hải Phòng'),
('Cần Thơ'),
('Nha Trang'),
('Bình Dương'),
('Đồng Nai'),
('Vũng Tàu'),
('Huế');

-- Quận/Huyện (25 quận/huyện)
INSERT INTO districts (city_id, name) VALUES 
-- Hà Nội (city_id = 1)
(1, 'Quận Ba Đình'),
(1, 'Quận Hoàn Kiếm'),
(1, 'Quận Cầu Giấy'),
-- TP.HCM (city_id = 2)
(2, 'Quận 1'),
(2, 'Quận 2'),
(2, 'Quận 3'),
(2, 'Quận 7'),
(2, 'Quận Bình Thạnh'),
(2, 'Quận Phú Nhuận'),
(2, 'Quận Tân Bình'),
-- Đà Nẵng (city_id = 3)
(3, 'Quận Hải Châu'),
(3, 'Quận Thanh Khê'),
(3, 'Quận Sơn Trà'),
-- Hải Phòng (city_id = 4)
(4, 'Quận Hồng Bàng'),
(4, 'Quận Lê Chân'),
(4, 'Quận Ngô Quyền'),
-- Cần Thơ (city_id = 5)
(5, 'Quận Ninh Kiều'),
(5, 'Quận Bình Thủy'),
(5, 'Quận Cái Răng'),
-- Nha Trang (city_id = 6)
(6, 'TP Nha Trang'),
-- Bình Dương (city_id = 7)
(7, 'TP Thủ Dầu Một'),
(7, 'TX Dĩ An'),
-- Đồng Nai (city_id = 8)
(8, 'TP Biên Hòa'),
-- Vũng Tàu (city_id = 9)
(9, 'TP Vũng Tàu'),
-- Huế (city_id = 10)
(10, 'TP Huế');

-- ================= DỮ LIỆU MẪU - USERS (10 người dùng) =================
-- Tất cả tài khoản đều dùng password: password123

INSERT INTO users (email, phone, password_hash, full_name, avatar, address, role, is_active) VALUES
('admin@bds.com', '0901234567', '$2b$10$nfvhXgZa5cfGQbyumg//MeojUP2XOZf8Gwuay7NeS7OHlH5sCx4HG', 'Admin System', '/avatars/admin.jpg', 'Hà Nội', 'admin', 1),
('nguyenvana@gmail.com', '0912345678', '$2b$10$nfvhXgZa5cfGQbyumg//MeojUP2XOZf8Gwuay7NeS7OHlH5sCx4HG', 'Nguyễn Văn A', '/avatars/user1.jpg', '123 Nguyễn Huệ, Quận 1, TP.HCM', 'owner', 1),
('tranthib@gmail.com', '0923456789', '$2b$10$nfvhXgZa5cfGQbyumg//MeojUP2XOZf8Gwuay7NeS7OHlH5sCx4HG', 'Trần Thị B', '/avatars/user2.jpg', '456 Lê Lợi, Quận 3, TP.HCM', 'agent', 1),
('levanc@gmail.com', '0934567890', '$2b$10$nfvhXgZa5cfGQbyumg//MeojUP2XOZf8Gwuay7NeS7OHlH5sCx4HG', 'Lê Văn C', '/avatars/user3.jpg', '789 Trần Hưng Đạo, Quận 5, TP.HCM', 'customer', 1),
('phamthid@gmail.com', '0945678901', '$2b$10$nfvhXgZa5cfGQbyumg//MeojUP2XOZf8Gwuay7NeS7OHlH5sCx4HG', 'Phạm Thị D', '/avatars/user4.jpg', '321 Hai Bà Trưng, Quận 1, TP.HCM', 'owner', 1),
('hoangvane@gmail.com', '0956789012', '$2b$10$nfvhXgZa5cfGQbyumg//MeojUP2XOZf8Gwuay7NeS7OHlH5sCx4HG', 'Hoàng Văn E', '/avatars/user5.jpg', '111 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', 'agent', 1),
('vuthif@gmail.com', '0967890123', '$2b$10$nfvhXgZa5cfGQbyumg//MeojUP2XOZf8Gwuay7NeS7OHlH5sCx4HG', 'Vũ Thị F', '/avatars/user6.jpg', '222 Nguyễn Thị Minh Khai, Quận 3, TP.HCM', 'customer', 1),
('dangvang@gmail.com', '0978901234', '$2b$10$nfvhXgZa5cfGQbyumg//MeojUP2XOZf8Gwuay7NeS7OHlH5sCx4HG', 'Đặng Văn G', '/avatars/user7.jpg', '333 Võ Văn Tần, Quận 3, TP.HCM', 'owner', 1),
('buithih@gmail.com', '0989012345', '$2b$10$nfvhXgZa5cfGQbyumg//MeojUP2XOZf8Gwuay7NeS7OHlH5sCx4HG', 'Bùi Thị H', '/avatars/user8.jpg', '444 Cách Mạng Tháng 8, Quận 10, TP.HCM', 'customer', 1),
('ngothii@gmail.com', '0990123456', '$2b$10$nfvhXgZa5cfGQbyumg//MeojUP2XOZf8Gwuay7NeS7OHlH5sCx4HG', 'Ngô Thị I', '/avatars/user9.jpg', '555 Lý Thường Kiệt, Quận Tân Bình, TP.HCM', 'customer', 1);

-- ================= DỮ LIỆU MẪU - PROPERTIES (12 bất động sản) =================

INSERT INTO properties (owner_id, type_id, district_id, listing_type_id, title, description, price, area, address, bedrooms, bathrooms, direction, legal_status, status, views) VALUES
-- BĐS 1: Căn hộ Quận 1 bán
(2, 3, 4, 1, 'Căn hộ cao cấp Vinhomes Golden River - Quận 1', 'Căn hộ 3 phòng ngủ, view sông Sài Gòn tuyệt đẹp. Nội thất đầy đủ, thiết kế hiện đại. Vị trí đắc địa trung tâm Quận 1.', 12500000000.00, 120.50, '2 Tôn Đức Thắng, Phường Bến Nghé, Quận 1, TP.HCM', 3, 2, 'Dong Nam', 'Sổ hồng', 'available', 1250),
-- BĐS 2: Nhà phố Quận 2 bán
(2, 4, 5, 1, 'Nhà phố liền kề Thảo Điền - Quận 2', 'Nhà phố 4 tầng, thiết kế sang trọng, khu compound an ninh. Gần trường quốc tế, tiện ích đầy đủ.', 25000000000.00, 200.00, '15 Đường Số 10, Phường Thảo Điền, Quận 2, TP.HCM', 5, 5, 'Tay Nam', 'Sổ hồng', 'available', 890),
-- BĐS 3: Đất nền Quận 7 bán
(5, 6, 7, 1, 'Đất nền khu đô thị Phú Mỹ Hưng', 'Lô đất đẹp, mặt tiền đường lớn 20m. Pháp lý rõ ràng, sẵn sàng xây dựng. Khu vực dân cư văn minh.', 35000000000.00, 300.00, 'Đường Nguyễn Đức Cảnh, Phường Tân Phong, Quận 7, TP.HCM', 0, 0, 'Dong', 'Sổ đỏ', 'available', 650),
-- BĐS 4: Biệt thự Quận 2 bán
(5, 2, 5, 1, 'Biệt thự Villa Park - Quận 2', 'Biệt thự song lập 3 tầng, sân vườn rộng rãi, hồ bơi riêng. An ninh 24/7, view công viên.', 45000000000.00, 400.00, '25 Đường Bưng Ông Thoàn, Phường Phú Hữu, Quận 2, TP.HCM', 6, 6, 'Nam', 'Sổ hồng', 'available', 420),
-- BĐS 5: Căn hộ cho thuê Quận Bình Thạnh
(3, 3, 8, 2, 'Căn hộ cho thuê City Garden - Bình Thạnh', 'Căn hộ 2PN full nội thất cao cấp, view thành phố. Tiện ích: hồ bơi, gym, sân tennis. Gần trung tâm.', 25000000.00, 85.00, '59 Ngô Tất Tố, Phường 22, Quận Bình Thạnh, TP.HCM', 2, 2, 'Tay', 'Sổ hồng', 'available', 780),
-- BĐS 6: Nhà mặt tiền cho thuê Quận 3
(3, 4, 6, 2, 'Nhà mặt tiền cho thuê kinh doanh - Quận 3', 'Nhà 4 tầng mặt tiền đường lớn, phù hợp kinh doanh showroom, văn phòng. Vị trí đắc địa.', 80000000.00, 150.00, '123 Võ Văn Tần, Phường 5, Quận 3, TP.HCM', 4, 4, 'Bac', 'Sổ hồng', 'available', 340),
-- BĐS 7: Căn hộ Ba Đình Hà Nội bán
(8, 3, 1, 1, 'Căn hộ Lotte Center - Ba Đình, Hà Nội', 'Căn hộ 2 phòng ngủ tại tổ hợp Lotte Center. View hồ Tây, nội thất Châu Âu, dịch vụ 5 sao.', 8500000000.00, 95.00, '54 Liễu Giai, Phường Cống Vị, Quận Ba Đình, Hà Nội', 2, 2, 'Tay Bac', 'Sổ hồng', 'available', 560),
-- BĐS 8: Nhà riêng Cầu Giấy bán
(8, 1, 3, 1, 'Nhà riêng 5 tầng Cầu Giấy - Hà Nội', 'Nhà xây mới, thiết kế hiện đại. Gần Big C, trường đại học, bệnh viện. Ô tô đỗ cửa.', 6800000000.00, 75.00, '36 Ngõ 168 Đường Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội', 4, 4, 'Dong Bac', 'Sổ đỏ', 'available', 720),
-- BĐS 9: Shophouse Đà Nẵng bán
(6, 5, 11, 1, 'Shophouse Cocobay - Đà Nẵng', 'Shophouse 5 tầng, mặt tiền view biển. Thuận lợi kinh doanh khách sạn, nhà hàng.', 15000000000.00, 180.00, 'Khu du lịch Cocobay, Phường Hòa Hải, Quận Ngũ Hành Sơn, Đà Nẵng', 6, 6, 'Dong', 'Sổ đỏ', 'available', 380),
-- BĐS 10: Căn hộ cho thuê Quận 7
(6, 3, 7, 2, 'Căn hộ cho thuê Sunrise City - Quận 7', 'Căn hộ 2PN+1 full nội thất, view Phú Mỹ Hưng. Hồ bơi, gym, công viên nội khu.', 18000000.00, 98.00, 'Đường Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, TP.HCM', 3, 2, 'Dong Nam', 'Sổ hồng', 'available', 890),
-- BĐS 11: Đất thổ cư Nha Trang bán
(2, 7, 20, 1, 'Đất thổ cư view biển - Nha Trang', 'Lô đất đẹp gần biển, phù hợp xây khách sạn, homestay. Pháp lý sạch sẽ.', 8000000000.00, 250.00, 'Đường Trần Phú, Phường Lộc Thọ, TP Nha Trang, Khánh Hòa', 0, 0, 'Dong', 'Sổ đỏ', 'pending', 280),
-- BĐS 12: Văn phòng cho thuê Quận 1
(5, 10, 4, 2, 'Văn phòng hạng A cho thuê - Quận 1', 'Văn phòng tại tòa nhà Bitexco, tầng cao view đẹp. Đầy đủ tiện nghi, bảo vệ 24/7.', 150000000.00, 200.00, '2 Hải Triều, Phường Bến Nghé, Quận 1, TP.HCM', 0, 3, 'Nam', 'Hợp đồng thuê', 'available', 520);

-- ================= DỮ LIỆU MẪU - PROPERTY IMAGES (24 ảnh) =================

INSERT INTO property_images (property_id, image_url, is_thumbnail) VALUES
(1, '/uploads/properties/property1_1.jpg', 1),
(1, '/uploads/properties/property1_2.jpg', 0),
(2, '/uploads/properties/property2_1.jpg', 1),
(2, '/uploads/properties/property2_2.jpg', 0),
(3, '/uploads/properties/property3_1.jpg', 1),
(3, '/uploads/properties/property3_2.jpg', 0),
(4, '/uploads/properties/property4_1.jpg', 1),
(4, '/uploads/properties/property4_2.jpg', 0),
(5, '/uploads/properties/property5_1.jpg', 1),
(5, '/uploads/properties/property5_2.jpg', 0),
(6, '/uploads/properties/property6_1.jpg', 1),
(6, '/uploads/properties/property6_2.jpg', 0),
(7, '/uploads/properties/property7_1.jpg', 1),
(7, '/uploads/properties/property7_2.jpg', 0),
(8, '/uploads/properties/property8_1.jpg', 1),
(8, '/uploads/properties/property8_2.jpg', 0),
(9, '/uploads/properties/property9_1.jpg', 1),
(9, '/uploads/properties/property9_2.jpg', 0),
(10, '/uploads/properties/property10_1.jpg', 1),
(10, '/uploads/properties/property10_2.jpg', 0),
(11, '/uploads/properties/property11_1.jpg', 1),
(11, '/uploads/properties/property11_2.jpg', 0),
(12, '/uploads/properties/property12_1.jpg', 1),
(12, '/uploads/properties/property12_2.jpg', 0);

-- ================= DỮ LIỆU MẪU - PROPERTY AMENITIES =================

INSERT INTO property_amenities (property_id, amenity_id) VALUES
-- Property 1: Căn hộ Vinhomes
(1, 1), (1, 2), (1, 3), (1, 5), (1, 6), (1, 8), (1, 9),
-- Property 2: Nhà phố Thảo Điền
(2, 1), (2, 4), (2, 6), (2, 7), (2, 9), (2, 13),
-- Property 3: Đất nền (ít tiện ích)
(3, 12), (3, 13),
-- Property 4: Biệt thự
(4, 1), (4, 2), (4, 4), (4, 6), (4, 7), (4, 9), (4, 10), (4, 11),
-- Property 5: Căn hộ cho thuê
(5, 1), (5, 2), (5, 3), (5, 6), (5, 8), (5, 9),
-- Property 6: Nhà mặt tiền
(6, 1), (6, 5), (6, 6), (6, 7),
-- Property 7: Căn hộ Lotte
(7, 1), (7, 2), (7, 3), (7, 5), (7, 6), (7, 8), (7, 9),
-- Property 8: Nhà riêng
(8, 1), (8, 4), (8, 6), (8, 12), (8, 13),
-- Property 9: Shophouse
(9, 1), (9, 5), (9, 6), (9, 7),
-- Property 10: Căn hộ Sunrise
(10, 1), (10, 2), (10, 3), (10, 6), (10, 8), (10, 9), (10, 11), (10, 15),
-- Property 11: Đất thổ cư
(11, 15),
-- Property 12: Văn phòng
(12, 1), (12, 5), (12, 6), (12, 7), (12, 8);

-- ================= DỮ LIỆU MẪU - LISTINGS (12 tin đăng) =================

INSERT INTO listings (property_id, user_id, title, status, views, published_at, expired_at) VALUES
(1, 2, 'Căn hộ cao cấp Vinhomes Golden River - Quận 1', 'published', 1250, '2024-11-01 10:00:00', '2025-02-01 10:00:00'),
(2, 2, 'Nhà phố liền kề Thảo Điền - Quận 2', 'published', 890, '2024-11-15 14:30:00', '2025-02-15 14:30:00'),
(3, 5, 'Đất nền khu đô thị Phú Mỹ Hưng', 'published', 650, '2024-12-01 09:00:00', '2025-03-01 09:00:00'),
(4, 5, 'Biệt thự Villa Park - Quận 2', 'published', 420, '2024-12-10 16:45:00', '2025-03-10 16:45:00'),
(5, 3, 'Căn hộ cho thuê City Garden - Bình Thạnh', 'published', 780, '2024-11-20 11:20:00', '2025-02-20 11:20:00'),
(6, 3, 'Nhà mặt tiền cho thuê kinh doanh - Quận 3', 'published', 340, '2024-12-05 08:15:00', '2025-03-05 08:15:00'),
(7, 8, 'Căn hộ Lotte Center - Ba Đình, Hà Nội', 'published', 560, '2024-11-25 13:00:00', '2025-02-25 13:00:00'),
(8, 8, 'Nhà riêng 5 tầng Cầu Giấy - Hà Nội', 'published', 720, '2024-12-08 10:30:00', '2025-03-08 10:30:00'),
(9, 6, 'Shophouse Cocobay - Đà Nẵng', 'published', 380, '2024-12-12 15:00:00', '2025-03-12 15:00:00'),
(10, 6, 'Căn hộ cho thuê Sunrise City - Quận 7', 'published', 890, '2024-11-28 09:45:00', '2025-02-28 09:45:00'),
(11, 2, 'Đất thổ cư view biển - Nha Trang', 'draft', 280, NULL, NULL),
(12, 5, 'Văn phòng hạng A cho thuê - Quận 1', 'published', 520, '2024-12-15 14:00:00', '2025-03-15 14:00:00');

-- ================= DỮ LIỆU MẪU - FAVORITES (15 yêu thích) =================

INSERT INTO favorites (user_id, property_id) VALUES
(4, 1), -- Lê Văn C thích căn hộ Vinhomes
(4, 2), -- Lê Văn C thích nhà phố Thảo Điền
(4, 5), -- Lê Văn C thích căn hộ City Garden
(7, 1), -- Vũ Thị F thích căn hộ Vinhomes
(7, 4), -- Vũ Thị F thích biệt thự Villa Park
(7, 10), -- Vũ Thị F thích căn hộ Sunrise
(9, 3), -- Bùi Thị H thích đất nền PMH
(9, 7), -- Bùi Thị H thích căn hộ Lotte
(9, 8), -- Bùi Thị H thích nhà riêng Cầu Giấy
(10, 2), -- Ngô Thị I thích nhà phố Thảo Điền
(10, 4), -- Ngô Thị I thích biệt thự Villa Park
(10, 9), -- Ngô Thị I thích shophouse
(4, 7), -- Lê Văn C thích căn hộ Lotte
(7, 6), -- Vũ Thị F thích nhà mặt tiền Q3
(9, 12); -- Bùi Thị H thích văn phòng Q1

-- ================= DỮ LIỆU MẪU - APPOINTMENTS (12 lịch hẹn) =================

INSERT INTO appointments (listing_id, customer_id, full_name, phone, scheduled_at, message, status) VALUES
(1, 4, 'Lê Văn C', '0934567890', '2025-01-02', 'Tôi muốn xem căn hộ vào buổi sáng, khoảng 9h-10h.', 'confirmed'),
(1, 7, 'Vũ Thị F', '0967890123', '2025-01-03', 'Xin hỏi giá có thương lượng không?', 'pending'),
(2, 4, 'Lê Văn C', '0934567890', '2025-01-04', 'Tôi muốn mua cho gia đình, có thể xem nhà cuối tuần được không?', 'confirmed'),
(3, 9, 'Bùi Thị H', '0989012345', '2025-01-05', 'Tôi quan tâm lô đất này, mong được tư vấn thêm.', 'pending'),
(4, 10, 'Ngô Thị I', '0990123456', '2025-01-06', 'Biệt thự có đang cho thuê không? Tôi muốn thuê trước khi quyết định mua.', 'completed'),
(5, NULL, 'Trần Minh Khoa', '0911222333', '2025-01-07', 'Tìm thuê căn hộ cho gia đình 4 người.', 'confirmed'),
(6, NULL, 'Nguyễn Thanh Tùng', '0922333444', '2025-01-08', 'Cần thuê mặt bằng mở quán cafe, xin tư vấn.', 'pending'),
(7, 9, 'Bùi Thị H', '0989012345', '2025-01-09', 'Tôi đang tìm mua căn hộ ở Hà Nội, xin được xem nhà.', 'confirmed'),
(8, 4, 'Lê Văn C', '0934567890', '2025-01-10', 'Căn nhà này có gần trường học không? Tôi có con nhỏ.', 'pending'),
(10, 7, 'Vũ Thị F', '0967890123', '2025-01-11', 'Tôi muốn thuê căn hộ này, có thể dọn vào đầu tháng 2 được không?', 'confirmed'),
(9, 10, 'Ngô Thị I', '0990123456', '2025-01-12', 'Shophouse này có thể kinh doanh khách sạn mini được không?', 'rejected'),
(12, 9, 'Bùi Thị H', '0989012345', '2025-01-13', 'Công ty tôi đang tìm văn phòng, xin được tham quan.', 'pending');

-- ================= DỮ LIỆU MẪU - COMMENTS (15 bình luận) =================

INSERT INTO comments (content, user_id, listing_id) VALUES
('Căn hộ đẹp quá! Giá có thương lượng không ạ?', 4, 1),
('View rất đẹp, nội thất sang trọng. Đang cân nhắc mua.', 7, 1),
('Cho hỏi căn này còn không ạ? Tôi muốn xem nhà cuối tuần.', 9, 1),
('Nhà phố khu này an ninh tốt lắm, tôi có người quen ở gần đây.', 7, 2),
('Giá hơi cao so với thị trường hiện tại, mong được thương lượng.', 4, 2),
('Đất nền vị trí đẹp, pháp lý rõ ràng là điểm cộng lớn.', 10, 3),
('Biệt thự sang trọng thật sự, phù hợp cho gia đình lớn.', 4, 4),
('Căn hộ cho thuê giá hợp lý, nội thất đẹp.', 9, 5),
('Mặt bằng rộng rãi, rất phù hợp kinh doanh.', 10, 6),
('Căn hộ tại Lotte nội thất đẹp, dịch vụ tốt.', 4, 7),
('Nhà riêng Cầu Giấy giá tốt, gần các tiện ích.', 7, 8),
('Shophouse Cocobay view biển tuyệt vời!', 9, 9),
('Căn hộ Sunrise City tiện nghi đầy đủ, rất thích!', 4, 10),
('Đất view biển hiếm lắm, đáng để đầu tư.', 10, 11),
('Văn phòng Bitexco sang trọng, rất phù hợp cho công ty lớn.', 7, 12);

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

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_property ON favorites(property_id);

-- ================= THỐNG KÊ DỮ LIỆU =================
-- Users: 10 bản ghi
-- Cities: 10 bản ghi  
-- Districts: 25 bản ghi
-- Property Types: 10 bản ghi
-- Listing Types: 2 bản ghi
-- Amenities: 15 bản ghi
-- Properties: 12 bản ghi
-- Property Images: 24 bản ghi
-- Property Amenities: ~70 bản ghi
-- Listings: 12 bản ghi
-- Favorites: 15 bản ghi
-- Appointments: 12 bản ghi
-- Comments: 15 bản ghi
-- =====================================================
-- END OF DATABASE SCRIPT
-- =====================================================
