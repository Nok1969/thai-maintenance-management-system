import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import HeaderNavigation from "@/components/header-navigation";
import DashboardStats from "@/components/dashboard-stats";
import UpcomingMaintenance from "@/components/upcoming-maintenance";
import MachineStatusOverview from "@/components/machine-status-overview";
import MaintenanceCalendar from "@/components/maintenance-calendar";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            ภาพรวมระบบบำรุงรักษา
          </h2>
          <DashboardStats />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <UpcomingMaintenance />
          </div>
          <div>
            {/* Quick Actions will be included in UpcomingMaintenance component */}
          </div>
        </div>

        <div className="mb-8">
          <MachineStatusOverview />
        </div>

        <div>
          <MaintenanceCalendar />
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            © 2025 ระบบบำรุงรักษาเครื่องจักรประจำปี โรงแนท รีเจ้นท์
            สงวนสิทธิ์ทุกประการ
          </div>
        </div>
      </footer>
    </div>
  );
}
