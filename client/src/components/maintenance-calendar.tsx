import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function MaintenanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ["/api/dashboard/calendar", currentYear, currentMonth],
    retry: false,
  });

  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth, 1));
  };

  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return days;
  };

  const getMaintenanceDataForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return calendarData?.find((item: any) => item.date === dateString);
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth - 1;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const calendarDays = generateCalendarDays();

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">
            ปฏิทินการบำรุงรักษา
          </CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevMonth}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
                {monthNames[currentMonth - 1]} {currentYear}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary rounded-full mr-1"></div>
                <span>จัดตารางแล้ว</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-warning rounded-full mr-1"></div>
                <span>รอดำเนินการ</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-destructive rounded-full mr-1"></div>
                <span>เลยกำหนด</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const maintenanceData = getMaintenanceDataForDate(date);
            const isInCurrentMonth = isCurrentMonth(date);
            const isTodayDate = isToday(date);

            return (
              <div
                key={index}
                className={`h-20 p-1 border border-gray-100 rounded relative ${
                  isTodayDate ? 'border-primary border-2 bg-blue-50' : ''
                } ${!isInCurrentMonth ? 'text-gray-400' : ''}`}
              >
                <div className={`text-xs font-medium mb-1 ${isTodayDate ? 'text-primary' : 'text-gray-900'}`}>
                  {date.getDate()}
                </div>
                
                {maintenanceData && isInCurrentMonth && (
                  <div className="space-y-1">
                    {Array.from({ length: Math.min(maintenanceData.maintenanceCount, 3) }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          maintenanceData.status === 'overdue' ? 'bg-destructive' :
                          maintenanceData.status === 'pending' ? 'bg-warning' :
                          'bg-primary'
                        }`}
                      />
                    ))}
                    {maintenanceData.maintenanceCount > 3 && (
                      <div className="text-xs text-gray-500">
                        +{maintenanceData.maintenanceCount - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
