import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle, XCircle, Clock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MaintenanceRecord } from "@shared/schema";

interface StatusActionsProps {
  record: MaintenanceRecord;
  onStatusChange?: (newStatus: string) => void;
}

export function StatusActions({ record, onStatusChange }: StatusActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startWorkMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/records/${record.id}/start`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      toast({
        title: "เริ่มงานแล้ว",
        description: `เริ่มต้นการทำงานบำรุงรักษาแล้ว - ${data.message}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/records"] });
      onStatusChange?.("in_progress");
      console.log("Work started:", {
        action: data.action,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt,
        workflowStep: data.workflowStep
      });
    },
    onError: (error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเริ่มงานได้",
        variant: "destructive",
      });
    },
  });

  const completeWorkMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/records/${record.id}/complete`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      toast({
        title: "เสร็จสิ้น",
        description: `งานบำรุงรักษาเสร็จสิ้นแล้ว - ${data.message}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/records"] });
      onStatusChange?.("completed");
      console.log("Work completed:", {
        action: data.action,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt,
        completedAt: data.completedAt,
        workflowStep: data.workflowStep
      });
    },
    onError: (error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถจบงานได้",
        variant: "destructive",
      });
    },
  });

  const cancelWorkMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/records/${record.id}/cancel`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      toast({
        title: "ยกเลิกแล้ว",
        description: `ยกเลิกงานบำรุงรักษาแล้ว - ${data.message}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/records"] });
      onStatusChange?.("cancelled");
      console.log("Work cancelled:", {
        action: data.action,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt,
        previousStatus: data.previousStatus,
        workflowStep: data.workflowStep
      });
    },
    onError: (error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถยกเลิกงานได้",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            รอดำเนินการ
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Play className="w-3 h-3 mr-1" />
            กำลังดำเนินการ
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            เสร็จสิ้น
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            ยกเลิก
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  const getAvailableActions = () => {
    const actions = [];

    switch (record.status) {
      case "pending":
        actions.push(
          <Button
            key="start"
            size="sm"
            onClick={() => startWorkMutation.mutate()}
            disabled={startWorkMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Play className="w-4 h-4 mr-1" />
            เริ่มงาน
          </Button>
        );
        actions.push(
          <Button
            key="cancel"
            size="sm"
            variant="outline"
            onClick={() => cancelWorkMutation.mutate()}
            disabled={cancelWorkMutation.isPending}
            className="border-red-500 text-red-500 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-1" />
            ยกเลิก
          </Button>
        );
        break;

      case "in_progress":
        actions.push(
          <Button
            key="complete"
            size="sm"
            onClick={() => completeWorkMutation.mutate()}
            disabled={completeWorkMutation.isPending}
            className="bg-green-500 hover:bg-green-600"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            เสร็จสิ้น
          </Button>
        );
        actions.push(
          <Button
            key="cancel"
            size="sm"
            variant="outline"
            onClick={() => cancelWorkMutation.mutate()}
            disabled={cancelWorkMutation.isPending}
            className="border-red-500 text-red-500 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-1" />
            ยกเลิก
          </Button>
        );
        break;

      case "completed":
      case "cancelled":
        // No actions available for completed or cancelled records
        break;
    }

    return actions;
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">สถานะ:</span>
        {getStatusBadge(record.status)}
      </div>
      
      {getAvailableActions().length > 0 && (
        <div className="flex space-x-2">
          {getAvailableActions()}
        </div>
      )}
    </div>
  );
}