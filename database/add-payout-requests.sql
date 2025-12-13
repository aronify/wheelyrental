-- Add Payout Requests Table and Related Components
-- This script ONLY adds the payout_requests functionality
-- Run this in your Supabase SQL Editor

-- Payout Requests table
CREATE TABLE payout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_url TEXT NOT NULL,
  amount DECIMAL(10, 2),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  admin_notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for better query performance
CREATE INDEX idx_payout_requests_user_id ON payout_requests(user_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);

-- Add trigger to auto-update updated_at
CREATE TRIGGER update_payout_requests_updated_at BEFORE UPDATE ON payout_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on payout_requests table
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Payout Requests policies
CREATE POLICY "Users can view their own payout requests"
  ON payout_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payout requests"
  ON payout_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

