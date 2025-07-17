# Database Error Handling Guide

## Overview

This guide describes the comprehensive database error handling system implemented to prevent crashes and provide user-friendly error messages when database constraints are violated.

## Problem Statement

Database operations can fail due to various reasons:
- **Unique constraint violations**: Duplicate keys, IDs, or unique fields
- **Foreign key violations**: References to non-existent records
- **Not null violations**: Missing required fields
- **Check constraint violations**: Invalid data formats or values
- **Connection errors**: Database connectivity issues

Without proper error handling, these failures can crash the application or return cryptic error messages to users.

## Solution Architecture

### 1. Database Error Parser (`server/utils/dbErrors.ts`)

A comprehensive error parsing utility that translates database errors into user-friendly messages:

```typescript
export function parseDatabaseError(error: any): DatabaseErrorInfo {
  // Handle PostgreSQL constraint violation errors
  if (error?.code) {
    switch (error.code) {
      case '23505': // unique_violation
        return {
          message: parseUniqueConstraintError(error),
          code: 'UNIQUE_VIOLATION',
          statusCode: 409,
          isUserError: true
        };
      // ... other cases
    }
  }
}
```

### 2. Error Wrapper Function

A higher-order function that wraps database operations with error handling:

```typescript
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  context: string = 'Database operation'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const dbError = parseDatabaseError(error);
    // Log and throw user-friendly error
    throw userError;
  }
}
```

### 3. Storage Layer Integration

All create, update, and delete operations are wrapped with error handling:

```typescript
async createMachine(machine: InsertMachine): Promise<Machine> {
  return withDatabaseErrorHandling(async () => {
    const [newMachine] = await db.insert(machines).values(machine).returning();
    return newMachine;
  }, 'Machine creation');
}
```

## Error Types and Handling

### 1. Unique Constraint Violations (Code: 23505)

**Common Scenarios**:
- Duplicate machine IDs
- Duplicate schedule IDs
- Duplicate record IDs
- Duplicate email addresses

**Error Handling**:
```typescript
function parseUniqueConstraintError(error: any): string {
  const detail = error.detail || '';
  const constraint = error.constraint || '';
  
  if (constraint.includes('machine_id')) {
    return 'รหัสเครื่องจักรนี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น';
  }
  // ... other specific messages
}
```

**User Experience**:
- **Before**: `duplicate key value violates unique constraint "machines_machine_id_key"`
- **After**: `รหัสเครื่องจักรนี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`

### 2. Foreign Key Violations (Code: 23503)

**Common Scenarios**:
- Creating maintenance record for non-existent machine
- Assigning maintenance to non-existent technician
- Referencing deleted schedule

**Error Handling**:
```typescript
function parseForeignKeyError(error: any): string {
  const constraint = error.constraint || '';
  
  if (constraint.includes('machine')) {
    return 'ไม่พบเครื่องจักรที่ระบุ กรุณาตรวจสอบรหัสเครื่องจักร';
  }
  // ... other specific messages
}
```

**User Experience**:
- **Before**: `insert or update on table "maintenance_records" violates foreign key constraint`
- **After**: `ไม่พบเครื่องจักรที่ระบุ กรุณาตรวจสอบรหัสเครื่องจักร`

### 3. Not Null Violations (Code: 23502)

**Common Scenarios**:
- Missing required fields
- Null values in mandatory columns

**Error Handling**:
```typescript
function parseNotNullError(error: any): string {
  const column = error.column || '';
  const fieldNames = {
    'machine_id': 'รหัสเครื่องจักร',
    'name': 'ชื่อ',
    'maintenance_date': 'วันที่บำรุงรักษา'
  };
  
  const fieldName = fieldNames[column] || column;
  return `${fieldName}เป็นข้อมูลที่จำเป็น กรุณากรอกข้อมูลให้ครบถ้วน`;
}
```

### 4. Check Constraint Violations (Code: 23514)

**Common Scenarios**:
- Invalid status values
- Invalid priority levels
- Invalid date ranges
- Negative numeric values

**Error Handling**:
```typescript
function parseCheckConstraintError(error: any): string {
  const constraint = error.constraint || '';
  
  if (constraint.includes('status')) {
    return 'สถานะที่ระบุไม่ถูกต้อง กรุณาเลือกสถานะที่ถูกต้อง';
  }
  // ... other specific messages
}
```

## Implementation Details

### Storage Operations Wrapped

All database operations that can fail are wrapped:

#### Machine Operations
- ✅ `createMachine()` - Handles duplicate machine IDs
- ✅ `updateMachine()` - Handles constraint violations
- ✅ `deleteMachine()` - Handles foreign key dependencies

#### Schedule Operations
- ✅ `createMaintenanceSchedule()` - Handles duplicate schedule IDs
- ✅ `updateMaintenanceSchedule()` - Handles constraint violations
- ✅ `deleteMaintenanceSchedule()` - Handles foreign key dependencies

