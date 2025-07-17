import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { insertMachineSchema, type Machine, type InsertMachine } from "@shared/schema";
import { z } from "zod";

const formSchema = insertMachineSchema.extend({
  installationDate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface MachineFormProps {
  machine?: Machine | null;
  onSuccess?: () => void;
}

export default function MachineForm({ machine, onSuccess }: MachineFormProps) {
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      machineId: machine?.machineId || "",
      name: machine?.name || "",
      type: machine?.type || "",
      manufacturer: machine?.manufacturer || "",
      model: machine?.model || "",
      serialNumber: machine?.serialNumber || "",
      installationDate: machine?.installationDate || "",
      location: machine?.location || "",
      department: machine?.department || "",
      status: machine?.status || "operational",
      manualUrl: machine?.manualUrl || "",
      imageUrl: machine?.imageUrl || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: InsertMachine = {
        ...data,
        installationDate: data.installationDate || null,
      };
      await apiRequest("POST", "/api/machines", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      toast({
        title: "สำเร็จ",
        description: "เพิ่มเครื่องจักรเรียบร้อยแล้ว",
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
        description: "ไม่สามารถเพิ่มเครื่องจักรได้",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: Partial<InsertMachine> = {
        ...data,
        installationDate: data.installationDate || null,
      };
      await apiRequest("PUT", `/api/machines/${machine!.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      toast({
        title: "สำเร็จ",
        description: "แก้ไขเครื่องจักรเรียบร้อยแล้ว",
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
        description: "ไม่สามารถแก้ไขเครื่องจักรได้",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (machine) {
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
              <Label htmlFor="machineId">รหัสเครื่องจักร *</Label>
              <Input
                id="machineId"
                {...form.register("machineId")}
                placeholder=""
                className={form.formState.errors.machineId ? "border-destructive" : ""}
              />
              {form.formState.errors.machineId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.machineId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">ชื่อเครื่องจักร *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder=""
                className={form.formState.errors.name ? "border-destructive" : ""}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">ประเภทเครื่องจักร *</Label>
              <Input
                id="type"
                {...form.register("type")}
                placeholder=""
                className={form.formState.errors.type ? "border-destructive" : ""}
              />
              {form.formState.errors.type && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">ผู้ผลิต</Label>
              <Input
                id="manufacturer"
                {...form.register("manufacturer")}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">รุ่น</Label>
              <Input
                id="model"
                {...form.register("model")}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">หมายเลขเครื่อง</Label>
              <Input
                id="serialNumber"
                {...form.register("serialNumber")}
                placeholder=""
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ข้อมูลการติดตั้งและสถานะ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="installationDate">วันที่ติดตั้ง</Label>
              <Input
                id="installationDate"
                type="date"
                {...form.register("installationDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">ตำแหน่ง/แผนก *</Label>
              <Input
                id="location"
                {...form.register("location")}
                placeholder=""
                className={form.formState.errors.location ? "border-destructive" : ""}
              />
              {form.formState.errors.location && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.location.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">แผนก</Label>
              <Input
                id="department"
                {...form.register("department")}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">สถานะการใช้งาน</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value as "operational" | "maintenance" | "down")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">ใช้งานได้</SelectItem>
                  <SelectItem value="maintenance">กำลังบำรุงรักษา</SelectItem>
                  <SelectItem value="down">เสียหาย</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manualUrl">URL คู่มือการใช้งาน</Label>
              <Input
                id="manualUrl"
                type="url"
                {...form.register("manualUrl")}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL รูปภาพเครื่องจักร</Label>
              <Input
                id="imageUrl"
                type="url"
                {...form.register("imageUrl")}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

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
          {isLoading ? "กำลังบันทึก..." : machine ? "แก้ไข" : "เพิ่มเครื่องจักร"}
        </Button>
      </div>
    </form>
  );
}
