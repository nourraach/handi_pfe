-- Migration: 002_audit_logs_schema.sql
-- Description: Create audit_logs table for tracking all authorization and access attempts
-- Requirements: 6.1, 6.2, 6.3

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_id VARCHAR(100),
  
  -- User Context
  user_id UUID NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  user_email VARCHAR(255),
  
  -- Request Details
  service_name VARCHAR(100) NOT NULL,
  action_type VARCHAR(100) NOT NULL,  -- 'CV_ACCESS', 'CONTACT_INITIATION', 'APPLICATION_ACCESS', 'GATEWAY_VALIDATION', etc.
  resource_type VARCHAR(100),         -- 'CV', 'MESSAGE', 'APPLICATION', 'JWT', etc.
  resource_id UUID,
  
  -- Authorization Result
  authorization_result VARCHAR(20) NOT NULL,  -- 'ALLOWED', 'DENIED'
  denial_reason TEXT,
  
  -- Request Metadata
  http_method VARCHAR(10),
  http_path TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Contextual Data (JSON for flexibility)
  additional_context JSONB
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_result ON audit_logs(authorization_result);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action_result ON audit_logs(action_type, authorization_result);

-- Comment the table for documentation
COMMENT ON TABLE audit_logs IS 'Centralized audit log table for tracking all authorization attempts and sensitive data access across all microservices';

-- Column comments
COMMENT ON COLUMN audit_logs.request_id IS 'Unique identifier for request tracing across services';
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action attempted (e.g., CV_ACCESS, CONTACT_INITIATION, APPLICATION_ACCESS)';
COMMENT ON COLUMN audit_logs.authorization_result IS 'Result of authorization check: ALLOWED or DENIED';
COMMENT ON COLUMN audit_logs.additional_context IS 'Flexible JSON field for storing action-specific metadata';
