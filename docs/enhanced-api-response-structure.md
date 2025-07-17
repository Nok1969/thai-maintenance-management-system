# Enhanced API Response Structure

## Overview

This document describes the enhanced API response structure for maintenance record status management operations. The responses now include comprehensive metadata, timestamps, and audit trail information.

## Response Structure

### Success Response Format

```typescript
interface ApiSuccessResponse {
  status: "success";
  message: string;
  updatedRecord: MaintenanceRecord;
  updatedBy: string;
  updatedAt: Date;
  previousStatus?: string;
  currentStatus?: string;
  action: string;
  workflowStep?: string;
  completedAt?: Date;
}
```

### Error Response Format

```typescript
interface ApiErrorResponse {
  status: "error";
  message: string;
  error: string;
  updatedAt: Date;
  action: string;
}
```

## Endpoint Responses

### 1. Start Maintenance Work

**Endpoint**: `POST /api/records/:id/start`

**Success Response**:
```json
{
  "status": "success",
  "message": "Maintenance work started successfully",
  "updatedRecord": {
    "id": 1,
    "recordId": "REC-2025-001",
    "machineId": 5,
    "status": "in_progress",
    "maintenanceDate": "2025-01-15",
    "type": "preventive",
    "workDescription": "Monthly engine inspection",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  },
  "updatedBy": "tech123",
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "previousStatus": "pending",
  "currentStatus": "in_progress",
  "action": "start_work",
  "workflowStep": "work_started"
}
```

**Error Response**:
```json
{
  "status": "error",
  "message": "Failed to start maintenance work",
  "error": "Maintenance record not found",
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "action": "start_work"
}
```

### 2. Complete Maintenance Work

**Endpoint**: `POST /api/records/:id/complete`

**Success Response**:
```json
{
  "status": "success",
  "message": "Maintenance work completed successfully",
  "updatedRecord": {
    "id": 1,
    "recordId": "REC-2025-001",
    "machineId": 5,
    "status": "completed",
    "maintenanceDate": "2025-01-15",
    "type": "preventive",
    "workDescription": "Monthly engine inspection",
    "completedAt": "2025-01-15T12:45:00.000Z",
    "updatedAt": "2025-01-15T12:45:00.000Z"
  },
  "updatedBy": "tech123",
  "updatedAt": "2025-01-15T12:45:00.000Z",
  "previousStatus": "in_progress",
  "currentStatus": "completed",
  "action": "complete_work",
  "workflowStep": "work_completed",
  "completedAt": "2025-01-15T12:45:00.000Z"
}
```

### 3. Cancel Maintenance Work

**Endpoint**: `POST /api/records/:id/cancel`

**Success Response**:
```json
{
  "status": "success",
  "message": "Maintenance work cancelled successfully",
  "updatedRecord": {
    "id": 1,
    "recordId": "REC-2025-001",
    "machineId": 5,
    "status": "cancelled",
    "maintenanceDate": "2025-01-15",
    "type": "preventive",
    "workDescription": "Monthly engine inspection",
    "updatedAt": "2025-01-15T11:15:00.000Z"
  },
  "updatedBy": "tech123",
  "updatedAt": "2025-01-15T11:15:00.000Z",
  "previousStatus": "in_progress",
  "currentStatus": "cancelled",
  "action": "cancel_work",
  "workflowStep": "work_cancelled"
}
```

### 4. Generic Status Update

**Endpoint**: `PATCH /api/records/:id/status`

**Request Body**:
```json
{
  "status": "in_progress"
}
```

**Success Response**:
```json
{
  "status": "success",
  "message": "Status updated successfully",
  "updatedRecord": {
    "id": 1,
    "recordId": "REC-2025-001",
    "machineId": 5,
    "status": "in_progress",
    "maintenanceDate": "2025-01-15",
    "type": "preventive",
    "workDescription": "Monthly engine inspection",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  },
  "updatedBy": "tech123",
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "previousStatus": null,
  "action": "status_update"
}
```

## Response Fields Description

### Common Success Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"success"` | Indicates successful operation |
| `message` | `string` | Human-readable success message |
| `updatedRecord` | `MaintenanceRecord` | Complete updated record object |
| `updatedBy` | `string` | User ID of the person who made the change |
| `updatedAt` | `Date` | Server timestamp when the change was processed |
| `action` | `string` | The specific action performed |

### Status-Specific Fields

| Field | Type | Description | Available In |
|-------|------|-------------|--------------|
| `previousStatus` | `string` | Status before the change | Start, Complete, Cancel |
| `currentStatus` | `string` | Status after the change | Start, Complete, Cancel |
| `workflowStep` | `string` | Current step in the workflow | Start, Complete, Cancel |
| `completedAt` | `Date` | Timestamp when work was completed | Complete only |

### Error Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"error"` | Indicates failed operation |
| `message` | `string` | Human-readable error message |
| `error` | `string` | Technical error details |
| `updatedAt` | `Date` | Server timestamp when the error occurred |
| `action` | `string` | The action that failed |

## Frontend Integration

### Updated Client-Side Handling

