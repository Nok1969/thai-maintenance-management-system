import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { insertMaintenanceScheduleSchema, type MaintenanceScheduleWithMachine, type InsertMaintenanceSchedule, type Machine } from "@shared/schema";
import { z } from "zod";
import { useState } from "react";

const formSchema = insertMaintenanceScheduleSchema.extend({
  startDate: z.string().min(1, "กรุณาเลือกวันที่เริ่มต้น"),
  nextMaintenanceDate: z.string().min(1, "กรุณาเลือกวันที่บำรุงรักษาครั้งถัดไป"),
  taskChecklistText: z.string().optional(),
  requiredPartsText: z.string().optional(),
  requiredToolsText: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ScheduleFormProps {
  schedule?: MaintenanceScheduleWithMachine | null;
  onSuccess?: () => void;
}

export default function ScheduleForm({ schedule, onSuccess }: ScheduleFormProps) {
  const { toast } = useToast();
  const [taskChecklistText, setTaskChecklistText] = useState(() => {
    if (schedule?.taskChecklist && Array.isArray(schedule.taskChecklist)) {
      return schedule.taskChecklist.join('\n');
    }
    return '';
  });
  const [requiredPartsText, setRequiredPartsText] = useState(() => {
    if (schedule?.requiredParts && Array.isArray(schedule.requiredParts)) {
      return schedule.requiredParts.join('\n');
    }
    return '';
  });
  const [requiredToolsText, setRequiredToolsText] = useState(() => {
    if (schedule?.requiredTools && Array.isArray(schedule.requiredTools)) {
      return schedule.requiredTools.join('\n');
    }
    return '';
  });

  const { data: machines } = useQuery({
    queryKey: ["/api/machines"],
    retry: false,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheduleId: schedule?.scheduleId || `SCH-${Date.now()}`,
      machineId: schedule?.machineId || undefined,
      type: schedule?.type || "",
      intervalDays: schedule?.intervalDays || 30,
      startDate: schedule?.startDate || "",
      nextMaintenanceDate: schedule?.nextMaintenanceDate || "",
      priority: schedule?.priority || "medium",
      estimatedDuration: schedule?.estimatedDuration || undefined,
      isActive: schedule?.isActive ?? true,
      taskChecklistText,
      requiredPartsText,
      requiredToolsText,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: InsertMaintenanceSchedule = {
        ...data,
        taskChecklist: data.taskChecklistText ? data.taskChecklistText.split('\n').filter(item => item.trim()) : null,
        requiredParts: data.requiredPartsText ? data.requiredPartsText.split('\n').filter(item => item.trim()) : null,
        requiredTools: data.requiredToolsText ? data.requiredToolsText.split('\n').filter(item => item.trim()) : null,
      };
      // Remove text fields that are not in the schema
      delete (payload as any).taskChecklistText;
      delete (payload as any).requiredPartsText;
      delete (payload as any).requiredToolsText;
      
      await apiRequest("POST", "/api/schedules", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/upcoming-maintenance"] });
      toast({
        title: "สำเร็จ",
        description: "สร้างแผนการบำรุงรักษาเรียบร้อยแล้ว",
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
        description: "ไม่สามารถสร้างแผนการบำรุงรักษาได้",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: Partial<InsertMaintenanceSchedule> = {
        ...data,
        taskChecklist: data.taskChecklistText ? data.taskChecklistText.split('\n').filter(item => item.trim()) : null,
        requiredParts: data.requiredPartsText ? data.requiredPartsText.split('\n').filter(item => item.trim()) : null,
        requiredTools: data.requiredToolsText ? data.requiredToolsText.split('\n').filter(item => item.trim()) : null,
      };
      // Remove text fields that are not in the schema
      delete (payload as any).taskChecklistText;
      delete (payload as any).requiredPartsText;
      delete (payload as any).requiredToolsText;
      
      await apiRequest("PUT", `/api/schedules/${schedule!.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/upcoming-maintenance"] });
      toast({
        title: "สำเร็จ",
        description: "แก้ไขแผนการบำรุงรักษาเรียบร้อยแล้ว",
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
        description: "ไม่สามารถแก้ไขแผนการบำรุงรักษาได้",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (schedule) {
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
              <Label htmlFor="scheduleId">รหัสแผนการบำรุงรักษา *</Label>
              <Input
                id="scheduleId"
                {...form.register("scheduleId")}
                placeholder="เช่น SCH-001"
                className={form.formState.errors.scheduleId ? "border-destructive" : ""}
              />
              {form.formState.errors.scheduleId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.scheduleId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="machineId">เครื่องจักร *</Label>
              <Select
                value={form.watch("machineId")?.toString()}
                onValueChange={(value) => form.setValue("machineId", parseInt(value))}
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
              <Label htmlFor="intervalDays">รอบการบำรุงรักษา (วัน) *</Label>
              <Input
                id="intervalDays"
                type="number"
                {...form.register("intervalDays", { valueAsNumber: true })}
                placeholder="30"
                className={form.formState.errors.intervalDays ? "border-destructive" : ""}
              />
              {form.formState.errors.intervalDays && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.intervalDays.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">ระดับความสำคัญ</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(value) => form.setValue("priority", value as "low" | "medium" | "high" | "critical")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">ต่ำ</SelectItem>
                  <SelectItem value="medium">ปานกลาง</SelectItem>
                  <SelectItem value="high">สูง</SelectItem>
                  <SelectItem value="critical">วิกฤต</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">เวลาที่ใช้โดยประมาณ (นาที)</Label>
              <Input
                id="estimatedDuration"
                type="number"
                {...form.register("estimatedDuration", { valueAsNumber: true })}
                placeholder="120"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">วันที่และการตั้งค่า</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">วันที่เริ่มต้น *</Label>
              <Input
                id="startDate"
                type="date"
                {...form.register("startDate")}
                className={form.formState.errors.startDate ? "border-destructive" : ""}
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextMaintenanceDate">วันที่บำรุงรักษาครั้งถัดไป *</Label>
              <Input
                id="nextMaintenanceDate"
                type="date"
                {...form.register("nextMaintenanceDate")}
                className={form.formState.errors.nextMaintenanceDate ? "border-destructive" : ""}
              />
              {form.formState.errors.nextMaintenanceDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nextMaintenanceDate.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
              <Label htmlFor="isActive">เปิดใช้งานแผนการบำรุงรักษา</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">รายละเอียดการบำรุงรักษา</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskChecklistText">รายการงานที่ต้องทำ (แยกแต่ละรายการด้วยการขึ้นบรรทัดใหม่)</Label>
            <Textarea
              id="taskChecklistText"
              value={taskChecklistText}
              onChange={(e) => {
                setTaskChecklistText(e.target.value);
                form.setValue("taskChecklistText", e.target.value);
              }}
              placeholder="เช่น&#10;ตรวจสอบน้ำมันหล่อลื่น&#10;ทำความสะอาดเครื่องจักร&#10;ตรวจสอบสายพาน"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requiredPartsText">อะไหล่ที่ต้องใช้ (แยกแต่ละรายการด้วยการขึ้นบรรทัดใหม่)</Label>
            <Textarea
              id="requiredPartsText"
              value={requiredPartsText}
              onChange={(e) => {
                setRequiredPartsText(e.target.value);
                form.setValue("requiredPartsText", e.target.value);
              }}
              placeholder="เช่น&#10;น้ำมันหล่อลื่น 1 ลิตร&#10;ไส้กรองอากาศ&#10;สายพาน"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requiredToolsText">เครื่องมือที่ต้องใช้ (แยกแต่ละรายการด้วยการขึ้นบรรทัดใหม่)</Label>
            <Textarea
              id="requiredToolsText"
              value={requiredToolsText}
              onChange={(e) => {
                setRequiredToolsText(e.target.value);
                form.setValue("requiredToolsText", e.target.value);
              }}
              placeholder="เช่น&#10;ประแจ 10mm&#10;ไขควง&#10;เครื่องวัดความดัน"
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
          {isLoading ? "กำลังบันทึก..." : schedule ? "แก้ไข" : "สร้างแผนการบำรุงรักษา"}
        </Button>
      </div>
    </form>
  );
}
