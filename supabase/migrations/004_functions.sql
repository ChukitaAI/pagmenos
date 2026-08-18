-- ============================================================================
-- Pagmenos — Migration 004: Functions
-- ============================================================================

-- Updated At trigger
CREATE OR REPLACE FUNCTION private.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Role checking (SECURITY DEFINER — bypasses RLS to read user_roles)
CREATE OR REPLACE FUNCTION private.has_role(check_user_id uuid, check_role app_role)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role = check_role); END;
$$;

CREATE OR REPLACE FUNCTION private.has_any_admin_role(check_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role IN ('staff', 'manager', 'owner')); END;
$$;

CREATE OR REPLACE FUNCTION private.has_manager_or_owner_role(check_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role IN ('manager', 'owner')); END;
$$;

-- AAL2 check (MFA)
CREATE OR REPLACE FUNCTION private.is_aal2()
RETURNS boolean LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT coalesce((SELECT (auth.jwt()->>'aal') = 'aal2'), false);
$$;