```typescript
const startWorkMutation = useMutation({
  mutationFn: async () => {
    return await apiRequest(`/api/records/${record.id}/start`, {
      method: "POST",
    });
  },
  onSuccess: (data) => {
    toast({
      title: "เริ่มงานแล้ว",
      description: `เริ่มต้นการทำงานบำรุงรักษาแล้ว - ${data.message}`,
    });
    queryClient.invalidateQueries({ queryKey: ["/api/records"] });
    onStatusChange?.("in_progress");
    
    // Enhanced logging with complete metadata
    console.log("Work started:", {
      action: data.action,
      updatedBy: data.updatedBy,
      updatedAt: data.updatedAt,
      workflowStep: data.workflowStep,
      statusTransition: `${data.previousStatus} → ${data.currentStatus}`
    });
  },
  onError: (error) => {
    toast({
      title: "เกิดข้อผิดพลาด",
      description: "ไม่สามารถเริ่มงานได้",
      variant: "destructive",
    });
  },
});
```

### Type-Safe Response Handling

```typescript
interface StatusUpdateResponse {
  status: "success" | "error";
  message: string;
  updatedRecord?: MaintenanceRecord;
  updatedBy?: string;
  updatedAt: Date;
  previousStatus?: string;
  currentStatus?: string;
  action: string;
  workflowStep?: string;
  completedAt?: Date;
  error?: string;
}

// Usage in mutations
const handleStatusResponse = (response: StatusUpdateResponse) => {
  if (response.status === "success") {
    // Handle success with full metadata
    console.log("Status change successful:", {
      action: response.action,
      updatedBy: response.updatedBy,
      transition: `${response.previousStatus} → ${response.currentStatus}`,
      completedAt: response.completedAt,
      workflowStep: response.workflowStep
    });
  } else {
    // Handle error with detailed information
    console.error("Status change failed:", {
      action: response.action,
      error: response.error,
      message: response.message,
      timestamp: response.updatedAt
    });
  }
};
```

## Benefits of Enhanced Structure

### 1. **Comprehensive Audit Trail**
- Track who made changes and when
- Record previous and current status
- Identify specific actions and workflow steps
- Maintain complete operation history

### 2. **Better Error Handling**
- Detailed error messages with context
- Action-specific error information
- Timestamps for debugging
- Consistent error structure

### 3. **Improved Debugging**
- Enhanced logging with metadata
- Action identification for monitoring
- Workflow step tracking
- Complete operation context

### 4. **Frontend Integration**
- Type-safe response handling
- Rich toast notifications
- Detailed console logging
- Better user feedback

### 5. **Monitoring and Analytics**
- Action-based metrics
- User activity tracking
- Performance monitoring
- Error rate analysis

## Example API Usage

### cURL Examples

```bash
# Start maintenance work
curl -X POST "http://localhost:5000/api/records/1/start" \
  -H "Authorization: Bearer <token>"

# Response:
{
  "status": "success",
  "message": "Maintenance work started successfully",
  "updatedRecord": { ... },
  "updatedBy": "tech123",
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "previousStatus": "pending",
  "currentStatus": "in_progress",
  "action": "start_work",
  "workflowStep": "work_started"
}

# Complete maintenance work
curl -X POST "http://localhost:5000/api/records/1/complete" \
  -H "Authorization: Bearer <token>"

# Response:
{
  "status": "success",
  "message": "Maintenance work completed successfully",
  "updatedRecord": { ... },
  "updatedBy": "tech123",
  "updatedAt": "2025-01-15T12:45:00.000Z",
  "previousStatus": "in_progress",
  "currentStatus": "completed",
  "action": "complete_work",
  "workflowStep": "work_completed",
  "completedAt": "2025-01-15T12:45:00.000Z"
}
```

### JavaScript API Client

```javascript
const MaintenanceAPI = {
  async startWork(recordId) {
    const response = await fetch(`/api/records/${recordId}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('Work started:', {
        recordId,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt,
        statusTransition: `${data.previousStatus} → ${data.currentStatus}`
      });
    }
    
    return data;
  },

  async completeWork(recordId) {
    const response = await fetch(`/api/records/${recordId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('Work completed:', {
        recordId,
        updatedBy: data.updatedBy,
        completedAt: data.completedAt,
        workflowStep: data.workflowStep
      });
    }
    
    return data;
  }
};
```

## Migration Guide

### From Simple Response
```typescript
// Old response format
res.json(updatedRecord);

// New response format
res.json({
  status: "success",
  message: "Operation completed successfully",
  updatedRecord,
  updatedBy: technicianId,
  updatedAt: new Date(),
  action: "operation_name"
});
```

### Frontend Migration
```typescript
// Old mutation handler
onSuccess: (record) => {
  toast({ title: "Success" });
  queryClient.invalidateQueries({ queryKey: ["/api/records"] });
}

// New mutation handler
onSuccess: (data) => {
  toast({ 
    title: "Success", 
    description: data.message 
  });
  queryClient.invalidateQueries({ queryKey: ["/api/records"] });
  console.log("Operation completed:", {
    action: data.action,
    updatedBy: data.updatedBy,
    updatedAt: data.updatedAt
  });
}
```

This enhanced response structure provides comprehensive information for better tracking, debugging, and user experience while maintaining backward compatibility and type safety.