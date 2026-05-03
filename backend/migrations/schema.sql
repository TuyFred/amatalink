-- Email verification columns for users table
-- Run only if columns don't exist (manual check or via Node script)

/*ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP NULL;
*/

