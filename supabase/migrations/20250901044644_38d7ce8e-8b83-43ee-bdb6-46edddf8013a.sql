-- Add due_date column to rental_agreements table
ALTER TABLE rental_agreements 
ADD COLUMN IF NOT EXISTS due_date date;