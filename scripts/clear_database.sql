-- Use the database
USE nodejs_csr_console_server;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Clear the payments table and reset the primary key
TRUNCATE TABLE payments;

-- Clear the merchants table and reset the primary key
TRUNCATE TABLE merchants;

-- Delete the payments table
DROP TABLE IF EXISTS payments;

-- Delete the merchants table
DROP TABLE IF EXISTS merchants;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
