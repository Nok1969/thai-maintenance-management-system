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
import RecordForm from "@/components/forms/record-form";
import { Plus, Search, ClipboardCheck, CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";
import type { MaintenanceRecordWithDetails } from "@shared/schema";
import { maintenanceRecordWithDetailsArraySchema } from "@shared/schema";

export default function Records() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecordWithDetails | null>(null);

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

  const {
    data,
    isLoading: recordsLoading
  } = useQuery({
    queryKey: ["/api/records", { page: "1", limit: "10" }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/records?page=1&limit=10");
      return maintenanceRecordWithDetailsArraySchema.parse(response);
    },
    retry: false,
  });

  const records = Array.isArray(data) ? data : [];

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/records"] });
      toast({
        title: "สำเร็จ",
        description: "ลบบันทึกการบำรุงรักษาเรียบร้อยแล้ว",
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
        description: "ไม่สามารถลบบันทึกการบำรุงรักษาได้",
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

  const filteredRecords = records.filter((record: MaintenanceRecordWithDetails) => {
    const matchesSearch = record.machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.recordId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.technician.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.technician.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />เสร็จสิ้น</Badge>;
      case "in_progress":
        return <Badge className="bg-primary text-primary-foreground"><Clock className="w-3 h-3 mr-1" />กำลังดำเนินการ</Badge>;
      case "pending":
        return <Badge className="bg-warning text-warning-foreground"><AlertTriangle className="w-3 h-3 mr-1" />รอดำเนินการ</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />ยกเลิก</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(parseFloat(amount));
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ชั่วโมง ${mins} นาที`;
    }
    return `${mins} นาที`;
  };

  const handleEdit = (record: MaintenanceRecordWithDetails) => {
    setEditingRecord(record);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบบันทึกการบำรุงรักษานี้?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingRecord(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">บันทึกการบำรุงรักษา</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingRecord(null)}>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มบันทึกใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRecord ? "แก้ไขบันทึกการบำรุงรักษา" : "เพิ่มบันทึกการบำรุงรักษาใหม่"}
                </DialogTitle>
              </DialogHeader>
              <RecordForm 
                record={editingRecord} 
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
                  placeholder="ค้นหาบันทึกการบำรุงรักษา..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  size="sm"
                >
                  ทั้งหมด
                </Button>
                <Button
                  variant={statusFilter === "completed" ? "default" : "outline"}
                  onClick={() => setStatusFilter("completed")}
                  size="sm"
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  เสร็จสิ้น
                </Button>
                <Button
                  variant={statusFilter === "in_progress" ? "default" : "outline"}
                  onClick={() => setStatusFilter("in_progress")}
                  size="sm"
                >
                  กำลังดำเนินการ
                </Button>
                <Button
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  onClick={() => setStatusFilter("pending")}
                  size="sm"
                  className="bg-warning hover:bg-warning/90 text-warning-foreground"
                >
                  รอดำเนินการ
                </Button>
                <Button
                  variant={statusFilter === "cancelled" ? "destructive" : "outline"}
                  onClick={() => setStatusFilter("cancelled")}
                  size="sm"
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {recordsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <ClipboardCheck className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่มีบันทึกการบำรุงรักษาในระบบ
            </h3>
            <p className="text-gray-500 mb-4">
              เริ่มต้นโดยเพิ่มบันทึกการบำรุงรักษาแรกของคุณ
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มบันทึกการบำรุงรักษา
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRecords.map((record: MaintenanceRecordWithDetails) => (
              <Card key={record.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{record.machine.name}</CardTitle>
                    {getStatusBadge(record.status)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {record.recordId} • {record.type}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">วันที่บำรุงรักษา:</span>
                      <span>{formatDate(record.maintenanceDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">ช่างผู้ปฏิบัติงาน:</span>
                      <span>{record.technician.firstName} {record.technician.lastName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">เวลาที่ใช้:</span>
                      <span>{formatDuration(record.duration)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">ค่าใช้จ่าย:</span>
                      <span>{formatCurrency(record.cost)}</span>
                    </div>
                  </div>
                  
                  {record.workDescription && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-500 mb-1">รายละเอียดงาน:</div>
                      <div className="text-sm text-gray-700 max-h-16 overflow-y-auto">
                        {record.workDescription}
                      </div>
                    </div>
                  )}

                  {record.partsUsed && Array.isArray(record.partsUsed) && record.partsUsed.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-500 mb-1">อะไหล่ที่ใช้:</div>
                      <div className="text-xs text-gray-600 max-h-16 overflow-y-auto">
                        {record.partsUsed.map((part: any, index: number) => (
                          <div key={index} className="truncate">• {typeof part === 'string' ? part : part.name || part.description}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(record)}
                      className="flex-1"
                    >
                      <ClipboardCheck className="w-3 h-3 mr-1" />
                      แก้ไข
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
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

        {!recordsLoading && filteredRecords.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบบันทึกการบำรุงรักษา</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "ไม่พบบันทึกการบำรุงรักษาที่ตรงกับเงื่อนไขการค้นหา" 
                  : "ยังไม่มีบันทึกการบำรุงรักษาในระบบ"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มบันทึกใหม่
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
