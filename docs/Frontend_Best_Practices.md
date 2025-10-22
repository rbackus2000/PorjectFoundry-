# Frontend Architecture Best Practices for Supabase

## Introduction

This guide covers best practices for building frontend applications with Supabase, focusing on architecture, security, performance, and maintainability. Whether you're building with React, Next.js, Vue, Angular, or other frameworks, these practices will help you create robust, scalable applications.

## Table of Contents

1. [Supabase Architecture Overview](#supabase-architecture-overview)
2. [Frontend Integration Patterns](#frontend-integration-patterns)
3. [Project Structure Best Practices](#project-structure-best-practices)
4. [Authentication Integration](#authentication-integration)
5. [Data Fetching Strategies](#data-fetching-strategies)
6. [Real-Time Subscriptions](#real-time-subscriptions)
7. [Storage and File Handling](#storage-and-file-handling)
8. [Security Best Practices](#security-best-practices)
9. [Performance Optimization](#performance-optimization)
10. [Framework-Specific Patterns](#framework-specific-patterns)

---

## Supabase Architecture Overview

### Understanding Supabase Components

Supabase provides a complete backend solution with:
- **PostgreSQL Database**: Relational database with automatic API generation
- **Auth (GoTrue)**: User authentication and management
- **Storage**: S3-compatible object storage
- **PostgREST**: Automatic REST API from database schema
- **Realtime**: WebSocket connections for live updates
- **Edge Functions**: Serverless TypeScript/Deno functions

### The Supabase Philosophy

Supabase follows key architectural principles:

1. **Each tool works standalone**: Any component can be used independently
2. **Composability**: Products integrate to 10x each other's value
3. **Deliberate tool selection**: Extend existing tools rather than adding new ones
4. **Open source foundation**: Built on enterprise-ready open source tools

---

## Frontend Integration Patterns

### The BaaS (Backend-as-a-Service) Approach

Supabase enables a modern web architecture without manually building a backend:

**Traditional Architecture:**
```
Frontend → Backend API → Database
        → Auth Service
        → File Storage
```

**Supabase Architecture:**
```
Frontend → Supabase (All-in-one)
           ├── Auto-generated APIs
           ├── Built-in Auth
           ├── Storage
           └── Real-time
```

### Serverless APIs: The Game Changer

Every table, view, and function is automatically mapped to:
- RESTful API
- GraphQL API (Beta)
- Real-time subscriptions

**Security Through RLS:**
Direct frontend-to-database access is secured via PostgreSQL's Row Level Security (RLS):

```sql
-- Users can only see their own posts
CREATE POLICY "user_posts" ON posts
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- All users can read published posts
CREATE POLICY "public_posts" ON posts
FOR SELECT TO anon, authenticated
USING (published = true);
```

### Client-Side vs Server-Side

**When to use client-side Supabase client:**
- Real-time features
- User-facing queries with RLS
- Interactive UI components
- Authentication flows

**When to use server-side:**
- Admin operations
- Background jobs
- Complex business logic
- Operations bypassing RLS

---

## Project Structure Best Practices

### Recommended Directory Structure

```
/src
  /app                    # Next.js App Router (if using Next.js)
    /api
      /[route]
        route.ts          # API endpoints
    /(pages)              # Page routes
  /components
    /ui                   # Reusable UI components
    /features             # Feature-specific components
    /layouts              # Layout components
  /lib
    /supabase             # Supabase client configuration
      client.ts           # Client-side Supabase client
      server.ts           # Server-side Supabase client
      middleware.ts       # Auth middleware
    /hooks                # Custom React hooks
    /utils                # Utility functions
    /types                # TypeScript types
  /stores                 # State management (Zustand, Redux, etc.)
  /styles                 # Global styles and Tailwind config
```

### Organizing Supabase Code

**Create dedicated Supabase utilities:**

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**For Next.js with SSR:**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
```

### Separate Concerns

**Follow single responsibility principle:**

```typescript
// ✅ Good: Separate concerns
/lib
  /supabase
    client.ts              # Client initialization
    auth.ts                # Auth-specific functions
    database.ts            # Database queries
    storage.ts             # Storage operations
    realtime.ts            # Real-time subscriptions

// ❌ Bad: Everything in one file
/lib
  supabase.ts             # All Supabase code
```

---

## Authentication Integration

### Setting Up Authentication

```typescript
// lib/supabase/auth.ts
import { supabase } from './client';

export const auth = {
  // Sign up
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // OAuth providers
  async signInWithOAuth(provider: 'google' | 'github' | 'azure') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },
};
```

### React Hook for Auth State

```typescript
// lib/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

### Protected Routes Pattern

```typescript
// components/layouts/ProtectedLayout.tsx
'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

### Multi-Factor Authentication (MFA)

```typescript
// lib/supabase/mfa.ts
import { supabase } from './client';

export const mfa = {
  // Enroll MFA
  async enroll() {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });
    return { data, error };
  },

  // Verify MFA
  async verify(factorId: string, code: string) {
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      code,
    });
    return { data, error };
  },

  // Challenge MFA
  async challenge(factorId: string) {
    const { data, error } = await supabase.auth.mfa.challenge({
      factorId,
    });
    return { data, error };
  },
};
```

---

## Data Fetching Strategies

### Basic Query Patterns

```typescript
// lib/supabase/database.ts
import { supabase } from './client';

export const db = {
  // Select all
  async getAll(table: string) {
    const { data, error } = await supabase
      .from(table)
      .select('*');
    return { data, error };
  },

  // Select with filter
  async getByUserId(table: string, userId: string) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId);
    return { data, error };
  },

  // Insert
  async insert(table: string, values: any) {
    const { data, error } = await supabase
      .from(table)
      .insert(values)
      .select();
    return { data, error };
  },

  // Update
  async update(table: string, id: string, values: any) {
    const { data, error } = await supabase
      .from(table)
      .update(values)
      .eq('id', id)
      .select();
    return { data, error };
  },

  // Delete
  async delete(table: string, id: string) {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    return { data, error };
  },
};
```

### React Query Integration

```typescript
// lib/hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newProject: any) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

### Server-Side Data Fetching (Next.js)

```typescript
// app/projects/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function ProjectsPage() {
  const supabase = createClient();
  
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      {projects?.map((project) => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
}
```

### Pagination Pattern

```typescript
// lib/hooks/usePaginatedData.ts
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function usePaginatedData(table: string, pageSize: number = 10) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    const start = page * pageSize;
    const end = start + pageSize - 1;

    const { data: newData, error } = await supabase
      .from(table)
      .select('*')
      .range(start, end);

    if (newData) {
      setData((prev) => [...prev, ...newData]);
      setHasMore(newData.length === pageSize);
      setPage((p) => p + 1);
    }

    setLoading(false);
  };

  return { data, loadMore, hasMore, loading };
}
```

---

## Real-Time Subscriptions

### Setting Up Subscriptions

```typescript
// lib/supabase/realtime.ts
import { supabase } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function subscribeToTable(
  table: string,
  callback: (payload: any) => void
): RealtimeChannel {
  return supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      callback
    )
    .subscribe();
}

export function subscribeToInserts(
  table: string,
  callback: (payload: any) => void
): RealtimeChannel {
  return supabase
    .channel(`public:${table}:insert`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table },
      callback
    )
    .subscribe();
}

export function subscribeToUpdates(
  table: string,
  filter: string,
  callback: (payload: any) => void
): RealtimeChannel {
  return supabase
    .channel(`public:${table}:update:${filter}`)
    .on(
      'postgres_changes',
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table,
        filter,
      },
      callback
    )
    .subscribe();
}
```

### React Hook for Subscriptions

```typescript
// lib/hooks/useRealtimeSubscription.ts
import { useEffect, useState } from 'react';
import { subscribeToTable } from '@/lib/supabase/realtime';

export function useRealtimeSubscription<T>(
  table: string,
  initialData: T[] = []
) {
  const [data, setData] = useState<T[]>(initialData);

  useEffect(() => {
    const channel = subscribeToTable(table, (payload) => {
      if (payload.eventType === 'INSERT') {
        setData((current) => [...current, payload.new as T]);
      } else if (payload.eventType === 'UPDATE') {
        setData((current) =>
          current.map((item: any) =>
            item.id === payload.new.id ? payload.new : item
          )
        );
      } else if (payload.eventType === 'DELETE') {
        setData((current) =>
          current.filter((item: any) => item.id !== payload.old.id)
        );
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [table]);

  return data;
}
```

### Presence Tracking

```typescript
// lib/hooks/usePresence.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function usePresence(channelName: string) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    const channel = supabase.channel(channelName, {
      config: { presence: { key: '' } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat();
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [channelName]);

  return onlineUsers;
}
```

---

## Storage and File Handling

### File Upload Pattern

```typescript
// lib/supabase/storage.ts
import { supabase } from './client';

export const storage = {
  async upload(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
    return { data, error };
  },

  async uploadWithProgress(
    bucket: string,
    path: string,
    file: File,
    onProgress: (progress: number) => void
  ) {
    const chunkSize = 6 * 1024 * 1024; // 6MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const { error } = await supabase.storage
        .from(bucket)
        .upload(`${path}.part${i}`, chunk);
      
      if (error) return { data: null, error };
      
      onProgress(((i + 1) / totalChunks) * 100);
    }
    
    return { data: { path }, error: null };
  },

  async download(bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    return { data, error };
  },

  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  async createSignedUrl(bucket: string, path: string, expiresIn: number) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    return { data, error };
  },

  async delete(bucket: string, paths: string[]) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths);
    return { data, error };
  },
};
```

### React File Upload Component

```typescript
// components/FileUpload.tsx
'use client';

import { useState } from 'react';
import { storage } from '@/lib/supabase/storage';

export function FileUpload({ bucket, onUploadComplete }: any) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const filePath = `${Date.now()}-${file.name}`;

    const { error } = await storage.uploadWithProgress(
      bucket,
      filePath,
      file,
      setProgress
    );

    setUploading(false);
    
    if (!error) {
      const publicUrl = storage.getPublicUrl(bucket, filePath);
      onUploadComplete?.(publicUrl);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <div>Progress: {progress.toFixed(0)}%</div>}
    </div>
  );
}
```

---

## Security Best Practices

### API Key Management

```typescript
// ✅ Good: Environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ❌ Bad: Hardcoded keys
const supabase = createClient(
  'https://xxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);
```

### Never Expose Service Role Key

```typescript
// ❌ NEVER do this in frontend
const supabase = createClient(
  url,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // This bypasses RLS!
);

// ✅ Use service role ONLY in server-side code
// app/api/admin/route.ts
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  // Only use service role in secure server environment
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Perform admin operations
  // ...
}
```

### Client-Side RLS Reliance

Always rely on RLS for security, not client-side checks:

```typescript
// ❌ Bad: Client-side authorization
if (userRole === 'admin') {
  // Show sensitive data
}

// ✅ Good: RLS handles authorization
// Database policy ensures only admins can access
const { data } = await supabase
  .from('sensitive_data')
  .select('*');
// RLS policy automatically filters results
```

### Input Validation

```typescript
// lib/utils/validation.ts
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, ''); // Basic XSS prevention
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Use in forms
const handleSubmit = async (email: string) => {
  if (!validateEmail(email)) {
    return { error: 'Invalid email' };
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: sanitizeInput(email),
    password,
  });
};
```

### CORS and Content Security

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

---

## Performance Optimization

### Query Optimization

```typescript
// ❌ Bad: N+1 queries
for (const user of users) {
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id);
}

// ✅ Good: Join query
const { data } = await supabase
  .from('users')
  .select(`
    *,
    posts(*)
  `);
```

### Selective Field Selection

```typescript
// ❌ Bad: Select all fields
const { data } = await supabase
  .from('users')
  .select('*');

// ✅ Good: Select only needed fields
const { data } = await supabase
  .from('users')
  .select('id, name, email');
```

### Caching Strategy

```typescript
// With React Query
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

### Connection Pooling

```typescript
// Supabase handles connection pooling automatically
// But you can optimize by reusing client instances

// ✅ Good: Single client instance
// lib/supabase/client.ts
export const supabase = createClient(url, key);

// ❌ Bad: Creating new clients
// Every component creating new client instances
```

### Image Optimization

```typescript
// lib/utils/image.ts
export function getOptimizedImageUrl(
  bucket: string,
  path: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
) {
  const { width = 800, height = 600, quality = 80 } = options;
  
  const baseUrl = storage.getPublicUrl(bucket, path);
  
  // Use transformation service or CDN
  return `${baseUrl}?width=${width}&height=${height}&quality=${quality}`;
}
```

---

## Framework-Specific Patterns

### React / Next.js App Router

```typescript
// app/layout.tsx - Root layout with auth provider
import { createClient } from '@/lib/supabase/server';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html>
      <body>
        <AuthProvider session={session}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

// app/api/auth/callback/route.ts - OAuth callback
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(requestUrl.origin);
}
```

### Vue 3 Composition API

```typescript
// composables/useSupabase.ts
import { ref, onMounted, onUnmounted } from 'vue';
import { supabase } from '@/lib/supabase';

export function useSupabaseQuery(table: string) {
  const data = ref([]);
  const loading = ref(true);
  const error = ref(null);

  onMounted(async () => {
    const { data: result, error: err } = await supabase
      .from(table)
      .select('*');
    
    data.value = result || [];
    error.value = err;
    loading.value = false;
  });

  return { data, loading, error };
}
```

### Angular Service Pattern

```typescript
// services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async getProjects() {
    return await this.supabase
      .from('projects')
      .select('*');
  }
}
```

---

## Testing Best Practices

### Mocking Supabase Client

```typescript
// lib/supabase/__mocks__/client.ts
export const supabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => Promise.resolve({ data: [], error: null })),
    insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
    update: jest.fn(() => Promise.resolve({ data: null, error: null })),
    delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
  })),
  auth: {
    signIn: jest.fn(() => Promise.resolve({ data: null, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
  },
};
```

### Integration Testing

```typescript
// __tests__/integration/auth.test.ts
import { createClient } from '@supabase/supabase-js';

describe('Authentication Flow', () => {
  const supabase = createClient(
    process.env.TEST_SUPABASE_URL!,
    process.env.TEST_SUPABASE_ANON_KEY!
  );

  afterEach(async () => {
    await supabase.auth.signOut();
  });

  it('should sign up a new user', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
  });
});
```

---

## Error Handling Patterns

### Centralized Error Handler

```typescript
// lib/utils/error-handler.ts
export function handleSupabaseError(error: any) {
  if (!error) return null;

  // Log error
  console.error('Supabase Error:', error);

  // Map to user-friendly messages
  const errorMessages: Record<string, string> = {
    'invalid_credentials': 'Invalid email or password',
    'email_not_confirmed': 'Please confirm your email',
    'user_already_exists': 'An account with this email already exists',
  };

  return errorMessages[error.code] || 'An unexpected error occurred';
}

// Usage
const { data, error } = await supabase.auth.signIn(credentials);
const errorMessage = handleSupabaseError(error);
if (errorMessage) {
  showToast(errorMessage);
}
```

### React Error Boundary

```typescript
// components/ErrorBoundary.tsx
export class SupabaseErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Supabase Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please try again.</div>;
    }

    return this.props.children;
  }
}
```

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase GitHub Examples](https://github.com/supabase/supabase/tree/master/examples)
- [Next.js + Supabase Starter](https://vercel.com/templates/next.js/supabase)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [Supabase Client Libraries](https://supabase.com/docs/reference/javascript/introduction)

---

## Key Takeaways

1. **Use RLS for Security**: Never bypass RLS on frontend; it's your security layer
2. **Separate Client/Server Code**: Use appropriate Supabase clients for each context
3. **Optimize Queries**: Select only needed fields, use joins, avoid N+1 queries
4. **Handle Errors Gracefully**: Provide user-friendly error messages
5. **Test Thoroughly**: Mock Supabase in tests, use test environments
6. **Follow Framework Patterns**: Leverage framework-specific patterns and best practices
7. **Monitor Performance**: Use React Query for caching, optimize real-time subscriptions
8. **Organize Code Well**: Separate concerns, maintain clean architecture
9. **Secure API Keys**: Never expose service role keys, use environment variables
10. **Stay Updated**: Follow Supabase updates and best practices

---

*This guide is continuously updated. Check the official Supabase documentation for the latest features and recommendations.*
