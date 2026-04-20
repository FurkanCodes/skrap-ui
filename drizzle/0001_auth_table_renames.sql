DO $$
BEGIN
  IF to_regclass('public.account') IS NOT NULL AND to_regclass('public.auth_accounts') IS NULL THEN
    ALTER TABLE "account" RENAME TO "auth_accounts";
  END IF;

  IF to_regclass('public.session') IS NOT NULL AND to_regclass('public.auth_sessions') IS NULL THEN
    ALTER TABLE "session" RENAME TO "auth_sessions";
  END IF;

  IF to_regclass('public.user') IS NOT NULL AND to_regclass('public.auth_users') IS NULL THEN
    ALTER TABLE "user" RENAME TO "auth_users";
  END IF;

  IF to_regclass('public.verification') IS NOT NULL AND to_regclass('public.auth_verifications') IS NULL THEN
    ALTER TABLE "verification" RENAME TO "auth_verifications";
  END IF;

  IF to_regclass('public.jwks') IS NOT NULL AND to_regclass('public.auth_jwks') IS NULL THEN
    ALTER TABLE "jwks" RENAME TO "auth_jwks";
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.account_userId_idx') IS NOT NULL
    AND to_regclass('public.auth_accounts_user_id_idx') IS NULL THEN
    ALTER INDEX "account_userId_idx" RENAME TO "auth_accounts_user_id_idx";
  END IF;

  IF to_regclass('public.session_userId_idx') IS NOT NULL
    AND to_regclass('public.auth_sessions_user_id_idx') IS NULL THEN
    ALTER INDEX "session_userId_idx" RENAME TO "auth_sessions_user_id_idx";
  END IF;

  IF to_regclass('public.verification_identifier_idx') IS NOT NULL
    AND to_regclass('public.auth_verifications_identifier_idx') IS NULL THEN
    ALTER INDEX "verification_identifier_idx" RENAME TO "auth_verifications_identifier_idx";
  END IF;
END
$$;
