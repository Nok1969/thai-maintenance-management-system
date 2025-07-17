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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MachineForm from "@/components/forms/machine-form";
import MachineHistory from "@/components/machine-history";
import { Plus, Search, Settings, AlertTriangle, CheckCircle, Clock, MapPin, History, Eye } from "lucide-react";
import type { Machine } from "@shared/schema";

export default function Machines() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [viewingMachine, setViewingMachine] = useState<Machine | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

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

  const { data: machines = [], isLoading: machinesLoading } = useQuery({
    queryKey: ["/api/machines", { page: "1", limit: "10" }],
    queryFn: () => apiRequest("GET", "/api/machines?page=1&limit=10"),
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/machines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      toast({
        title: "สำเร็จ",
        description: "ลบข้อมูลเครื่องจักรเรียบร้อยแล้ว",
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
        description: "ไม่สามารถลบข้อมูลเครื่องจักรได้",
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

  const filteredMachines = (Array.isArray(machines) ? machines : []).filter((machine: Machine) => {
    const matchesSearch = machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.machineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || machine.status === statusFilter;
    const matchesLocation = locationFilter === "all" || machine.location === locationFilter;
    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Get unique locations for filter
  const uniqueLocations = [...new Set((Array.isArray(machines) ? machines : []).map((machine: Machine) => machine.location))];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />ใช้งานได้</Badge>;
      case "maintenance":
        return <Badge className="bg-warning text-warning-foreground"><Clock className="w-3 h-3 mr-1" />กำลังบำรุงรักษา</Badge>;
      case "down":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />เสียหาย</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบเครื่องจักรนี้?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingMachine(null);
  };

  const handleView = (machine: Machine) => {
    setViewingMachine(machine);
    setIsViewDialogOpen(true);
  };

  const handleViewDialogClose = () => {
    setIsViewDialogOpen(false);
    setViewingMachine(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">จัดการเครื่องจักร</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMachine(null)}>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มเครื่องจักรใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMachine ? "แก้ไขข้อมูลเครื่องจักร" : "เพิ่มเครื่องจักรใหม่"}
                </DialogTitle>
              </DialogHeader>
              <MachineForm 
                machine={editingMachine} 
                onSuccess={handleDialogClose}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ค้นหาเครื่องจักร..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-[200px]">
                      <MapPin className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="เลือกตำแหน่ง" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกตำแหน่ง</SelectItem>
                      {uniqueLocations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  size="sm"
                >
                  ทั้งหมด
                </Button>
                <Button
                  variant={statusFilter === "operational" ? "default" : "outline"}
                  onClick={() => setStatusFilter("operational")}
                  size="sm"
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  ใช้งานได้
                </Button>
                <Button
                  variant={statusFilter === "maintenance" ? "default" : "outline"}
                  onClick={() => setStatusFilter("maintenance")}
                  size="sm"
                  className="bg-warning hover:bg-warning/90 text-warning-foreground"
                >
                  บำรุงรักษา
                </Button>
                <Button
                  variant={statusFilter === "down" ? "destructive" : "outline"}
                  onClick={() => setStatusFilter("down")}
                  size="sm"
                >
                  เสียหาย
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {machinesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMachines.map((machine: Machine) => (
              <Card key={machine.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{machine.name}</CardTitle>
                    {getStatusBadge(machine.status)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {machine.machineId} • {machine.type}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">ผู้ผลิต:</span>
                      <span>{machine.manufacturer || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">รุ่น:</span>
                      <span>{machine.model || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">ตำแหน่ง:</span>
                      <span>{machine.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">แผนก:</span>
                      <span>{machine.department || "-"}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(machine)}
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      ดู
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(machine)}
                      className="flex-1"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      แก้ไข
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(machine.id)}
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

        {!machinesLoading && filteredMachines.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบเครื่องจักร</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "ไม่พบเครื่องจักรที่ตรงกับเงื่อนไขการค้นหา" 
                  : "ยังไม่มีข้อมูลเครื่องจักรในระบบ"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มเครื่องจักรใหม่
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Machine View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                รายละเอียดเครื่องจักร: {viewingMachine?.name}
              </DialogTitle>
            </DialogHeader>
            
            {viewingMachine && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">รายละเอียด</TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    ประวัติ
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">ข้อมูลพื้นฐาน</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="text-sm text-gray-500">รหัสเครื่องจักร</div>
                          <div className="font-medium">{viewingMachine.machineId}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">ชื่อเครื่องจักร</div>
                          <div className="font-medium">{viewingMachine.name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">ประเภท</div>
                          <div className="font-medium">{viewingMachine.type}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">สถานะ</div>
                          <div>{getStatusBadge(viewingMachine.status)}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">ตำแหน่งที่ตั้ง</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="text-sm text-gray-500">ตำแหน่ง</div>
                          <div className="font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            {viewingMachine.location}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">แผนก</div>
                          <div className="font-medium">{viewingMachine.department || "-"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">วันที่ติดตั้ง</div>
                          <div className="font-medium">{viewingMachine.installationDate || "-"}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="col-span-2">
                      <CardHeader>
                        <CardTitle className="text-lg">ข้อมูลผู้ผลิต</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">ผู้ผลิต</div>
                          <div className="font-medium">{viewingMachine.manufacturer || "-"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">รุ่น</div>
                          <div className="font-medium">{viewingMachine.model || "-"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">หมายเลขเครื่อง</div>
                          <div className="font-medium">{viewingMachine.serialNumber || "-"}</div>
                        </div>
                      </CardContent>
                    </Card>

                    {(viewingMachine.manualUrl || viewingMachine.imageUrl) && (
                      <Card className="col-span-2">
                        <CardHeader>
                          <CardTitle className="text-lg">เอกสารและรูปภาพ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {viewingMachine.manualUrl && (
                            <div>
                              <div className="text-sm text-gray-500">คู่มือการใช้งาน</div>
                              <a
                                href={viewingMachine.manualUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                ดูคู่มือ
                              </a>
                            </div>
                          )}
                          {viewingMachine.imageUrl && (
                            <div>
                              <div className="text-sm text-gray-500">รูปภาพเครื่องจักร</div>
                              <a
                                href={viewingMachine.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                ดูรูปภาพ
                              </a>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="history">
                  <MachineHistory machineId={viewingMachine.id} />
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
