# Supabase Backend Best Practices: Production Checklist & RLS Performance

## Introduction

This comprehensive guide covers essential best practices for deploying and maintaining Supabase applications in production environments. It focuses on security, performance, availability, and Row Level Security (RLS) optimization.

## Table of Contents

1. [Security Best Practices](#security-best-practices)
2. [Performance Optimization](#performance-optimization)
3. [Availability and Reliability](#availability-and-reliability)
4. [Row Level Security (RLS)](#row-level-security-rls)
5. [RLS Performance Optimization](#rls-performance-optimization)
6. [Database Management](#database-management)
7. [Monitoring and Observability](#monitoring-and-observability)

---

## Security Best Practices

### Enable Row Level Security (RLS)

**Critical:** Tables without RLS enabled allow any client to access and modify data.

```sql
-- Enable RLS on your table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view their own data"
ON your_table
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

**Best Practices:**
- ✅ Enable RLS on ALL tables in the public schema
- ✅ Tables created via Dashboard have RLS enabled by default
- ✅ Tables created via SQL editor require manual RLS enabling
- ✅ Test policies thoroughly before production
- ❌ Never expose tables without RLS policies

### Manage Replication and Publications

Enable replication on tables containing sensitive data:

1. Go to **Authentication > Policies** to enable RLS and create policies
2. Go to **Database > Publications** to manage replication tables
3. Only replicate necessary data to minimize exposure

### Network Security

1. **Enable SSL Enforcement**
   - Force all connections to use SSL/TLS
   - Navigate to Settings > Database > SSL Enforcement

2. **Enable Network Restrictions**
   - Restrict database access by IP address
   - Configure in Settings > Database > Network Restrictions
   - Whitelist only trusted IPs

3. **Use Multi-Factor Authentication (MFA)**
   - Enable MFA on your Supabase account
   - If using GitHub signin, enable 2FA on GitHub
   - Use TOTP apps or U2F keys for maximum security

4. **MFA Enforcement for Organizations**
   - Require all org members to use MFA
   - Settings > Organization > Security

### API Key Management

**Best Practices:**
- ✅ Only expose `anon` key to frontend (safe with RLS enabled)
- ❌ NEVER expose `service_role` key on frontend
- ✅ Treat service_role key as a secret
- ✅ Store keys in encrypted environment variables
- ✅ Rotate keys periodically
- ✅ Revoke compromised keys immediately

### Authentication Configuration

1. **Email Confirmations**
   - Enable email confirmations: Settings > Auth
   - Prevents unauthorized account creation

2. **OTP Expiry Settings**
   - Set OTP expiry to 3600 seconds (1 hour) or lower
   - Balance security with user experience
   - Increase OTP length for higher entropy if needed

3. **Multi-Factor Authentication for Users**
   - Implement MFA for applications requiring higher security
   - Use Supabase Auth MFA features
   - Provides additional layer of protection

4. **Custom SMTP for Auth Emails**
   - Use custom SMTP server (SendGrid, AWS SES, etc.)
   - Users see emails from trusted domain
   - Improves deliverability and trust

### Security Audit Practices

1. **Regular Security Reviews**
   - Check Security Advisor in Dashboard
   - Review common cybersecurity threats
   - Think like an attacker to identify vulnerabilities

2. **Abuse Prevention**
   - Enable CAPTCHA on signup, signin, password reset
   - Implement rate limiting
   - Monitor for suspicious patterns

3. **Email Link Validity**
   - Configure for enterprise email scanners
   - Use intermediary pages for magic links
   - Disable link tracking in SMTP services

---

## Performance Optimization

### Database Indexing

**Critical:** Proper indexing dramatically improves query performance.

```sql
-- Example: Index for common query patterns
CREATE INDEX idx_user_id ON your_table(user_id);
CREATE INDEX idx_created_at ON your_table(created_at DESC);
CREATE INDEX idx_composite ON your_table(user_id, status);
```

**Best Practices:**
- ✅ Index columns used in WHERE clauses
- ✅ Index columns used in JOIN operations
- ✅ Index columns used in ORDER BY
- ✅ Use pg_stat_statements to identify slow queries
- ✅ Monitor index usage and remove unused indexes

**Identifying Hot and Slow Queries:**
```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slowest queries
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Database Sizing and Resources

1. **Upgrade Database When Needed**
   - Monitor resource usage in Dashboard
   - Upgrade before hitting limits
   - Contact enterprise@supabase.io for custom needs

2. **Plan for Traffic Surges**
   - If on Team/Enterprise plan, contact support 2 weeks before launch
   - Provide details about expected traffic
   - Team will monitor and help optimize

3. **Point in Time Recovery (PITR)**
   - Enable PITR if database size > 4GB
   - Daily backups consume resources during backup
   - PITR is more efficient (backs up only changes)
   - Provides better RPO (Recovery Point Objective)

### Load Testing

Perform load testing preferably on staging environment:
- Use tools like k6 to simulate traffic
- Test various user scenarios
- Identify bottlenecks before production
- Validate performance under expected load

### Connection Management

- Use connection pooling (automatically handled by Supabase hosted)
- Monitor connection counts
- Optimize query patterns to reduce connections
- Use Read Replicas for read-heavy workloads

---

## Availability and Reliability

### SMTP Configuration

**Critical:** Use custom SMTP for production applications.

**Benefits:**
- Full control over email deliverability
- Professional appearance (emails from your domain)
- Higher delivery rates
- Better monitoring and debugging

**Configuration:**
1. Get SMTP credentials from provider (SendGrid, AWS SES, Mailgun, Resend)
2. Configure in Settings > Auth > SMTP Settings
3. Test thoroughly before launch

**Rate Limiting:**
- Default: 30 new users per hour with custom SMTP
- For major launches, request higher limits in advance
- Plan email campaigns accordingly

### Project Activity and Pausing

**Free Plan Considerations:**
- Extremely low activity projects may be paused after 7 days
- Restore paused projects from Dashboard
- Upgrade to Pro to prevent automatic pausing

### Backup Strategy

**Free Plan:**
- No backups available for download
- Set up own backup systems using:
  - `pg_dump` for manual backups
  - `wal-g` for continuous archiving

**Pro Plan:**
- Nightly backups for up to 7 days
- Accessible from Dashboard
- Suitable for projects willing to lose up to 24 hours of data

**Point in Time Recovery (PITR):**
- Backup at much shorter intervals
- Restore to any point in time (seconds granularity)
- Lower RPO than daily backups
- Enable for mission-critical applications

### Disk Durability and Read Replicas

**Default Durability:**
- Supabase disks offer 99.8-99.9% durability

**High Availability Options:**
- Use Read Replicas for availability resilience
- Use PITR for durability resilience
- Consider both for mission-critical systems

### Support Access

- Pro Plan provides access to support team
- Submit tickets through Dashboard
- Faster response times for critical issues

---

## Rate Limiting, Resource Allocation & Abuse Prevention

### Platform Safeguards

Supabase employs multiple safeguards against traffic bursts:
- CDN-level protection
- Authentication rate limits
- Realtime quotas
- Automatic abuse prevention

### High Load Event Planning

**For Team/Enterprise Plans:**
- Contact support at least 2 weeks before:
  - Production launches
  - Heavy load testing
  - Expected high traffic events
- Provide detailed information about expected load
- Team will help monitor and optimize

### Auth Rate Limits

**Configurable Endpoints** (Dashboard > Auth > Rate Limits):

| Endpoint Type | Default Limit | Configuration |
|--------------|---------------|---------------|
| All email endpoints (signup, recover, etc.) | 2 emails per hour | Requires custom SMTP |
| /auth/v1/otp | Configurable | Per project |
| /auth/v1/signup | Configurable | Per project |
| /auth/v1/token | Configurable | Per project |
| Factor challenges/verify | Configurable | Per project |

### Realtime Quotas

Review and understand Realtime quotas:
- Check Dashboard for current limits
- Monitor usage patterns
- Contact support to increase quotas if needed

### CAPTCHA Protection

Enable CAPTCHA to prevent abuse:
- Signup endpoint
- Sign-in endpoint  
- Password reset endpoint
- Refer to official documentation for implementation

---

## Row Level Security (RLS)

### Understanding RLS

RLS is Postgres's powerful rule engine that restricts which rows users can access. Each policy is attached to a table and executed on every table access.

**Key Benefits:**
- Granular authorization at database level
- Works seamlessly with Supabase Auth
- Provides "defense in depth" security
- Flexible and powerful SQL-based rules

### RLS Policy Structure

```sql
-- Basic policy structure
CREATE POLICY "policy_name"
ON table_name
FOR operation  -- SELECT, INSERT, UPDATE, DELETE, or ALL
TO role       -- authenticated, anon, or specific role
USING (condition)        -- For SELECT and DELETE
WITH CHECK (condition);  -- For INSERT and UPDATE
```

### Common RLS Patterns

#### 1. User-Specific Data Access

```sql
-- Users can only see their own data
CREATE POLICY "Users view own data"
ON profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

#### 2. Team/Organization-Based Access

```sql
-- Users can access team data
CREATE POLICY "Team member access"
ON documents
FOR SELECT
TO authenticated
USING (
    team_id IN (
        SELECT team_id 
        FROM team_members 
        WHERE user_id = (SELECT auth.uid())
    )
);
```

#### 3. Role-Based Access Control

```sql
-- Function to check role
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

-- Policy using role check
CREATE POLICY "Admins full access"
ON sensitive_data
FOR ALL
TO authenticated
USING ((SELECT has_role('admin')));
```

#### 4. Public Read, Authenticated Write

```sql
-- Anyone can read, only authenticated can write
CREATE POLICY "Public read access"
ON blog_posts
FOR SELECT
TO anon, authenticated
USING (published = true);

CREATE POLICY "Author can edit"
ON blog_posts
FOR UPDATE
TO authenticated
USING (author_id = (SELECT auth.uid()));
```

### RLS Helper Functions

**auth.uid()**: Returns the user ID from JWT
```sql
(SELECT auth.uid())
```

**auth.jwt()**: Returns the full JWT
```sql
-- Access custom claims
(SELECT auth.jwt()->>'custom_claim')
```

**Important Distinctions:**
- `raw_user_meta_data`: Can be updated by user (NOT secure for authorization)
- `raw_app_meta_data`: Cannot be updated by user (SECURE for authorization)

### RLS Best Practices

1. **Always Specify Role with TO**
   ```sql
   -- ✅ Good: Explicit role
   TO authenticated
   
   -- ❌ Bad: No role specified
   TO PUBLIC
   ```

2. **Use Security Definer Functions for Complex Logic**
   ```sql
   CREATE FUNCTION check_access()
   RETURNS boolean
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
       -- Complex authorization logic
       RETURN true;
   END;
   $$;
   ```

3. **Test Policies Thoroughly**
   ```sql
   -- Test as specific user
   SET session role authenticated;
   SET request.jwt.claims TO '{"sub":"user-id-here"}';
   
   -- Run queries to test
   SELECT * FROM your_table;
   
   -- Reset
   SET session role postgres;
   ```

4. **Avoid Joins in Policies When Possible**
   ```sql
   -- ❌ Slow: Joins in policy
   USING (
       auth.uid() IN (
           SELECT user_id FROM teams 
           WHERE teams.id = table.team_id
       )
   )
   
   -- ✅ Fast: Pre-fetch into set
   USING (
       team_id IN (
           SELECT team_id FROM teams 
           WHERE user_id = auth.uid()
       )
   )
   ```

---

## RLS Performance Optimization

### Performance Impact

RLS has significant performance impact, especially on queries that scan all rows (SELECT with LIMIT, OFFSET, ORDER BY).

### Diagnostic: Is RLS Causing Performance Issues?

```sql
-- Test with RLS enabled
SET session role authenticated;
SET request.jwt.claims TO '{"sub":"user-id"}';
EXPLAIN ANALYZE SELECT * FROM your_table;

-- Test with RLS bypassed
SET session role postgres;
EXPLAIN ANALYZE SELECT * FROM your_table;

-- Compare execution times
```

If times are similar, the query itself is the issue, not RLS.

### Optimization Technique #1: Index RLS Columns

**Critical:** Index any columns used in RLS policies.

```sql
-- RLS Policy
CREATE POLICY "user_access" ON test_table
TO authenticated
USING (auth.uid() = user_id);

-- Add Index
CREATE INDEX idx_user_id ON test_table USING btree (user_id);
```

**Impact:** Can improve performance 100x+ on large tables.

### Optimization Technique #2: Wrap Functions in SELECT

Wrapping functions causes an `initPlan` allowing the optimizer to "cache" results.

**WARNING:** Only use if function results don't change based on row data.

```sql
-- ❌ Slow: Function called per row
USING (is_admin() OR auth.uid() = user_id)

-- ✅ Fast: Function wrapped in SELECT
USING ((SELECT is_admin()) OR (SELECT auth.uid()) = user_id)
```

**Performance Example:**
- Before: 11,000ms
- After: 10ms

### Optimization Technique #3: Don't Rely on RLS for Filtering

Use explicit filters IN ADDITION to RLS:

```javascript
// ❌ Only RLS filters
const { data } = await supabase
    .from('table')
    .select();

// ✅ Add explicit filter
const { data } = await supabase
    .from('table')
    .select()
    .eq('user_id', userId);
```

RLS still provides security, but explicit filter improves performance.

### Optimization Technique #4: Use Security Definer Functions

Bypass RLS on join tables using security definer functions:

```sql
-- Create function
CREATE FUNCTION user_teams()
RETURNS int[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN ARRAY(
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
    );
END;
$$;

-- Use in policy (wrapped in SELECT per #2)
USING (team_id = ANY(ARRAY(SELECT user_teams())))
```

**Security Note:**
- Functions can be called from API
- Put sensitive functions in private schema
- Or use RLS on the function itself

### Optimization Technique #5: Optimize Join Queries

**Compare row columns to fixed join data**, not the other way around.

```sql
-- ❌ Very Slow: Row column in subquery WHERE
USING (
    auth.uid() IN (
        SELECT user_id FROM teams
        WHERE teams.team_id = table.team_id  -- Row reference
    )
)

-- ✅ Fast: Filter subquery, then check row
USING (
    team_id IN (
        SELECT team_id FROM teams
        WHERE user_id = auth.uid()  -- No row reference
    )
)
```

**Performance Example:**
- Slow approach: 9,000ms
- Fast approach: 20ms

**Additional Optimization:**
```sql
-- Combine with security definer (even faster)
USING (team_id IN (SELECT user_teams()))
```

**Note:** If IN list exceeds 10,000 items, additional analysis needed.

### Optimization Technique #6: Always Use TO Role

```sql
-- ❌ Bad: No role specified
-- Forces database to process RLS for anon users
CREATE POLICY "policy" ON table
USING (auth.uid() = user_id);

-- ✅ Good: Explicit role
-- Anon users immediately blocked
CREATE POLICY "policy" ON table
TO authenticated
USING (auth.uid() = user_id);
```

While this doesn't improve performance for authenticated users, it prevents unnecessary processing for anonymous users.

### Performance Testing Sample Results

| Test | Before RLS | After Optimization | Improvement |
|------|-----------|-------------------|-------------|
| Index on user_id | 171ms | <0.1ms | 1700x |
| Wrap auth.uid() in SELECT | 179ms | 9ms | 20x |
| Wrap is_admin() with join | 11,000ms | 7ms | 1571x |
| Wrap complex OR | 11,000ms | 10ms | 1100x |
| Security definer function | 178,000ms | 12ms | 14,833x |
| Optimize array function | 173,000ms | 16ms | 10,812x |
| Join optimization | 9,000ms | 20ms | 450x |

### Measuring RLS Performance

#### Method 1: SQL EXPLAIN ANALYZE

```sql
-- Set up user context
SET session role authenticated;
SET request.jwt.claims TO '{
    "role":"authenticated", 
    "sub":"user-id-here"
}';

-- Analyze query
EXPLAIN ANALYZE SELECT count(*) FROM your_table;

-- Reset
SET session role postgres;
```

Look for **Execution Time** in results.

#### Method 2: PostgREST Explain (Supabase Clients)

```sql
-- Enable in Dashboard SQL Editor (not for production!)
ALTER ROLE authenticator SET pgrst.db_plan_enabled TO true;
NOTIFY pgrst, 'reload config';
```

```javascript
// Use .explain() in client
const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', 1)
    .explain({ analyze: true });

console.log(data);
```

---

## Database Management

### Maturity Model: Development Practices

#### Prototyping Stage
- ✅ Use Dashboard for rapid iteration
- ✅ Make direct changes for speed
- ✅ Focus on validating ideas

#### Production Stage
- ✅ Use migrations for all changes
- ✅ All changes in version control
- ✅ Use CLI to capture Dashboard changes
- ❌ Never make direct production changes

### Migration Workflow

```bash
# Capture Dashboard changes
supabase db pull

# Create new migration
supabase migration new your_migration_name

# Apply to local
supabase db reset

# Apply to production
supabase db push
```

### Managing Multiple Environments

**Recommended Setup:**
- Local development environment
- Staging environment
- Production environment

**Best Practices:**
- Same schema across all environments
- Test in staging before production
- Never apply migrations directly to production
- Use CI/CD pipelines for deployment

### Shared Responsibility Model

**Your Responsibilities:**
- Database schema design
- Query optimization
- Index management
- Connection management
- Access control (RLS policies)
- Backup strategy (Free Plan)
- Monitoring and alerts

**Supabase's Responsibilities:**
- Infrastructure management
- Postgres optimization (managed platform)
- Physical backups
- Security patches
- Platform availability
- Base monitoring tools

---

## Monitoring and Observability

### Key Metrics to Monitor

1. **Database Performance**
   - Query execution time
   - Connection pool usage
   - Disk usage
   - CPU and memory utilization

2. **API Performance**
   - Request latency
   - Error rates
   - Rate limit hits
   - Auth failures

3. **Storage Metrics**
   - Storage usage
   - Upload/download patterns
   - Access patterns

### Using Dashboard Tools

1. **Performance Advisor**
   - Identifies slow queries
   - Suggests missing indexes
   - Highlights performance issues

2. **Security Advisor**
   - Checks for RLS issues
   - Identifies exposed tables
   - Suggests security improvements

### Enable pg_stat_statements

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Monitor query performance
SELECT 
    query,
    calls,
    mean_exec_time,
    total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### External Monitoring (Self-Hosted)

For self-hosted instances:
- Datadog integration
- Grafana dashboards
- OpenTelemetry
- CloudWatch (AWS)

### Supabase Status Page

**Subscribe for Updates:**
- Visit https://status.supabase.com/
- Set up Slack notifications via RSS
- Receive automatic alerts for service changes

**Setup Slack Notifications:**
1. Install RSS app in Slack
2. Add feed: https://status.supabase.com/history.rss
3. Configure channel for updates

---

## Advanced Topics

### Security Definer Functions Best Practices

```sql
-- Set search_path to empty for security
CREATE FUNCTION your_function()
RETURNS return_type
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Use fully qualified names
    SELECT * FROM public.your_table;
END;
$$;

-- Set appropriate permissions
REVOKE ALL ON FUNCTION your_function() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION your_function() TO authenticated;
```

### Bypassing RLS for Admin Operations

```sql
-- Create admin role with bypass privilege
CREATE ROLE admin_role BYPASSRLS;

-- Or set on existing role
ALTER ROLE your_role WITH BYPASSRLS;
```

**Warning:** Never share credentials for roles with BYPASSRLS.

### Storage Access Control

Storage uses RLS on metadata tables:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'my_bucket'
    AND (storage.foldername(name))[1] = 'private'
);

-- Allow users to access their own files
CREATE POLICY "User access own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'my_bucket'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Real-Time Subscriptions with RLS

RLS policies apply to real-time subscriptions:

```sql
-- Policy affects both queries and subscriptions
CREATE POLICY "Real-time access"
ON messages
FOR SELECT
TO authenticated
USING (
    recipient_id = auth.uid()
    OR sender_id = auth.uid()
);
```

---

## Production Deployment Checklist

### Pre-Launch

- [ ] Enable RLS on all public schema tables
- [ ] Create and test all RLS policies
- [ ] Add indexes for common query patterns
- [ ] Configure custom SMTP server
- [ ] Enable SSL enforcement
- [ ] Set up network restrictions
- [ ] Enable MFA on Supabase account
- [ ] Configure auth settings (OTP expiry, email confirmation)
- [ ] Set up CAPTCHA protection
- [ ] Review Security Advisor recommendations
- [ ] Review Performance Advisor recommendations
- [ ] Load test on staging environment
- [ ] Upgrade database if needed
- [ ] Enable PITR if database > 4GB
- [ ] Configure backups
- [ ] Set up monitoring and alerts
- [ ] Document RLS policies
- [ ] Train team on security best practices

### Post-Launch

- [ ] Monitor performance metrics
- [ ] Review Security Advisor regularly
- [ ] Check auth rate limits
- [ ] Monitor disk usage
- [ ] Review slow query logs
- [ ] Test backup restoration
- [ ] Update documentation
- [ ] Schedule regular security reviews
- [ ] Subscribe to Supabase status updates

---

## Troubleshooting Common Issues

### RLS Policy Not Working

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- View existing policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test policy as user
SET session role authenticated;
SET request.jwt.claims TO '{"sub":"user-id"}';
SELECT * FROM your_table;
```

### Slow Query Performance

1. Check if RLS is the issue (compare with/without)
2. Add missing indexes
3. Optimize RLS policies using techniques above
4. Check for N+1 queries
5. Use connection pooling
6. Consider Read Replicas

### High Connection Count

- Implement connection pooling
- Optimize query patterns
- Check for connection leaks
- Use serverless connection management
- Consider upgrading database size

---

## Additional Resources

- [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [RLS Performance Guide](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices)
- [Shared Responsibility Model](https://supabase.com/docs/guides/deployment/shared-responsibility-model)
- [Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments)
- [Security Documentation](https://supabase.com/security)

---

*This document is regularly updated. Check back frequently for new best practices and recommendations.*
