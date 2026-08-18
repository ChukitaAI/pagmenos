-- ============================================================================
-- Pagmenos — Migration 001: Extensions
-- ============================================================================
-- Enable required PostgreSQL extensions for search and text handling.

CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
