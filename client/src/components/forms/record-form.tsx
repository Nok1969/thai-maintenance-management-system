import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { insertMaintenanceRecordSchema, type MaintenanceRecordWithDetails, type InsertMaintenanceRecord, type Machine, type MaintenanceSchedule } from "@shared/schema";
import { z } from "zod";
import { useState } from "react";

const formSchema = insertMaintenanceRecordSchema.extend({
  maintenanceDate: z.string().min(1, "กรุณาเลือกวันที่บำรุงรักษา"),
  partsUsedText: z.string().optional(),
  workImagesText: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface RecordFormProps {
  record?: MaintenanceRecordWithDetails | null;
  onSuccess?: () => void;
}

export default function RecordForm({ record, onSuccess }: RecordFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [partsUsedText, setPartsUsedText] = useState(() => {
    if (record?.partsUsed && Array.isArray(record.partsUsed)) {
      return record.partsUsed.join('\n');
    }
    return '';
  });
  const [workImagesText, setWorkImagesText] = useState(() => {
    if (record?.workImages && Array.isArray(record.workImages)) {
      return record.workImages.join('\n');
    }
    return '';
  });

  const { data: machines } = useQuery({
    queryKey: ["/api/machines"],
    retry: false,
  });

  const { data: schedules } = useQuery({
    queryKey: ["/api/schedules"],
    retry: false,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recordId: record?.recordId || `REC-${Date.now()}`,
      machineId: record?.machineId || undefined,
      scheduleId: record?.scheduleId || undefined,
      maintenanceDate: record?.maintenanceDate || "",
      type: record?.type || "",
      technicianId: record?.technicianId || user?.id || "",
      workDescription: record?.workDescription || "",
      cost: record?.cost || undefined,
      duration: record?.duration || undefined,
      status: record?.status || "pending",
      notes: record?.notes || "",
      partsUsedText,
      workImagesText,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: InsertMaintenanceRecord = {
        ...data,
        partsUsed: data.partsUsedText ? data.partsUsedText.split('\n').filter(item => item.trim()) : null,
        workImages: data.workImagesText ? data.workImagesText.split('\n').filter(item => item.trim()) : null,
        scheduleId: data.scheduleId || null,
        cost: data.cost || null,
        duration: data.duration || null,
        notes: data.notes || null,
        completedAt: data.status === 'completed' ? new Date() : null,
      };
      // Remove text fields that are not in the schema
      delete (payload as any).partsUsedText;
      delete (payload as any).workImagesText;
      
      await apiRequest("POST", "/api/records", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "สำเร็จ",
        description: "เพิ่มบันทึกการบำรุงรักษาเรียบร้อยแล้ว",
      });
      onSuccess?.();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "ไม่ได้รับอนุญาต",
          description: "คุณออกจากระบบแล้ว กำลังเข้าสู่ระบบใหม่...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มบันทึกการบำรุงรักษาได้",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: Partial<InsertMaintenanceRecord> = {
        ...data,
        partsUsed: data.partsUsedText ? data.partsUsedText.split('\n').filter(item => item.trim()) : null,
        workImages: data.workImagesText ? data.workImagesText.split('\n').filter(item => item.trim()) : null,
        scheduleId: data.scheduleId || null,
        cost: data.cost || null,
        duration: data.duration || null,
        notes: data.notes || null,
        completedAt: data.status === 'completed' && record?.status !== 'completed' ? new Date() : record?.completedAt,
      };
      // Remove text fields that are not in the schema
      delete (payload as any).partsUsedText;
      delete (payload as any).workImagesText;
      
      await apiRequest("PUT", `/api/records/${record!.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "สำเร็จ",
        description: "แก้ไขบันทึกการบำรุงรักษาเรียบร้อยแล้ว",
      });
      onSuccess?.();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "ไม่ได้รับอนุญาต",
          description: "คุณออกจากระบบแล้ว กำลังเข้าสู่ระบบใหม่...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขบันทึกการบำรุงรักษาได้",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (record) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ข้อมูลพื้นฐาน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recordId">รหัสบันทึก *</Label>
              <Input
                id="recordId"
                {...form.register("recordId")}
                placeholder="เช่น REC-001"
                className={form.formState.errors.recordId ? "border-destructive" : ""}
              />
              {form.formState.errors.recordId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.recordId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="machineId">เครื่องจักร *</Label>
              <Select
                value={form.watch("machineId")?.toString()}
                onValueChange={(value) => {
                  const numValue = Number(value);
                  if (!isNaN(numValue)) {
                    form.setValue("machineId", numValue);
                  }
                }}
              >
                <SelectTrigger className={form.formState.errors.machineId ? "border-destructive" : ""}>
                  <SelectValue placeholder="เลือกเครื่องจักร" />
                </SelectTrigger>
                <SelectContent>
                  {machines?.map((machine: Machine) => (
                    <SelectItem key={machine.id} value={machine.id.toString()}>
                      {machine.name} ({machine.machineId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.machineId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.machineId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleId">แผนการบำรุงรักษา (ถ้ามี)</Label>
              <Select
                value={form.watch("scheduleId")?.toString() || ""}
                onValueChange={(value) => {
                  if (value) {
                    const numValue = Number(value);
                    form.setValue("scheduleId", !isNaN(numValue) ? numValue : undefined);
                  } else {
                    form.setValue("scheduleId", undefined);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแผนการบำรุงรักษา (ถ้ามี)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ไม่มี</SelectItem>
                  {schedules?.map((schedule: MaintenanceSchedule) => (
                    <SelectItem key={schedule.id} value={schedule.id.toString()}>
                      {schedule.scheduleId} - {schedule.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenanceDate">วันที่บำรุงรักษา *</Label>
              <Input
                id="maintenanceDate"
                type="date"
                {...form.register("maintenanceDate")}
                className={form.formState.errors.maintenanceDate ? "border-destructive" : ""}
              />
              {form.formState.errors.maintenanceDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.maintenanceDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">ประเภทการบำรุงรักษา *</Label>
              <Input
                id="type"
                {...form.register("type")}
                placeholder="เช่น ตรวจสอบประจำเดือน"
                className={form.formState.errors.type ? "border-destructive" : ""}
              />
              {form.formState.errors.type && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">สถานะ</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value as "pending" | "in_progress" | "completed" | "cancelled")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">รอดำเนินการ</SelectItem>
                  <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                  <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ข้อมูลการดำเนินการ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duration">เวลาที่ใช้ (นาที)</Label>
              <Input
                id="duration"
                type="number"
                {...form.register("duration", { valueAsNumber: true })}
                placeholder="120"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">ค่าใช้จ่าย (บาท)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                {...form.register("cost")}
                placeholder="1500.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workDescription">รายละเอียดงานที่ทำ *</Label>
              <Textarea
                id="workDescription"
                {...form.register("workDescription")}
                placeholder="อธิบายรายละเอียดงานที่ทำ..."
                rows={4}
                className={form.formState.errors.workDescription ? "border-destructive" : ""}
              />
              {form.formState.errors.workDescription && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.workDescription.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="หมายเหตุเพิ่มเติม..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">อะไหล่และรูปภาพ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partsUsedText">อะไหล่ที่ใช้ (แยกแต่ละรายการด้วยการขึ้นบรรทัดใหม่)</Label>
            <Textarea
              id="partsUsedText"
              value={partsUsedText}
              onChange={(e) => {
                setPartsUsedText(e.target.value);
                form.setValue("partsUsedText", e.target.value);
              }}
              placeholder=""
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workImagesText">URL รูปภาพการทำงาน (แยกแต่ละรายการด้วยการขึ้นบรรทัดใหม่)</Label>
            <Textarea
              id="workImagesText"
              value={workImagesText}
              onChange={(e) => {
                setWorkImagesText(e.target.value);
                form.setValue("workImagesText", e.target.value);
              }}
              placeholder=""
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          disabled={isLoading}
        >
          ยกเลิก
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "กำลังบันทึก..." : record ? "แก้ไข" : "เพิ่มบันทึก"}
        </Button>
      </div>
    </form>
  );
}
