import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cog, Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HeaderNavigation() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const navigation = [
    { name: "แดชบอร์ด", href: "/", current: location === "/" },
    { name: "เครื่องจักร", href: "/machines", current: location === "/machines" },
    { name: "แผนการบำรุงรักษา", href: "/schedules", current: location === "/schedules" },
    { name: "บันทึกการบำรุงรักษา", href: "/records", current: location === "/records" },
    { name: "รายงาน", href: "/reports", current: location === "/reports" },
    ...(user?.role === "admin" || user?.role === "manager" ? [
      { name: "จัดการผู้ใช้", href: "/users", current: location === "/users" }
    ] : []),
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary cursor-pointer" onClick={() => setLocation("/")}>
                <Cog className="inline-block mr-2 h-5 w-5" />
                ระบบบำรุงรักษาเครื่องจักร
              </h1>
            </div>
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setLocation(item.href)}
                  className={`${
                    item.current
                      ? "border-primary text-primary border-b-2"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } border-b-2 px-1 pt-1 pb-2 text-sm font-medium transition-colors`}
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-400 hover:text-gray-500"
              >
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-destructive text-destructive-foreground">
                  0
                </Badge>
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">ID: {user?.id}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="pb-0">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      User ID: {user?.id}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
