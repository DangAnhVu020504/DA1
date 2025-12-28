-- Add address column to users table
-- Run this SQL in your MySQL database

ALTER TABLE users ADD COLUMN address VARCHAR(500) NULL AFTER avatar;
