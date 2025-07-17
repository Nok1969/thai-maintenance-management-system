import { DatabaseError } from 'pg';

export interface DatabaseErrorInfo {
  message: string;
  code: string;
  statusCode: number;
  isUserError: boolean;
}

/**
 * Parse database error and return user-friendly error information
 */
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
        
      case '23503': // foreign_key_violation
        return {
          message: parseForeignKeyError(error),
          code: 'FOREIGN_KEY_VIOLATION',
          statusCode: 400,
          isUserError: true
        };
        
      case '23502': // not_null_violation
        return {
          message: parseNotNullError(error),
          code: 'NOT_NULL_VIOLATION',
          statusCode: 400,
          isUserError: true
        };
        
      case '23514': // check_violation
        return {
          message: parseCheckConstraintError(error),
          code: 'CHECK_VIOLATION',
          statusCode: 400,
          isUserError: true
        };
        
      case '42P01': // undefined_table
        return {
          message: 'Database table not found',
          code: 'UNDEFINED_TABLE',
          statusCode: 500,
          isUserError: false
        };
        
      case '42703': // undefined_column
        return {
          message: 'Database column not found',
          code: 'UNDEFINED_COLUMN',
          statusCode: 500,
          isUserError: false
        };
        
      case '08003': // connection_does_not_exist
      case '08006': // connection_failure
        return {
          message: 'Database connection failed',
          code: 'CONNECTION_ERROR',
          statusCode: 503,
          isUserError: false
        };
        
      default:
        return {
          message: 'Database operation failed',
          code: 'DATABASE_ERROR',
          statusCode: 500,
          isUserError: false
        };
    }
  }
  
  // Handle Drizzle ORM errors
  if (error?.message?.includes('duplicate key value')) {
    return {
      message: 'ข้อมูลนี้มีอยู่ในระบบแล้ว กรุณาตรวจสอบและลองใหม่อีกครั้ง',
      code: 'DUPLICATE_KEY',
      statusCode: 409,
      isUserError: true
    };
  }
  
  if (error?.message?.includes('violates foreign key constraint')) {
    return {
      message: 'ไม่พบข้อมูลอ้างอิงที่ระบุ กรุณาตรวจสอบความถูกต้อง',
      code: 'INVALID_REFERENCE',
      statusCode: 400,
      isUserError: true
    };
  }
  
  // Default fallback
  return {
    message: 'เกิดข้อผิดพลาดในการประมวลผลฐานข้อมูล',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
    isUserError: false
  };
}

/**
 * Parse unique constraint violation error
 */
function parseUniqueConstraintError(error: any): string {
  const detail = error.detail || '';
  const constraint = error.constraint || '';
  
  // Machine ID constraint
  if (constraint.includes('machine_id') || detail.includes('machine_id')) {
    return 'รหัสเครื่องจักรนี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น';
  }
  
  // Schedule ID constraint
  if (constraint.includes('schedule_id') || detail.includes('schedule_id')) {
    return 'รหัสตารางการบำรุงรักษานี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น';
  }
  
  // Record ID constraint
  if (constraint.includes('record_id') || detail.includes('record_id')) {
    return 'รหัสบันทึกการบำรุงรักษานี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น';
  }
  
  // User email constraint
  if (constraint.includes('email') || detail.includes('email')) {
    return 'อีเมลนี้มีอยู่ในระบบแล้ว กรุณาใช้อีเมลอื่น';
  }
  
  // Generic unique constraint
  return 'ข้อมูลนี้มีอยู่ในระบบแล้ว กรุณาตรวจสอบและลองใหม่อีกครั้ง';
}

/**
 * Parse foreign key constraint violation error
 */
function parseForeignKeyError(error: any): string {
  const detail = error.detail || '';
  const constraint = error.constraint || '';
  
  // Machine reference
  if (constraint.includes('machine') || detail.includes('machine')) {
    return 'ไม่พบเครื่องจักรที่ระบุ กรุณาตรวจสอบรหัสเครื่องจักร';
  }
  
  // Schedule reference
  if (constraint.includes('schedule') || detail.includes('schedule')) {
    return 'ไม่พบตารางการบำรุงรักษาที่ระบุ กรุณาตรวจสอบรหัสตาราง';
  }
  
  // User/technician reference
  if (constraint.includes('user') || constraint.includes('technician')) {
    return 'ไม่พบผู้ใช้งานที่ระบุ กรุณาตรวจสอบรหัสผู้ใช้';
  }
  
  // Generic foreign key
  return 'ไม่พบข้อมูลอ้างอิงที่ระบุ กรุณาตรวจสอบความถูกต้อง';
}

/**
 * Parse not null constraint violation error
 */
function parseNotNullError(error: any): string {
  const column = error.column || '';
  
  const fieldNames: Record<string, string> = {
    'machine_id': 'รหัสเครื่องจักร',
    'name': 'ชื่อ',
    'type': 'ประเภท',
    'location': 'ตำแหน่ง',
    'department': 'แผนก',
    'maintenance_date': 'วันที่บำรุงรักษา',
    'technician_id': 'รหัสช่างเทคนิค',
    'work_description': 'คำอธิบายการทำงาน',
    'next_maintenance_date': 'วันที่บำรุงรักษาถัดไป',
    'interval_days': 'ช่วงเวลา (วัน)',
    'priority': 'ระดับความสำคัญ',
    'status': 'สถานะ'
  };
  
  const fieldName = fieldNames[column] || column || 'ข้อมูล';
  return `${fieldName}เป็นข้อมูลที่จำเป็น กรุณากรอกข้อมูลให้ครบถ้วน`;
}

/**
 * Parse check constraint violation error
 */
function parseCheckConstraintError(error: any): string {
  const constraint = error.constraint || '';
  
  // Status checks
  if (constraint.includes('status')) {
    return 'สถานะที่ระบุไม่ถูกต้อง กรุณาเลือกสถานะที่ถูกต้อง';
  }
  
  // Priority checks
  if (constraint.includes('priority')) {
    return 'ระดับความสำคัญที่ระบุไม่ถูกต้อง กรุณาเลือกระดับที่ถูกต้อง';
  }
  
  // Date checks
  if (constraint.includes('date')) {
    return 'วันที่ที่ระบุไม่ถูกต้อง กรุณาตรวจสอบรูปแบบวันที่';
  }
  
  // Numeric checks
  if (constraint.includes('interval') || constraint.includes('duration') || constraint.includes('cost')) {
    return 'ค่าตัวเลขที่ระบุไม่ถูกต้อง กรุณาระบุค่าที่เป็นบวก';
  }
  
  // Generic check constraint
  return 'ข้อมูลที่ระบุไม่ถูกต้องตามเงื่อนไข กรุณาตรวจสอบและลองใหม่อีกครั้ง';
}

/**
 * Wrap database operation with error handling
 */
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  context: string = 'Database operation'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const dbError = parseDatabaseError(error);
    
    // Log detailed error for debugging (non-production)
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${context}] Database error:`, {
        original: error,
        parsed: dbError,
        stack: error?.stack
      });
    } else {
      // Log minimal error info in production
      console.error(`[${context}] Database error: ${dbError.code} - ${dbError.message}`);
    }
    
    // Throw user-friendly error
    const userError = new Error(dbError.message);
    (userError as any).code = dbError.code;
    (userError as any).statusCode = dbError.statusCode;
    (userError as any).isUserError = dbError.isUserError;
    
    throw userError;
  }
}