import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, ClipboardCheck, BarChart3, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import type { MaintenanceScheduleWithMachine } from "@shared/schema";

export default function UpcomingMaintenance() {
  const [, setLocation] = useLocation();
  
  const { data: upcomingMaintenance, isLoading } = useQuery({
    queryKey: ["/api/dashboard/upcoming-maintenance"],
    retry: false,
  });

  const isOverdue = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (schedule: MaintenanceScheduleWithMachine) => {
    if (isOverdue(schedule.nextMaintenanceDate)) {
      return <Badge variant="destructive">เลยกำหนด</Badge>;
    }
    
    const today = new Date();
    const maintenanceDate = new Date(schedule.nextMaintenanceDate);
    const diffTime = maintenanceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 3) {
      return <Badge className="bg-warning text-warning-foreground">รอดำเนินการ</Badge>;
    }
    
    return <Badge className="bg-primary text-primary-foreground">จัดตารางแล้ว</Badge>;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="shadow">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg font-medium text-gray-900">
              การบำรุงรักษาที่ใกล้จะถึง
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เครื่องจักร
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ประเภท
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่กำหนด
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {upcomingMaintenance?.slice(0, 5).map((schedule: MaintenanceScheduleWithMachine) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {schedule.machine.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {schedule.machine.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {schedule.machine.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {schedule.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(schedule.nextMaintenanceDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(schedule)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button 
                          variant="link" 
                          className="text-primary hover:text-blue-900 p-0"
                          onClick={() => setLocation('/schedules')}
                        >
                          {isOverdue(schedule.nextMaintenanceDate) ? 'ด่วน' : 'จัดตารางเวลา'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!upcomingMaintenance || upcomingMaintenance.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  ไม่มีการบำรุงรักษาที่ใกล้จะถึง
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="shadow">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900">
              การดำเนินการด่วน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-between hover:bg-gray-50"
                onClick={() => setLocation('/machines')}
              >
                <div className="flex items-center">
                  <Plus className="text-primary mr-3 h-4 w-4" />
                  <span className="text-sm font-medium">เพิ่มเครื่องจักรใหม่</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-between hover:bg-gray-50"
                onClick={() => setLocation('/schedules')}
              >
                <div className="flex items-center">
                  <Calendar className="text-secondary mr-3 h-4 w-4" />
                  <span className="text-sm font-medium">สร้างแผนบำรุงรักษา</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-between hover:bg-gray-50"
                onClick={() => setLocation('/records')}
              >
                <div className="flex items-center">
                  <ClipboardCheck className="text-success mr-3 h-4 w-4" />
                  <span className="text-sm font-medium">บันทึกการบำรุงรักษา</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-between hover:bg-gray-50"
                onClick={() => setLocation('/reports')}
              >
                <div className="flex items-center">
                  <BarChart3 className="text-purple-600 mr-3 h-4 w-4" />
                  <span className="text-sm font-medium">สร้างรายงาน</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900">
              กิจกรรมล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-success rounded-full flex items-center justify-center">
                    <ClipboardCheck className="text-white h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    การบำรุงรักษาเสร็จสิ้น
                  </p>
                  <p className="text-xs text-gray-500">กิจกรรมจะแสดงเมื่อมีข้อมูลในระบบ</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button 
                variant="link" 
                className="text-sm text-primary hover:text-blue-900 font-medium p-0"
                onClick={() => setLocation('/records')}
              >
                ดูกิจกรรมทั้งหมด <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
