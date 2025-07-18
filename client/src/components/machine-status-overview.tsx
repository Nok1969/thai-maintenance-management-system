import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { machineArraySchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import type { Machine } from "@shared/schema";

export default function MachineStatusOverview() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [, setLocation] = useLocation();

  const { data: machines = [], isLoading } = useQuery({
    queryKey: ["/api/machines", { page: "1", limit: "20" }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/machines?page=1&limit=20");
      return machineArraySchema.parse(response);
    },
    retry: false,
  });

  const filteredMachines = (Array.isArray(machines) ? machines : []).filter((machine: Machine) => {
    if (statusFilter === "all") return true;
    return machine.status === statusFilter;
  });

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">
            สถานะเครื่องจักรโดยภาพรวม
          </CardTitle>
          <div className="flex space-x-2">
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
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMachines.map((machine: Machine) => (
            <Card key={machine.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-600">
                        {machine.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{machine.name}</h4>
                      <p className="text-xs text-gray-500">{machine.model || "-"}</p>
                    </div>
                  </div>
                  {getStatusBadge(machine.status)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">ประเภท:</span>
                    <span className="text-gray-900">{machine.type}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">ตำแหน่ง:</span>
                    <span className="text-gray-900">{machine.location}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">วันที่ติดตั้ง:</span>
                    <span className="text-gray-900">{formatDate(machine.installationDate)}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <Button 
                    variant="link"
                    className="w-full text-xs text-primary hover:text-blue-900 font-medium p-0"
                    onClick={() => setLocation('/machines')}
                  >
                    ดูรายละเอียด <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredMachines.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {statusFilter === "all" ? "ไม่มีเครื่องจักรในระบบ" : `ไม่มีเครื่องจักรที่มีสถานะ "${statusFilter}"`}
          </div>
        )}
        
        {machines && machines.length > 0 && (
          <div className="mt-6 text-center">
            <Button 
              variant="link"
              className="text-sm text-primary hover:text-blue-900 font-medium"
              onClick={() => setLocation('/machines')}
            >
              ดูเครื่องจักรทั้งหมด ({machines.length} เครื่อง) <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
