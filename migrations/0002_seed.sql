-- SpinWin App - Seed Data
-- Migration: 0002_seed.sql

-- Insert Plans
INSERT INTO plans (id, name, min_deposit, max_deposit, earning_rate, daily_spins, badge, color, popular) VALUES
  ('f7e2a1b3-9c4d-4e5f-8a7b-3c1e5f7a9d2b', 'Starter',  5,    9.99,  1.50, 5,  'Starter', 'gray',   0),
  ('d4c5b6a7-3e2f-4a1b-9c8d-6f4e2a8b7c3d', 'Basic',    10,   49.99, 2.00, 10,  'Basic',   'blue',   0),
  ('a9b8c7d6-5f4e-4d3c-b2a1-7e8d9c0f1a2b', 'Silver',   50,   99.99, 2.50, 20,  'Silver',  'silver', 0),
  ('e5f6a7b8-1c2d-4e3f-8a9b-4d2c1b5e7f8a', 'Gold',     100,  249.99,3.00, 40, 'Gold',    'gold',   1),
  ('b3c4d5e6-7a8b-4f9c-1d2e-9f3a6b2c8d4e', 'Premium',  250,  500,   4.00, 50, 'Premium', 'purple', 0);
