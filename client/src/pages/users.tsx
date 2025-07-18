import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import HeaderNavigation from "@/components/header-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Users, Shield, UserIcon, Crown } from "lucide-react";
import type { User } from "@shared/schema";

export default function UsersPage() {
  const { toast } = useToast();
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

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

    // Check if user has admin privileges
    if (!isLoading && isAuthenticated && currentUser?.role !== "admin" && currentUser?.role !== "manager") {
      toast({
        title: "ไม่มีสิทธิ์เข้าถึง",
        description: "คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการผู้ใช้",
        variant: "destructive",
      });
      return;
    }
  }, [isAuthenticated, isLoading, currentUser, toast]);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return Array.isArray(response) ? response : [];
    },
    retry: false,
    enabled: isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "manager"),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("PUT", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "สำเร็จ",
        description: "เปลี่ยนบทบาทผู้ใช้เรียบร้อยแล้ว",
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
        description: "ไม่สามารถเปลี่ยนบทบาทผู้ใช้ได้",
        variant: "destructive",
      });
    },
  });

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

  if (currentUser?.role !== "admin" && currentUser?.role !== "manager") {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่มีสิทธิ์เข้าถึง
            </h3>
            <p className="text-gray-500">
              คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการผู้ใช้
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-100 text-red-800"><Crown className="w-3 h-3 mr-1" />ผู้ดูแลระบบ</Badge>;
      case "manager":
        return <Badge className="bg-blue-100 text-blue-800"><Shield className="w-3 h-3 mr-1" />ผู้จัดการ</Badge>;
      case "technician":
        return <Badge className="bg-green-100 text-green-800"><UserIcon className="w-3 h-3 mr-1" />ช่างเทคนิค</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    if (userId === currentUser?.id && newRole !== currentUser.role) {
      toast({
        title: "ไม่สามารถเปลี่ยนบทบาทตนเองได้",
        description: "กรุณาให้ผู้ดูแลระบบคนอื่นเปลี่ยนบทบาทให้",
        variant: "destructive",
      });
      return;
    }
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900">
              จัดการผู้ใช้
            </h2>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ค้นหาและกรองผู้ใช้</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ค้นหาชื่อ, อีเมล หรือ User ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={roleFilter === "all" ? "default" : "outline"}
                  onClick={() => setRoleFilter("all")}
                  size="sm"
                >
                  ทั้งหมด
                </Button>
                <Button
                  variant={roleFilter === "admin" ? "default" : "outline"}
                  onClick={() => setRoleFilter("admin")}
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  ผู้ดูแลระบบ
                </Button>
                <Button
                  variant={roleFilter === "manager" ? "default" : "outline"}
                  onClick={() => setRoleFilter("manager")}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  ผู้จัดการ
                </Button>
                <Button
                  variant={roleFilter === "technician" ? "default" : "outline"}
                  onClick={() => setRoleFilter("technician")}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  ช่างเทคนิค
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {usersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Users className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || roleFilter !== "all" ? "ไม่พบผู้ใช้ที่ค้นหา" : "ไม่มีผู้ใช้ในระบบ"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || roleFilter !== "all" 
                ? "ลองเปลี่ยนเงื่อนไขการค้นหาหรือกรอง"
                : "ผู้ใช้จะถูกสร้างอัตโนมัติเมื่อเข้าสู่ระบบครั้งแรก"
              }
            </p>
            {!searchTerm && roleFilter === "all" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                <h4 className="font-semibold text-blue-900 mb-3">วิธีเพิ่มผู้ใช้ใหม่:</h4>
                <div className="text-left text-sm text-blue-800 space-y-2">
                  <p>1. แชร์ลิงก์แอปนี้ให้เพื่อนร่วมงาน</p>
                  <p>2. ให้พวกเขาคลิก "เข้าสู่ระบบด้วย Replit Auth"</p>
                  <p>3. ผู้ใช้ใหม่จะถูกสร้างอัตโนมัติ (บทบาท: technician)</p>
                  <p>4. คุณสามารถเปลี่ยนบทบาทได้ในหน้านี้</p>
                </div>
                <Button 
                  className="mt-4 text-sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    toast({
                      title: "คัดลอกลิงก์แล้ว",
                      description: "นำลิงก์ไปแชร์ให้เพื่อนร่วมงาน",
                    });
                  }}
                >
                  📋 คัดลอกลิงก์แอป
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user: User) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-white">
                        {user.firstName?.charAt(0) || user.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">ID: {user.id}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">อีเมล:</span>
                      <span className="truncate ml-2">{user.email}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-500">บทบาท:</span>
                      <div className="ml-2">
                        {getRoleBadge(user.role || 'technician')}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">เข้าร่วมเมื่อ:</span>
                      <span className="text-xs">{formatDate(user.createdAt)}</span>
                    </div>
                    
                    {currentUser?.role === "admin" && user.id !== currentUser.id && (
                      <div className="pt-3 border-t">
                        <label className="text-sm text-gray-500 block mb-2">เปลี่ยนบทบาท:</label>
                        <Select
                          value={user.role || 'technician'}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technician">ช่างเทคนิค</SelectItem>
                            <SelectItem value="manager">ผู้จัดการ</SelectItem>
                            <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {user.id === currentUser?.id && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-blue-600 font-medium">
                          นี่คือบัญชีของคุณ
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}