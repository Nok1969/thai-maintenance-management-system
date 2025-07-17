import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import HeaderNavigation from "@/components/header-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ScheduleForm from "@/components/forms/schedule-form";
import { Plus, Search, Calendar, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import type { MaintenanceScheduleWithMachine } from "@shared/schema";

export default function Schedules() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceScheduleWithMachine | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ["/api/schedules", { page: "1", limit: "10" }],
    queryFn: () => apiRequest("GET", "/api/schedules?page=1&limit=10"),
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({
        title: "สำเร็จ",
        description: "ลบแผนการบำรุงรักษาเรียบร้อยแล้ว",
      });
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
        description: "ไม่สามารถลบแผนการบำรุงรักษาได้",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">กำลังโหลด...</p>
      </div>
    </div>;
  }

  const filteredSchedules = schedules?.filter((schedule: MaintenanceScheduleWithMachine) => {
    const matchesSearch = schedule.machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.scheduleId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === "all" || schedule.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  }) || [];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />วิกฤต</Badge>;
      case "high":
        return <Badge className="bg-orange-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" />สูง</Badge>;
      case "medium":
        return <Badge className="bg-warning text-warning-foreground"><Clock className="w-3 h-3 mr-1" />ปานกลาง</Badge>;
      case "low":
        return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />ต่ำ</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const isOverdue = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleEdit = (schedule: MaintenanceScheduleWithMachine) => {
    setEditingSchedule(schedule);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบแผนการบำรุงรักษานี้?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingSchedule(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">แผนการบำรุงรักษา</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingSchedule(null)}>
                <Plus className="w-4 h-4 mr-2" />
                สร้างแผนใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? "แก้ไขแผนการบำรุงรักษา" : "สร้างแผนการบำรุงรักษาใหม่"}
                </DialogTitle>
              </DialogHeader>
              <ScheduleForm 
                schedule={editingSchedule} 
                onSuccess={handleDialogClose}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ค้นหาแผนการบำรุงรักษา..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={priorityFilter === "all" ? "default" : "outline"}
                  onClick={() => setPriorityFilter("all")}
                  size="sm"
                >
                  ทั้งหมด
                </Button>
                <Button
                  variant={priorityFilter === "critical" ? "destructive" : "outline"}
                  onClick={() => setPriorityFilter("critical")}
                  size="sm"
                >
                  วิกฤต
                </Button>
                <Button
                  variant={priorityFilter === "high" ? "default" : "outline"}
                  onClick={() => setPriorityFilter("high")}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  สูง
                </Button>
                <Button
                  variant={priorityFilter === "medium" ? "default" : "outline"}
                  onClick={() => setPriorityFilter("medium")}
                  size="sm"
                  className="bg-warning hover:bg-warning/90 text-warning-foreground"
                >
                  ปานกลาง
                </Button>
                <Button
                  variant={priorityFilter === "low" ? "outline" : "outline"}
                  onClick={() => setPriorityFilter("low")}
                  size="sm"
                >
                  ต่ำ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {schedulesLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSchedules.map((schedule: MaintenanceScheduleWithMachine) => (
              <Card key={schedule.id} className={`hover:shadow-lg transition-shadow ${isOverdue(schedule.nextMaintenanceDate) ? 'border-red-200 bg-red-50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{schedule.machine.name}</CardTitle>
                    {getPriorityBadge(schedule.priority)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {schedule.scheduleId} • {schedule.type}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">รอบการบำรุงรักษา:</span>
                      <span>{schedule.intervalDays} วัน</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">วันที่กำหนด:</span>
                      <span className={isOverdue(schedule.nextMaintenanceDate) ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                        {formatDate(schedule.nextMaintenanceDate)}
                        {isOverdue(schedule.nextMaintenanceDate) && (
                          <span className="ml-1 text-xs">(เลยกำหนด)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">ตำแหน่ง:</span>
                      <span>{schedule.machine.location}</span>
                    </div>
                    {schedule.estimatedDuration && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">เวลาที่ใช้:</span>
                        <span>{Math.floor(schedule.estimatedDuration / 60)} ชั่วโมง {schedule.estimatedDuration % 60} นาที</span>
                      </div>
                    )}
                  </div>
                  
                  {schedule.taskChecklist && Array.isArray(schedule.taskChecklist) && schedule.taskChecklist.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-500 mb-2">รายการงาน:</div>
                      <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                        {schedule.taskChecklist.map((task: any, index: number) => (
                          <div key={index} className="truncate">• {typeof task === 'string' ? task : task.name || task.description}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(schedule)}
                      className="flex-1"
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      แก้ไข
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(schedule.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      ลบ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!schedulesLoading && filteredSchedules.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบแผนการบำรุงรักษา</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || priorityFilter !== "all" 
                  ? "ไม่พบแผนการบำรุงรักษาที่ตรงกับเงื่อนไขการค้นหา" 
                  : "ยังไม่มีแผนการบำรุงรักษาในระบบ"}
              </p>
              {!searchTerm && priorityFilter === "all" && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  สร้างแผนใหม่
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
