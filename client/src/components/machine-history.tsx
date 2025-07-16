import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, User, FileText } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { th } from "date-fns/locale";

interface MachineHistoryProps {
  machineId: number;
}

export default function MachineHistory({ machineId }: MachineHistoryProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: [`/api/machines/${machineId}/history`],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ประวัติการเปลี่ยนแปลง
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">กำลังโหลด...</div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ประวัติการเปลี่ยนแปลง
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">ไม่มีประวัติการเปลี่ยนแปลง</div>
        </CardContent>
      </Card>
    );
  }

  const getChangeTypeBadge = (changeType: string) => {
    const badgeMap = {
      created: { label: "สร้างใหม่", variant: "default" as const },
      updated: { label: "อัปเดต", variant: "secondary" as const },
      location_changed: { label: "เปลี่ยนตำแหน่ง", variant: "outline" as const },
      status_changed: { label: "เปลี่ยนสถานะ", variant: "destructive" as const },
    };
    
    const badge = badgeMap[changeType as keyof typeof badgeMap] || { 
      label: changeType, 
      variant: "secondary" as const 
    };
    
    return (
      <Badge variant={badge.variant}>
        {badge.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          ประวัติการเปลี่ยนแปลง
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item: any) => (
            <div
              key={item.id}
              className="border-l-2 border-blue-200 pl-4 pb-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getChangeTypeBadge(item.changeType)}
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {formatDistanceToNow(new Date(item.createdAt), { 
                    addSuffix: true, 
                    locale: th 
                  })}
                </div>
              </div>
              
              <div className="text-sm text-gray-700 mb-2">
                {item.changeDescription}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <User className="h-3 w-3" />
                {item.changedByUser.firstName || item.changedByUser.email}
                <span>•</span>
                {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: th })}
              </div>
              
              {item.oldValues && Object.keys(item.oldValues).length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  <div className="font-medium text-gray-700 mb-1">รายละเอียดการเปลี่ยนแปลง:</div>
                  {Object.entries(item.oldValues).map(([field, change]: [string, any]) => (
                    <div key={field} className="text-gray-600">
                      <span className="font-medium">{field}:</span> {change.old} → {change.new}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}