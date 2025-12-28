-- =====================================================
-- BẢNG YÊU THÍCH (FAVORITES) - Liên kết với Property
-- File: insert_favorites_table.sql
-- =====================================================

USE bds_management_3nf;

-- Xóa bảng cũ nếu có (cho trường hợp chạy lại)
DROP TABLE IF EXISTS favorites;

-- Tạo bảng Yêu thích (liên kết trực tiếp với properties)
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

-- Indexes để tối ưu query
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_property ON favorites(property_id);
