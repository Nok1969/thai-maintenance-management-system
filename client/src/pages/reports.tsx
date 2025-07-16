import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import HeaderNavigation from "@/components/header-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, Calendar, TrendingUp, DollarSign } from "lucide-react";
import type { MaintenanceRecordWithDetails, Machine } from "@shared/schema";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("this_month");
  const [selectedMachine, setSelectedMachine] = useState<string>("all");

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

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ["/api/records"],
    retry: false,
  });

  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: ["/api/machines"],
    retry: false,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">กำลังโหลด...</p>
      </div>
    </div>;
  }

  const filterRecordsByPeriod = (records: MaintenanceRecordWithDetails[]) => {
    if (!records) return [];
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    return records.filter(record => {
      const recordDate = new Date(record.maintenanceDate);
      
      switch (selectedPeriod) {
        case "this_month":
          return recordDate >= startOfMonth;
        case "last_month":
          return recordDate >= startOfLastMonth && recordDate <= endOfLastMonth;
        case "this_year":
          return recordDate >= startOfYear;
        default:
          return true;
      }
    });
  };

  const filteredRecords = filterRecordsByPeriod(records || []).filter(record => 
    selectedMachine === "all" || record.machineId.toString() === selectedMachine
  );

  const calculateTotalCost = (records: MaintenanceRecordWithDetails[]) => {
    return records.reduce((total, record) => {
      return total + (record.cost ? parseFloat(record.cost) : 0);
    }, 0);
  };

  const calculateTotalDuration = (records: MaintenanceRecordWithDetails[]) => {
    return records.reduce((total, record) => {
      return total + (record.duration || 0);
    }, 0);
  };

  const getStatusCounts = (records: MaintenanceRecordWithDetails[]) => {
    const counts = {
      completed: 0,
      in_progress: 0,
      pending: 0,
      cancelled: 0,
    };

    records.forEach(record => {
      if (record.status in counts) {
        counts[record.status as keyof typeof counts]++;
      }
    });

    return counts;
  };

  const getMachineMaintenanceCount = (records: MaintenanceRecordWithDetails[]) => {
    const machineCounts: { [key: string]: number } = {};
    
    records.forEach(record => {
      const machineName = record.machine.name;
      machineCounts[machineName] = (machineCounts[machineName] || 0) + 1;
    });

    return Object.entries(machineCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const totalCost = calculateTotalCost(filteredRecords);
  const totalDuration = calculateTotalDuration(filteredRecords);
  const statusCounts = getStatusCounts(filteredRecords);
  const machineMaintenanceCount = getMachineMaintenanceCount(filteredRecords);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ชั่วโมง ${mins} นาที`;
    }
    return `${mins} นาที`;
  };

  const handleExportReport = () => {
    const csvContent = [
      ['รหัสบันทึก', 'เครื่องจักร', 'ประเภท', 'วันที่', 'ช่าง', 'สถานะ', 'เวลา (นาที)', 'ค่าใช้จ่าย'],
      ...filteredRecords.map(record => [
        record.recordId,
        record.machine.name,
        record.type,
        record.maintenanceDate,
        `${record.technician.firstName} ${record.technician.lastName}`,
        record.status,
        record.duration?.toString() || '0',
        record.cost || '0'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `maintenance_report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">รายงานและสถิติ</h1>
          <Button onClick={handleExportReport} className="bg-success hover:bg-success/90">
            <Download className="w-4 h-4 mr-2" />
            ส่งออกรายงาน
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">ช่วงเวลา:</label>
              </div>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">เดือนนี้</SelectItem>
                  <SelectItem value="last_month">เดือนที่แล้ว</SelectItem>
                  <SelectItem value="this_year">ปีนี้</SelectItem>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">เครื่องจักร:</label>
              </div>
              <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {machines?.map((machine: Machine) => (
                    <SelectItem key={machine.id} value={machine.id.toString()}>
                      {machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                งานทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {filteredRecords.length}
              </div>
              <p className="text-sm text-gray-600">งานบำรุงรักษา</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-success" />
                ค่าใช้จ่ายรวม
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(totalCost)}
              </div>
              <p className="text-sm text-gray-600">ค่าใช้จ่าย</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-warning" />
                เวลารวม
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {Math.floor(totalDuration / 60)}
              </div>
              <p className="text-sm text-gray-600">ชั่วโมง</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-secondary" />
                เฉลี่ย/งาน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {filteredRecords.length > 0 ? Math.floor(totalDuration / filteredRecords.length) : 0}
              </div>
              <p className="text-sm text-gray-600">นาที</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>สถานะงานบำรุงรักษา</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-success text-success-foreground">เสร็จสิ้น</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{statusCounts.completed}</div>
                    <div className="text-sm text-gray-500">
                      {filteredRecords.length > 0 ? Math.round((statusCounts.completed / filteredRecords.length) * 100) : 0}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-primary text-primary-foreground">กำลังดำเนินการ</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{statusCounts.in_progress}</div>
                    <div className="text-sm text-gray-500">
                      {filteredRecords.length > 0 ? Math.round((statusCounts.in_progress / filteredRecords.length) * 100) : 0}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-warning text-warning-foreground">รอดำเนินการ</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{statusCounts.pending}</div>
                    <div className="text-sm text-gray-500">
                      {filteredRecords.length > 0 ? Math.round((statusCounts.pending / filteredRecords.length) * 100) : 0}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">ยกเลิก</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{statusCounts.cancelled}</div>
                    <div className="text-sm text-gray-500">
                      {filteredRecords.length > 0 ? Math.round((statusCounts.cancelled / filteredRecords.length) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>เครื่องจักรที่บำรุงรักษามากที่สุด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {machineMaintenanceCount.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <Badge variant="outline">{item.count} ครั้ง</Badge>
                  </div>
                ))}
                {machineMaintenanceCount.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    ไม่มีข้อมูล
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดงานบำรุงรักษา</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">รหัสบันทึก</th>
                    <th className="text-left p-2">เครื่องจักร</th>
                    <th className="text-left p-2">ประเภท</th>
                    <th className="text-left p-2">วันที่</th>
                    <th className="text-left p-2">ช่าง</th>
                    <th className="text-left p-2">สถานะ</th>
                    <th className="text-left p-2">เวลา</th>
                    <th className="text-left p-2">ค่าใช้จ่าย</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{record.recordId}</td>
                      <td className="p-2">{record.machine.name}</td>
                      <td className="p-2">{record.type}</td>
                      <td className="p-2">
                        {new Date(record.maintenanceDate).toLocaleDateString('th-TH')}
                      </td>
                      <td className="p-2">
                        {record.technician.firstName} {record.technician.lastName}
                      </td>
                      <td className="p-2">
                        {record.status === 'completed' && <Badge className="bg-success text-success-foreground">เสร็จสิ้น</Badge>}
                        {record.status === 'in_progress' && <Badge className="bg-primary text-primary-foreground">กำลังดำเนินการ</Badge>}
                        {record.status === 'pending' && <Badge className="bg-warning text-warning-foreground">รอดำเนินการ</Badge>}
                        {record.status === 'cancelled' && <Badge variant="destructive">ยกเลิก</Badge>}
                      </td>
                      <td className="p-2">{formatDuration(record.duration || 0)}</td>
                      <td className="p-2">{formatCurrency(parseFloat(record.cost || '0'))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRecords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  ไม่มีข้อมูลในช่วงเวลาที่เลือก
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