#### Record Operations
- ✅ `createMaintenanceRecord()` - Handles duplicate record IDs
- ✅ `updateMaintenanceRecord()` - Handles constraint violations
- ✅ `deleteMaintenanceRecord()` - Handles foreign key dependencies

#### User Operations
- ✅ `upsertUser()` - Handles duplicate emails and user IDs

#### History Operations
- ✅ `createMachineHistory()` - Handles constraint violations

### Error Context Tracking

Each operation includes contextual information for better debugging:

```typescript
return withDatabaseErrorHandling(async () => {
  // database operation
}, 'Machine creation'); // Context for logging
```

### Development vs Production Logging

**Development Mode**:
```typescript
console.error(`[${context}] Database error:`, {
  original: error,
  parsed: dbError,
  stack: error?.stack
});
```

**Production Mode**:
```typescript
console.error(`[${context}] Database error: ${dbError.code} - ${dbError.message}`);
```

## Error Response Format

All database errors are returned with consistent format:

```json
{
  "message": "รหัสเครื่องจักรนี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น",
  "code": "UNIQUE_VIOLATION",
  "statusCode": 409,
  "isUserError": true
}
```

### HTTP Status Codes

- **400 Bad Request**: Invalid data (foreign key, not null, check violations)
- **409 Conflict**: Duplicate data (unique constraint violations)
- **500 Internal Server Error**: System errors (connection, table not found)
- **503 Service Unavailable**: Database connectivity issues

## Benefits

### 1. Crash Prevention
- **Before**: Database constraint violations crashed the application
- **After**: Graceful error handling with user-friendly messages

### 2. User Experience
- **Before**: Technical error messages like `duplicate key value violates unique constraint`
- **After**: Clear Thai messages like `รหัสเครื่องจักรนี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`

### 3. Developer Experience
- **Structured Logging**: Detailed error information in development
- **Context Tracking**: Know exactly which operation failed
- **Error Classification**: Distinguish between user errors and system errors

### 4. Production Reliability
- **Minimal Logging**: Avoid exposing sensitive information
- **Graceful Degradation**: System continues running despite errors
- **Proper Status Codes**: Correct HTTP responses for different error types

## Testing Database Errors

### Manual Testing

```bash
# Test unique constraint violation
curl -X POST "http://localhost:5000/api/machines" \
  -H "Content-Type: application/json" \
  -d '{"machineId": "DUPLICATE_ID", "name": "Test", "type": "test"}'

# Test foreign key violation
curl -X POST "http://localhost:5000/api/records" \
  -H "Content-Type: application/json" \
  -d '{"machineId": 999999, "technicianId": "invalid", "maintenanceDate": "2025-01-01"}'

# Test not null violation
curl -X POST "http://localhost:5000/api/machines" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Machine"}'  # Missing required machineId
```

### Automated Testing

```typescript
describe('Database Error Handling', () => {
  it('should handle unique constraint violations', async () => {
    // Create machine with duplicate ID
    const response = await request(app)
      .post('/api/machines')
      .send({ machineId: 'EXISTING_ID', name: 'Test' });
    
    expect(response.status).toBe(409);
    expect(response.body.message).toContain('มีอยู่ในระบบแล้ว');
  });
});
```

## Best Practices

### 1. Always Use Error Wrapper
```typescript
// ✅ Good
async createSomething(data: InsertData): Promise<Data> {
  return withDatabaseErrorHandling(async () => {
    return db.insert(table).values(data).returning();
  }, 'Context description');
}

// ❌ Bad
async createSomething(data: InsertData): Promise<Data> {
  return db.insert(table).values(data).returning(); // Can crash
}
```

### 2. Provide Meaningful Context
```typescript
// ✅ Good
withDatabaseErrorHandling(operation, 'User registration');

// ❌ Bad
withDatabaseErrorHandling(operation, 'Database operation');
```

### 3. Handle Specific Error Types
```typescript
// ✅ Good - Specific error handling
function parseUniqueConstraintError(error: any): string {
  if (error.constraint.includes('machine_id')) {
    return 'รหัสเครื่องจักรนี้มีอยู่ในระบบแล้ว';
  }
  return 'ข้อมูลนี้มีอยู่ในระบบแล้ว';
}

// ❌ Bad - Generic error handling
function parseUniqueConstraintError(error: any): string {
  return 'Duplicate data';
}
```

### 4. Log Appropriately
```typescript
// ✅ Good - Environment-specific logging
if (process.env.NODE_ENV !== 'production') {
  console.error('Detailed error:', { error, context, stack });
} else {
  console.error('Error summary:', `${code} - ${message}`);
}
```

This comprehensive error handling system ensures the application remains stable and provides excellent user experience even when database operations fail.