# Kế Hoạch Chi Tiết: Chuyển Đổi Từ Firebase Sang Supabase
## OrgChart TTI SHTP Project

---

## 📋 MỤC LỤC
1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Phân Tích Hiện Trạng Firebase](#2-phân-tích-hiện-trạng-firebase)
3. [Thiết Kế Database Schema Supabase](#3-thiết-kế-database-schema-supabase)
4. [Kế Hoạch Migration Chi Tiết](#4-kế-hoạch-migration-chi-tiết)
5. [Checklist Testing](#5-checklist-testing)
6. [Timeline Dự Kiến](#6-timeline-dự-kiến)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Công Nghệ Hiện Tại
- **Framework**: Next.js 15.1.9
- **Database**: Firebase Firestore
- **Authentication**: Firebase Anonymous Auth
- **Data Fetching**: SWR + Custom Caching
- **Language**: TypeScript

### 1.2 Lý Do Chuyển Sang Supabase
- Chi phí Firebase reads cao
- Cần SQL queries mạnh mẽ hơn
- Row Level Security (RLS) tốt hơn
- Real-time subscriptions tối ưu hơn
- PostgreSQL cho complex queries

---

## 2. PHÂN TÍCH HIỆN TRẠNG FIREBASE

### 2.1 Collections Trong Firestore

| Collection | Mục Đích | Số Document Ước Tính |
|------------|----------|---------------------|
| `users` | Quản lý tài khoản người dùng | ~20-50 |
| `employees` | Dữ liệu nhân viên từ HR | ~500-2000 |
| `Orgchart_data` | Dữ liệu sơ đồ tổ chức (đã transform) | ~600-2500 |
| `orgcharts` | Sơ đồ tùy chỉnh của user | ~10-50 |

### 2.2 Các File Sử Dụng Firebase

#### **Core Configuration**
| File | Chức Năng |
|------|-----------|
| `src/lib/firebase.ts` | Khởi tạo Firebase App, Auth, Firestore |
| `.env.local` | Cấu hình environment variables |

#### **API Routes (Server-side)**
| File | Operations | Collections |
|------|------------|-------------|
| `src/app/api/users/route.ts` | GET (list users) | `users` |
| `src/app/api/sheet/route.ts` | GET, POST, PUT, DELETE | `employees` |
| `src/app/api/orgchart/route.ts` | GET | `Orgchart_data` |
| `src/app/api/orgcharts/route.ts` | GET, POST | `orgcharts` |
| `src/app/api/orgcharts/[id]/route.ts` | GET, PUT, DELETE | `orgcharts` |
| `src/app/api/sync-orgchart/route.ts` | POST, GET | `employees`, `Orgchart_data` |
| `src/app/api/add-Department/route.ts` | POST | `Orgchart_data` |
| `src/app/api/import_excel/route.ts` | POST | `employees` |

#### **Client-side Components**
| File | Firebase Usage |
|------|----------------|
| `src/app/login/page.tsx` | signInAnonymously, query users |
| `src/app/signup/page.tsx` | signInAnonymously, setDoc users |
| `src/app/view_account/page.tsx` | CRUD users (direct Firestore) |
| `src/app/Admin/components/UserManagement.tsx` | CRUD users (direct Firestore) |
| `src/components/app.header.tsx` | signOut |

### 2.3 Firebase Operations Summary

#### **READ Operations**
```
- getDocs(collection) - List all documents
- getDoc(doc) - Get single document  
- query(where, orderBy) - Filtered queries
- getCountFromServer() - Count documents
```

#### **WRITE Operations**
```
- addDoc() - Add new document
- setDoc() - Set/replace document
- updateDoc() - Update fields
- deleteDoc() - Delete document
- writeBatch() - Batch operations (up to 500)
```

#### **AUTH Operations**
```
- signInAnonymously() - Login
- signOut() - Logout
- getAuth() - Get auth instance
```

---

## 3. THIẾT KẾ DATABASE SCHEMA SUPABASE

### 3.1 Table: `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,  -- bcrypt hashed
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for username lookup (login)
CREATE INDEX idx_users_username ON users(username);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON users
    FOR SELECT USING (auth.uid() IS NOT NULL);
    
CREATE POLICY "Allow admin write" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### 3.2 Table: `employees`
```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emp_id VARCHAR(20) UNIQUE NOT NULL,  -- "Emp ID"
    full_name VARCHAR(100),              -- "FullName "
    job_title VARCHAR(100),              -- "Job Title"
    dept VARCHAR(100),                   -- "Dept"
    bu VARCHAR(50),                      -- "BU"
    dl_idl_staff VARCHAR(20),            -- "DL/IDL/Staff"
    location VARCHAR(100),               -- "Location"
    employee_type VARCHAR(50),           -- "Employee Type"
    line_manager VARCHAR(100),           -- "Line Manager"
    joining_date DATE,                   -- "Joining Date"
    
    -- Additional metadata
    raw_data JSONB,                      -- Store original import data
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_employees_emp_id ON employees(emp_id);
CREATE INDEX idx_employees_dept ON employees(dept);
CREATE INDEX idx_employees_line_manager ON employees(line_manager);
CREATE INDEX idx_employees_full_name ON employees(full_name);

-- RLS Policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON employees
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow admin write" ON employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### 3.3 Table: `orgchart_nodes`
```sql
CREATE TABLE orgchart_nodes (
    id VARCHAR(100) PRIMARY KEY,         -- Can be emp_id or dept:name:manager_id
    pid VARCHAR(100),                    -- Parent ID
    stpid VARCHAR(100),                  -- Staff parent ID (for grouping)
    name VARCHAR(200),
    title VARCHAR(100),
    image TEXT,
    tags JSONB DEFAULT '[]'::JSONB,
    orig_pid VARCHAR(100),
    dept VARCHAR(100),
    bu VARCHAR(50),
    type VARCHAR(50),                    -- 'emp', 'group', etc.
    location VARCHAR(100),
    description TEXT,
    joining_date VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orgchart_nodes_pid ON orgchart_nodes(pid);
CREATE INDEX idx_orgchart_nodes_dept ON orgchart_nodes(dept);
CREATE INDEX idx_orgchart_nodes_type ON orgchart_nodes(type);

-- RLS Policies
ALTER TABLE orgchart_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON orgchart_nodes
    FOR SELECT USING (auth.uid() IS NOT NULL);
```

### 3.4 Table: `custom_orgcharts`
```sql
CREATE TABLE custom_orgcharts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) REFERENCES users(username),
    orgchart_name VARCHAR(100) NOT NULL,
    description TEXT,
    org_data JSONB DEFAULT '{"data": []}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX idx_custom_orgcharts_username ON custom_orgcharts(username);

-- RLS Policies
ALTER TABLE custom_orgcharts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orgcharts" ON custom_orgcharts
    FOR SELECT USING (
        username = (SELECT username FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can write own orgcharts" ON custom_orgcharts
    FOR ALL USING (
        username = (SELECT username FROM users WHERE id = auth.uid())
    );
```

---

## 4. KẾ HOẠCH MIGRATION CHI TIẾT

### PHASE 1: Thiết Lập Supabase (1-2 ngày)

#### Task 1.1: Tạo Supabase Project
```
1. Đăng ký/đăng nhập tại supabase.com
2. Tạo project mới với region gần nhất (Singapore)
3. Lưu lại:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
```

#### Task 1.2: Tạo Database Schema
```sql
-- Chạy các SQL scripts từ Section 3 theo thứ tự:
-- 1. users table
-- 2. employees table
-- 3. orgchart_nodes table
-- 4. custom_orgcharts table
```

#### Task 1.3: Cập Nhật Environment Variables
```env
# .env.local - Thêm Supabase config
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Server-side only

# Giữ lại Firebase config cho migration period
NEXT_PUBLIC_FIREBASE_API_KEY=...
```

#### Task 1.4: Cài Đặt Supabase Client
```bash
npm install @supabase/supabase-js
```

---

### PHASE 2: Tạo Supabase Client Library (1 ngày)

#### Task 2.1: Tạo `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

// Browser/Client-side client (uses anon key)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side client (uses service role key) - for API routes
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

#### Task 2.2: Tạo TypeScript Types
```typescript
// src/types/database.ts
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          password: string
          full_name: string
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Row, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Insert>
      }
      employees: {
        Row: {
          id: string
          emp_id: string
          full_name: string | null
          job_title: string | null
          dept: string | null
          bu: string | null
          dl_idl_staff: string | null
          location: string | null
          employee_type: string | null
          line_manager: string | null
          joining_date: string | null
          raw_data: Record<string, any> | null
          imported_at: string
          updated_at: string
        }
        Insert: Omit<Row, 'id' | 'imported_at' | 'updated_at'>
        Update: Partial<Insert>
      }
      // ... other tables
    }
  }
}
```

---

### PHASE 3: Migration Data từ Firebase sang Supabase (2-3 ngày)

#### Task 3.1: Tạo Migration Script
```typescript
// scripts/migrate-firebase-to-supabase.ts
import { db } from '../src/lib/firebase'
import { supabaseAdmin } from '../src/lib/supabase'
import { collection, getDocs } from 'firebase/firestore'

async function migrateUsers() {
  console.log('🔄 Migrating users...')
  const snapshot = await getDocs(collection(db, 'users'))
  
  const users = snapshot.docs.map(doc => ({
    username: doc.data().username,
    password: doc.data().password,
    full_name: doc.data().full_name,
    role: doc.data().role || 'user'
  }))
  
  const { error } = await supabaseAdmin.from('users').insert(users)
  if (error) throw error
  console.log(`✅ Migrated ${users.length} users`)
}

async function migrateEmployees() {
  console.log('🔄 Migrating employees...')
  const snapshot = await getDocs(collection(db, 'employees'))
  
  const employees = snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      emp_id: data['Emp ID'],
      full_name: data['FullName '] || data['FullName'],
      job_title: data['Job Title'],
      dept: data['Dept'],
      bu: data['BU'],
      dl_idl_staff: data['DL/IDL/Staff'],
      location: data['Location'],
      employee_type: data['Employee Type'],
      line_manager: data['Line Manager'],
      joining_date: data['Joining\r\n Date'],
      raw_data: data
    }
  })
  
  // Batch insert (Supabase handles large inserts)
  const { error } = await supabaseAdmin.from('employees').insert(employees)
  if (error) throw error
  console.log(`✅ Migrated ${employees.length} employees`)
}

async function migrateOrgchartNodes() {
  console.log('🔄 Migrating orgchart nodes...')
  const snapshot = await getDocs(collection(db, 'Orgchart_data'))
  
  const nodes = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  
  const { error } = await supabaseAdmin.from('orgchart_nodes').insert(nodes)
  if (error) throw error
  console.log(`✅ Migrated ${nodes.length} orgchart nodes`)
}

async function migrateCustomOrgcharts() {
  console.log('🔄 Migrating custom orgcharts...')
  const snapshot = await getDocs(collection(db, 'orgcharts'))
  
  const orgcharts = snapshot.docs.map(doc => ({
    id: doc.id,
    username: doc.data().username,
    orgchart_name: doc.data().orgchart_name,
    description: doc.data().describe || '',
    org_data: doc.data().org_data
  }))
  
  const { error } = await supabaseAdmin.from('custom_orgcharts').insert(orgcharts)
  if (error) throw error
  console.log(`✅ Migrated ${orgcharts.length} custom orgcharts`)
}

// Run all migrations
async function main() {
  try {
    await migrateUsers()
    await migrateEmployees()
    await migrateOrgchartNodes()
    await migrateCustomOrgcharts()
    console.log('🎉 Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

main()
```

---

### PHASE 4: Chuyển Đổi API Routes (3-4 ngày)

#### Task 4.1: Chuyển `/api/users/route.ts`
```typescript
// BEFORE (Firebase)
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

// AFTER (Supabase)
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, username, full_name, role, created_at')
    .order('full_name', { ascending: true });
    
  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, data });
}
```

#### Task 4.2: Chuyển `/api/sheet/route.ts`
```typescript
// GET - All employees with pagination
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  
  // Single employee by ID
  if (id) {
    const { data, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return NextResponse.json({ success: false }, { status: 404 });
    return NextResponse.json({ success: true, data });
  }
  
  // Paginated list
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, error, count } = await supabaseAdmin
    .from('employees')
    .select('*', { count: 'exact' })
    .range(from, to);
  
  if (error) throw error;
  
  return NextResponse.json({
    success: true,
    data,
    page,
    limit,
    total: count,
    totalPages: Math.ceil((count || 0) / limit)
  });
}

// POST - Add employee
export async function POST(req: Request) {
  const body = await req.json();
  const { action, data } = body;
  
  if (action === "add") {
    const { data: newEmployee, error } = await supabaseAdmin
      .from('employees')
      .insert({
        emp_id: data['Emp ID'],
        full_name: data['FullName '],
        // ... map other fields
        raw_data: data
      })
      .select()
      .single();
    
    if (error) throw error;
    return NextResponse.json({ success: true, id: newEmployee.id });
  }
}

// PUT - Update employee
export async function PUT(req: Request) {
  const { id, data } = await req.json();
  
  const { error } = await supabaseAdmin
    .from('employees')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
  return NextResponse.json({ success: true });
}

// DELETE - Remove employee
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  const { error } = await supabaseAdmin
    .from('employees')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return NextResponse.json({ success: true });
}
```

#### Task 4.3: Chuyển `/api/orgchart/route.ts`
```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dept = searchParams.get("dept");
  
  let query = supabaseAdmin
    .from('orgchart_nodes')
    .select('*');
  
  if (dept && dept !== 'all') {
    query = query.eq('dept', dept);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return NextResponse.json({
    data,
    success: true,
    timestamp: new Date().toISOString()
  });
}
```

#### Task 4.4: Chuyển Authentication APIs

**Login (`/api/login` hoặc trong `login/page.tsx`):**
```typescript
// Supabase Auth - Custom auth (không dùng Supabase Auth built-in)
// Giữ logic hiện tại, chỉ thay query

export async function handleLogin(username: string, password: string) {
  // Query user từ Supabase
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  
  if (error || !user) {
    throw new Error('Sai tài khoản hoặc mật khẩu');
  }
  
  // Verify password (sử dụng bcryptjs như cũ)
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new Error('Sai tài khoản hoặc mật khẩu');
  }
  
  // Tạo session (giữ logic JWT hiện tại)
  return user;
}
```

---

### PHASE 5: Chuyển Đổi Client-side Components (2-3 ngày)

#### Task 5.1: Cập nhật `login/page.tsx`
```typescript
// BEFORE
import { auth, db } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

// AFTER
import { supabase } from "@/lib/supabase";

// In handleSubmit:
const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('username', username)
  .single();
```

#### Task 5.2: Cập nhật `signup/page.tsx`
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // Check existing username
  const { data: existing } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .single();
  
  if (existing) {
    setError("Tên đăng nhập đã tồn tại");
    return;
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  // Insert new user
  const { error } = await supabase
    .from('users')
    .insert({
      username,
      password: hashedPassword,
      full_name: fullName,
      role: 'user'
    });
  
  if (error) throw error;
  // Redirect to login...
};
```

#### Task 5.3: Cập nhật `view_account/page.tsx` và `UserManagement.tsx`
- Thay đổi tất cả direct Firestore calls sang Supabase client
- Pattern tương tự login/signup

#### Task 5.4: Cập nhật `app.header.tsx`
```typescript
// Logout - không cần signOut Firebase nữa
const handleLogout = async () => {
  // Chỉ cần xóa session
  await fetch("/api/logout", { method: "POST" });
  localStorage.removeItem("user");
  window.location.href = "/login";
};
```

---

### PHASE 6: Xóa Firebase Dependencies (1 ngày)

#### Task 6.1: Xóa Firebase imports
```bash
# Tìm và xóa tất cả imports
grep -r "firebase" src/
```

#### Task 6.2: Xóa `src/lib/firebase.ts`

#### Task 6.3: Xóa Firebase package
```bash
npm uninstall firebase
```

#### Task 6.4: Cleanup `.env.local`
```env
# Xóa các dòng Firebase
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ...
```

---

## 5. CHECKLIST TESTING

### 5.1 Authentication Testing
| Test Case | Status | Notes |
|-----------|--------|-------|
| ☐ Login với user hợp lệ | | |
| ☐ Login với password sai | | |
| ☐ Login với username không tồn tại | | |
| ☐ Signup user mới | | |
| ☐ Signup với username đã tồn tại | | |
| ☐ Logout | | |
| ☐ Session persistence sau refresh | | |

### 5.2 Users Management Testing
| Test Case | Status | Notes |
|-----------|--------|-------|
| ☐ List all users | | |
| ☐ Search users by name/username | | |
| ☐ Add new user | | |
| ☐ Edit user (name, role) | | |
| ☐ Change user password | | |
| ☐ Delete user | | |

### 5.3 Employees/Sheet Testing
| Test Case | Status | Notes |
|-----------|--------|-------|
| ☐ GET all employees | | |
| ☐ GET employee by ID | | |
| ☐ Pagination (page 1, 2, 3...) | | |
| ☐ Server-side filtering | | |
| ☐ Add new employee | | |
| ☐ Update employee | | |
| ☐ Delete employee | | |
| ☐ Excel import | | |
| ☐ Cache invalidation sau mutation | | |

### 5.4 OrgChart Testing
| Test Case | Status | Notes |
|-----------|--------|-------|
| ☐ Load full org chart | | |
| ☐ Filter by department | | |
| ☐ Sync employees to orgchart | | |
| ☐ Add department | | |
| ☐ Node hierarchy rendering | | |

### 5.5 Custom OrgCharts Testing
| Test Case | Status | Notes |
|-----------|--------|-------|
| ☐ List user's orgcharts | | |
| ☐ Get single orgchart | | |
| ☐ Create new orgchart | | |
| ☐ Update orgchart | | |
| ☐ Delete orgchart | | |

### 5.6 Dashboard Testing
| Test Case | Status | Notes |
|-----------|--------|-------|
| ☐ KPI cards load correctly | | |
| ☐ Charts render properly | | |
| ☐ Employee table with pagination | | |
| ☐ Hierarchy filter | | |
| ☐ Department filter | | |

### 5.7 Performance Testing
| Test Case | Status | Notes |
|-----------|--------|-------|
| ☐ Initial page load < 3s | | |
| ☐ API response time < 500ms | | |
| ☐ Pagination smooth (no lag) | | |
| ☐ No memory leaks | | |
| ☐ Caching works correctly | | |

---

## 6. TIMELINE DỰ KIẾN

| Phase | Thời Gian | Ngày Bắt Đầu | Ngày Kết Thúc |
|-------|-----------|--------------|---------------|
| Phase 1: Setup Supabase | 1-2 ngày | | |
| Phase 2: Client Library | 1 ngày | | |
| Phase 3: Data Migration | 2-3 ngày | | |
| Phase 4: API Routes | 3-4 ngày | | |
| Phase 5: Client Components | 2-3 ngày | | |
| Phase 6: Cleanup | 1 ngày | | |
| Testing & Bug Fixes | 2-3 ngày | | |
| **TỔNG CỘNG** | **12-17 ngày** | | |

---

## 7. ROLLBACK PLAN

Trong trường hợp cần rollback về Firebase:

1. **Git branch strategy**: Tạo branch `feature/supabase-migration` để dễ rollback
2. **Keep Firebase config**: Giữ `.env.local.firebase-backup` 
3. **Database backup**: Export dữ liệu từ Supabase định kỳ
4. **Feature flag**: Có thể implement feature flag để switch giữa Firebase/Supabase

---

## 8. SO SÁNH FIREBASE VS SUPABASE

| Tính Năng | Firebase Firestore | Supabase PostgreSQL |
|-----------|-------------------|---------------------|
| Query Language | NoSQL (limited) | SQL (full power) |
| Joins | ❌ | ✅ |
| Aggregations | Limited | Full SQL |
| Pagination | Cursor-based | Offset/Limit |
| Real-time | ✅ | ✅ |
| Row Level Security | Security Rules | PostgreSQL RLS |
| Pricing | Per read/write | Per request + storage |
| Batch Operations | 500/batch | No limit |
| Full-text Search | ❌ | ✅ (pg_trgm) |

---

**Người tạo:** AI Assistant  
**Ngày tạo:** 2026-01-07  
**Version:** 1.0
