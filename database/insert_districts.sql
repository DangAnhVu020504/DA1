-- =====================================================
-- THÊM DỮ LIỆU QUẬN/HUYỆN CHO CÁC TỈNH THÀNH
-- File: insert_districts.sql
-- =====================================================

USE bds_management_3nf;

-- Xóa dữ liệu cũ nếu cần chạy lại (tùy chọn)
-- DELETE FROM districts WHERE city_id IN (1, 3, 4, 5);

-- ================= HÀ NỘI (id = 1) =================
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

-- ================= ĐÀ NẴNG (id = 3) =================
INSERT INTO districts (city_id, name) VALUES 
(3, 'Quận Hải Châu'),
(3, 'Quận Thanh Khê'),
(3, 'Quận Sơn Trà'),
(3, 'Quận Ngũ Hành Sơn'),
(3, 'Quận Liên Chiểu'),
(3, 'Quận Cẩm Lệ'),
(3, 'Huyện Hòa Vang'),
(3, 'Huyện Hoàng Sa');

-- ================= CẦN THƠ (id = 4) =================
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

-- ================= HẢI PHÒNG (id = 5) =================
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

-- ================= KIỂM TRA DỮ LIỆU =================
-- Xem tổng số quận/huyện theo từng thành phố
SELECT c.name AS 'Thành phố', COUNT(d.id) AS 'Số quận/huyện'
FROM cities c
LEFT JOIN districts d ON c.id = d.city_id
GROUP BY c.id, c.name
ORDER BY c.id;
