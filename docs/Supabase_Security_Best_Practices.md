# Supabase Security Best Practices: Comprehensive Guide

## Introduction

Security is paramount when building applications with Supabase. This comprehensive guide covers best practices for securing your data, managing access, protecting authentication, and maintaining a secure production environment.

## Table of Contents

1. [Security Architecture Overview](#security-architecture-overview)
2. [Row Level Security (RLS)](#row-level-security-rls)
3. [API Key Management](#api-key-management)
4. [Authentication Security](#authentication-security)
5. [Database Security](#database-security)
6. [Storage Security](#storage-security)
7. [Network Security](#network-security)
8. [Compliance and Certifications](#compliance-and-certifications)
9. [Monitoring and Auditing](#monitoring-and-auditing)
10. [Incident Response](#incident-response)

---

## Security Architecture Overview

### Supabase Security Model

Supabase provides multiple layers of security:

```
Frontend Application
    ↓
Supabase APIs (Protected by anon key + RLS)
    ↓
PostgreSQL Database (RLS + Policies)
    ↓
Encrypted Storage (At Rest)
```

### Shared Responsibility Model

**Supabase Provides:**
- Infrastructure security
- Network protection (DDoS, CDN)
- Data encryption at rest and in transit
- Regular security updates
- SOC 2 Type 2 compliance
- HIPAA compliance (with BAA)

**You Are Responsible For:**
- Row Level Security policies
- API key management
- User authentication configuration
- Database schema design
- Access control policies
- Application security
- Monitoring and logging

---

## Row Level Security (RLS)

### Why RLS is Critical

**Without RLS:**
```sql
-- ANY client can read ALL data
SELECT * FROM users; -- Returns all users!
```

**With RLS:**
```sql
-- Only authenticated user's data is returned
SELECT * FROM users WHERE id = auth.uid();
```

### Enabling RLS

**CRITICAL: Enable RLS on all public schema tables**

```sql
-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### Essential RLS Patterns

#### 1. User-Specific Data Access

```sql
-- Users can only access their own data
CREATE POLICY "Users access own data"
ON profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### 2. Public Read, Authenticated Write

```sql
-- Anyone can read published posts
CREATE POLICY "Public read published"
ON posts
FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Only authors can update their posts
CREATE POLICY "Authors update own posts"
ON posts
FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);
```

#### 3. Team/Organization Access

```sql
-- Users can access data from their organization
CREATE POLICY "Organization members access"
ON documents
FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT org_id FROM memberships
        WHERE user_id = auth.uid()
    )
);
```

#### 4. Role-Based Access

```sql
-- Create role check function
CREATE OR REPLACE FUNCTION has_role(required_role text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use in policy
CREATE POLICY "Admins full access"
ON sensitive_data
FOR ALL
TO authenticated
USING ((SELECT has_role('admin')));
```

### RLS Security Best Practices

1. **Always Specify Role**
```sql
-- ✅ Good: Explicit role
CREATE POLICY "policy_name" ON table
FOR SELECT TO authenticated
USING (...);

-- ❌ Bad: No role = public access risk
CREATE POLICY "policy_name" ON table
FOR SELECT
USING (...);
```

2. **Use Security Definer Functions**
```sql
CREATE FUNCTION check_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Complex authorization logic
    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
    );
END;
$$;

-- Secure the function
REVOKE ALL ON FUNCTION check_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_access() TO authenticated;
```

3. **Avoid Using User Metadata for Authorization**
```sql
-- ❌ Bad: raw_user_meta_data can be modified by user
CREATE POLICY "bad_policy" ON table
USING (
    (auth.jwt()->>'user_metadata')::json->>'role' = 'admin'
);

-- ✅ Good: Use raw_app_meta_data or separate table
CREATE POLICY "good_policy" ON table
USING (
    (auth.jwt()->>'app_metadata')::json->>'role' = 'admin'
);
```

4. **Test Policies Thoroughly**
```sql
-- Set up test user
SET session role authenticated;
SET request.jwt.claims TO '{"sub":"test-user-id"}';

-- Test queries
SELECT * FROM your_table;
INSERT INTO your_table (...) VALUES (...);

-- Reset
SET session role postgres;
```

---

## API Key Management

### Understanding API Keys

Supabase provides two main API keys:

1. **Anon Key (Public)**
   - Safe to expose in frontend
   - Works with RLS policies
   - Limited to user-authorized actions

2. **Service Role Key (Secret)**
   - Bypasses ALL RLS policies
   - Full database access
   - NEVER expose in frontend

### Best Practices

#### 1. Environment Variables

```typescript
// ✅ Good: Use environment variables
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ❌ Bad: Hardcoded keys
const supabase = createClient(
    'https://xxx.supabase.co',
    'eyJhbGciOiJIUzI1...'
);
```

#### 2. Separate Client/Server Keys

```typescript
// Frontend: Use anon key
const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Backend: Use service role key (server-side only!)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);
```

#### 3. Key Rotation

**When to Rotate:**
- Suspected compromise
- Employee departure with access
- Regular security maintenance (quarterly)
- After security incident

**How to Rotate:**
1. Generate new keys in Dashboard
2. Update environment variables
3. Deploy new configuration
4. Revoke old keys

#### 4. Rate Limiting

```typescript
// Implement client-side rate limiting
const rateLimiter = new RateLimiter({
    maxRequests: 100,
    perMilliseconds: 60000, // 1 minute
});

async function apiCall() {
    await rateLimiter.checkLimit();
    return supabase.from('table').select();
}
```

---

## Authentication Security

### Multi-Factor Authentication (MFA)

**Enable MFA for Organization:**
```
Dashboard → Organization Settings → Security → Enable MFA Enforcement
```

**Implement MFA for Users:**
```typescript
// Enroll MFA
const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
});

// Verify MFA
const { data, error } = await supabase.auth.mfa.verify({
    factorId: factor.id,
    code: userProvidedCode,
});
```

### Email Configuration

#### 1. Custom SMTP
```
Benefits:
- Emails from your domain
- Higher deliverability
- Better monitoring
- Professional appearance

Setup:
Dashboard → Authentication → Email Templates → SMTP Settings
```

#### 2. Email Confirmations
```sql
-- Enable in Dashboard: Settings → Auth → Email Confirmations
-- Required for production security

-- Verify email before allowing access
CREATE POLICY "Verified users only"
ON sensitive_table
TO authenticated
USING (
    auth.email_confirmed_at IS NOT NULL
);
```

#### 3. Password Requirements
```
Configure in: Settings → Auth → Password Requirements

Minimum:
- 8 characters
- 1 uppercase
- 1 lowercase  
- 1 number
- 1 special character
```

### OAuth Security

```typescript
// Configure OAuth with PKCE
const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
        redirectTo: `${location.origin}/auth/callback`,
        scopes: 'email profile',
        queryParams: {
            access_type: 'offline',
            prompt: 'consent',
        },
    },
});
```

### Session Management

```typescript
// Refresh tokens before expiry
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed:', session);
    }
});

// Sign out from all devices
await supabase.auth.signOut({ scope: 'global' });
```

### CAPTCHA Protection

Enable CAPTCHA to prevent abuse:

```typescript
// Frontend
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, anonKey, {
    auth: {
        flowType: 'pkce',
    },
});

// Configure CAPTCHA
await supabase.auth.signUp({
    email,
    password,
    options: {
        captchaToken: token,
    },
});
```

**Configure in Dashboard:**
```
Settings → Auth → Security → Enable CAPTCHA
```

---

## Database Security

### SSL/TLS Enforcement

**Enable SSL Enforcement:**
```
Dashboard → Settings → Database → SSL Enforcement → Enable
```

```typescript
// Enforce SSL in connection string
const connectionString = `postgresql://...?sslmode=require`;
```

### Network Restrictions

**Whitelist IP Addresses:**
```
Dashboard → Settings → Database → Network Restrictions

Add allowed IP ranges:
- Office IPs
- CI/CD servers
- Trusted services
```

### Database Roles and Permissions

```sql
-- Create read-only role
CREATE ROLE readonly;
GRANT CONNECT ON DATABASE postgres TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

-- Create limited write role
CREATE ROLE app_user;
GRANT INSERT, UPDATE ON specific_table TO app_user;
```

### Secrets Management

```sql
-- Use Vault extension for secrets
CREATE EXTENSION IF NOT EXISTS vault;

-- Store secrets
SELECT vault.create_secret('api_key', 'secret_value');

-- Retrieve secrets in functions
CREATE FUNCTION call_external_api()
RETURNS json AS $$
DECLARE
    api_key text;
BEGIN
    SELECT decrypted_secret INTO api_key
    FROM vault.decrypted_secrets
    WHERE name = 'api_key';
    
    -- Use api_key...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### SQL Injection Prevention

```typescript
// ✅ Good: Parameterized query via Supabase client
const { data } = await supabase
    .from('users')
    .select()
    .eq('email', userInput);

// ❌ Bad: Raw SQL with user input
const { data } = await supabase.rpc('raw_query', {
    query: `SELECT * FROM users WHERE email = '${userInput}'`
});

// ✅ Good: If you must use RPC, use parameters
const { data } = await supabase.rpc('safe_query', {
    user_email: userInput
});
```

---

## Storage Security

### Bucket Configuration

```typescript
// Create private bucket
const { data, error } = await supabase
    .storage
    .createBucket('private-files', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf'],
    });
```

### Storage RLS Policies

```sql
-- Users can upload to their own folder
CREATE POLICY "User uploads own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'private-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own files
CREATE POLICY "User reads own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'private-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own files
CREATE POLICY "User deletes own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'private-files'
    AND owner = auth.uid()
);
```

### Signed URLs for Private Content

```typescript
// Generate signed URL with expiration
const { data, error } = await supabase
    .storage
    .from('private-files')
    .createSignedUrl('path/to/file.pdf', 3600); // 1 hour

// Share signed URL (expires after 1 hour)
const signedUrl = data.signedUrl;
```

### File Upload Validation

```typescript
// Validate file before upload
function validateFile(file: File): boolean {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (file.size > maxSize) {
        throw new Error('File too large');
    }
    
    if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not allowed');
    }
    
    // Check file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !isValidExtension(extension, file.type)) {
        throw new Error('File extension mismatch');
    }
    
    return true;
}
```

---

## Network Security

### SSL/TLS Configuration

**All Supabase connections use TLS 1.2+ by default.**

Verify SSL in your connections:
```typescript
// SSL is enabled by default
const supabase = createClient(url, key);

// Force SSL verification
const pg = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: true,
    },
});
```

### DDoS Protection

**Supabase provides:**
- Cloudflare CDN protection
- fail2ban for brute force prevention
- Rate limiting at multiple levels
- Automatic traffic analysis

### Implementing Rate Limiting

```sql
-- Create rate limit table
CREATE TABLE private.rate_limits (
    ip inet,
    request_at timestamp
);

CREATE INDEX idx_rate_limits 
ON private.rate_limits (ip, request_at DESC);

-- Create rate limit function
CREATE OR REPLACE FUNCTION check_rate_limit()
RETURNS void AS $$
DECLARE
    req_ip inet;
    req_count integer;
BEGIN
    -- Get request IP
    req_ip := split_part(
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        ',',
        1
    )::inet;
    
    -- Count recent requests
    SELECT COUNT(*) INTO req_count
    FROM private.rate_limits
    WHERE ip = req_ip
    AND request_at > NOW() - INTERVAL '5 minutes';
    
    -- Check limit
    IF req_count >= 100 THEN
        RAISE EXCEPTION 'Rate limit exceeded'
        USING HINT = 'Too many requests';
    END IF;
    
    -- Log request
    INSERT INTO private.rate_limits (ip, request_at)
    VALUES (req_ip, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to API
ALTER FUNCTION check_rate_limit() 
SET search_path = '';
```

---

## Compliance and Certifications

### SOC 2 Type 2

**Supabase is SOC 2 Type 2 compliant.**

Access reports:
```
Dashboard → Organization → Compliance → Download SOC 2 Report
(Available for Team and Enterprise plans)
```

### HIPAA Compliance

For Protected Health Information (PHI):

**Requirements:**
1. Upgrade to Team or Enterprise plan
2. Sign Business Associate Agreement (BAA)
3. Implement required security controls
4. Configure audit logging
5. Enable encryption at rest

**Request BAA:**
```
Dashboard → Organization → Compliance → Request BAA
```

**Implementation Checklist:**
- [ ] Enable RLS on all PHI tables
- [ ] Implement MFA for all users
- [ ] Enable SSL enforcement
- [ ] Configure network restrictions
- [ ] Set up audit logging
- [ ] Implement data retention policies
- [ ] Configure backup encryption
- [ ] Train team on HIPAA requirements

### GDPR Compliance

**Data Protection Measures:**

```sql
-- Data anonymization function
CREATE FUNCTION anonymize_user(user_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE users
    SET 
        email = 'deleted_' || user_id || '@deleted.com',
        name = 'Deleted User',
        phone = NULL,
        address = NULL,
        deleted_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Right to be forgotten
CREATE FUNCTION delete_user_data(user_id uuid)
RETURNS void AS $$
BEGIN
    -- Delete or anonymize user data
    DELETE FROM user_activities WHERE user_id = user_id;
    DELETE FROM user_preferences WHERE user_id = user_id;
    PERFORM anonymize_user(user_id);
END;
$$ LANGUAGE plpgsql;
```

**Data Export:**
```typescript
// Implement data export for GDPR requests
async function exportUserData(userId: string) {
    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    
    const { data: activities } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId);
    
    return {
        user,
        activities,
        exportDate: new Date().toISOString(),
    };
}
```

---

## Monitoring and Auditing

### Security Advisor

**Use Security Advisor in Dashboard:**
```
Dashboard → Database → Security Advisor

Checks for:
- Tables without RLS
- Weak RLS policies  
- Exposed functions
- Missing indexes on RLS columns
- Publicly accessible data
```

### Audit Logging

```sql
-- Enable pgAudit extension
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- Configure audit logging
ALTER DATABASE postgres SET pgaudit.log = 'all';
ALTER DATABASE postgres SET pgaudit.log_level = 'log';

-- Create custom audit table
CREATE TABLE audit_log (
    id serial PRIMARY KEY,
    table_name text,
    operation text,
    user_id uuid,
    changed_at timestamp DEFAULT NOW(),
    old_data jsonb,
    new_data jsonb
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        table_name,
        operation,
        user_id,
        old_data,
        new_data
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        row_to_json(OLD),
        row_to_json(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to sensitive tables
CREATE TRIGGER audit_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

### Monitoring Failed Authentication

```sql
-- Track failed login attempts
CREATE TABLE auth_failures (
    id serial PRIMARY KEY,
    email text,
    ip_address inet,
    attempted_at timestamp DEFAULT NOW()
);

-- Alert on suspicious activity
CREATE FUNCTION check_auth_failures()
RETURNS void AS $$
DECLARE
    failure_count integer;
BEGIN
    SELECT COUNT(*) INTO failure_count
    FROM auth_failures
    WHERE attempted_at > NOW() - INTERVAL '5 minutes';
    
    IF failure_count > 10 THEN
        -- Trigger alert
        PERFORM pg_notify('security_alert', 
            'High number of auth failures detected');
    END IF;
END;
$$ LANGUAGE plpgsql;
```

### Real-Time Security Monitoring

```typescript
// Monitor security events
const channel = supabase.channel('security-events');

channel
    .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'audit_log',
    }, (payload) => {
        console.log('Security event:', payload);
        // Trigger alert if needed
    })
    .subscribe();
```

---

## Incident Response

### Security Incident Plan

**1. Detection:**
- Monitor Security Advisor
- Check audit logs
- Review auth failures
- Analyze traffic patterns

**2. Containment:**
```typescript
// Immediately rotate API keys
// Revoke suspicious sessions
await supabase.auth.admin.signOut(userId);

// Disable compromised accounts
await supabase.auth.admin.updateUserById(userId, {
    banned: true,
});
```

**3. Investigation:**
- Review audit logs
- Identify affected users
- Assess data exposure
- Document timeline

**4. Recovery:**
- Restore from backup if needed
- Re-enable services
- Reset credentials
- Update security policies

**5. Post-Incident:**
- Notify affected users
- Update security measures
- Document lessons learned
- Implement preventive measures

### Backup and Recovery

```sql
-- Point-in-Time Recovery (PITR)
-- Enable in Dashboard: Database → Backups → Enable PITR

-- Manual backup
pg_dump -h db.xxx.supabase.co \
    -U postgres \
    -d postgres \
    -F c \
    -f backup.dump

-- Restore
pg_restore -h db.xxx.supabase.co \
    -U postgres \
    -d postgres \
    backup.dump
```

---

## Security Checklist

### Pre-Production

- [ ] Enable RLS on all public tables
- [ ] Test all RLS policies thoroughly
- [ ] Configure SSL enforcement
- [ ] Set up network restrictions
- [ ] Enable MFA for organization
- [ ] Configure custom SMTP
- [ ] Set up CAPTCHA
- [ ] Review Security Advisor
- [ ] Implement rate limiting
- [ ] Set up audit logging
- [ ] Configure backups (PITR recommended)
- [ ] Document security procedures
- [ ] Train team on security practices

### Ongoing

- [ ] Regular Security Advisor reviews
- [ ] Monitor audit logs
- [ ] Review failed auth attempts
- [ ] Check for unusual traffic
- [ ] Update dependencies
- [ ] Rotate API keys (quarterly)
- [ ] Test backup restoration
- [ ] Review and update RLS policies
- [ ] Security training for team
- [ ] Penetration testing (annual)

---

## Additional Security Resources

- [Supabase Security Documentation](https://supabase.com/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/security.html)
- [SOC 2 Compliance Guide](https://supabase.com/docs/guides/platform/soc2)
- [HIPAA Compliance](https://supabase.com/docs/guides/platform/hipaa)

---

## Key Security Principles

1. **Defense in Depth** - Multiple security layers
2. **Least Privilege** - Minimum necessary access
3. **Fail Secure** - Safe defaults, explicit allows
4. **Monitor Everything** - Audit and alert
5. **Encrypt Always** - Data at rest and in transit
6. **Test Thoroughly** - Security testing in CI/CD
7. **Update Regularly** - Stay current with patches
8. **Document Everything** - Security procedures and policies
9. **Train Your Team** - Security awareness
10. **Plan for Incidents** - Have response procedures ready

---

*Security is an ongoing process. Review and update your security measures regularly.*
