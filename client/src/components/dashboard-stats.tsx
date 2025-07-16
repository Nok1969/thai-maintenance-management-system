import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Cog, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default function DashboardStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "เครื่องจักรทั้งหมด",
      value: stats?.totalMachines || 0,
      icon: Cog,
      color: "text-primary",
      bgColor: "bg-primary"
    },
    {
      title: "รอการบำรุงรักษา",
      value: stats?.pendingMaintenance || 0,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning"
    },
    {
      title: "เสร็จสิ้นเดือนนี้",
      value: stats?.completedThisMonth || 0,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success"
    },
    {
      title: "เลยกำหนด",
      value: stats?.overdue || 0,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="overflow-hidden shadow hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${stat.bgColor} rounded-full flex items-center justify-center`}>
                  <stat.icon className="text-white text-sm" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                  <dd className={`text-2xl font-bold ${stat.color}`}>{stat.value}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
