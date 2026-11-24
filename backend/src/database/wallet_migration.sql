-- Wallet System Migration
-- Run once to add wallet support to the platform

-- Add wallet_balance column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00;

-- Wallet transactions table (audit trail of every credit/debit)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'topup_pending',   -- awaiting admin confirmation of bank transfer
    'topup_approved',  -- admin confirmed top-up, balance credited
    'topup_rejected',  -- admin rejected top-up request
    'order_payment',   -- deducted at checkout
    'refund',          -- refunded back to wallet
    'adjustment'       -- manual admin adjustment
  )),
  amount NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2),
  reference VARCHAR(100),           -- bank transfer reference or system ref
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending','completed','failed','cancelled')),
  admin_id INTEGER REFERENCES users(id),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user   ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type   ON wallet_transactions(type);
