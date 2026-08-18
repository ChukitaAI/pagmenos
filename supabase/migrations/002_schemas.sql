-- ============================================================================
-- Pagmenos — Migration 002: Private Schema
-- ============================================================================
-- Private schema for security-sensitive functions that should not be
-- directly callable from the public API (PostgREST).

CREATE SCHEMA IF NOT EXISTS private;
