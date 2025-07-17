import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cog, Calendar, ClipboardCheck, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Cog className="h-16 w-16 text-primary mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">
              ระบบบำรุงรักษาเครื่องจักรประจำปี 2025
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            แผนการบำรุงรักษาเครื่องจักรโรงแรม รีเจ้นท์ ชะอำ บีซ รีสอร์ท 
            ฐานข้อมูลประวัติการบำรุงรักษา และเพิ่มประสิทธิภาพการทำงานของทีมบำรุงรักษา
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-3"
            onClick={() => window.location.href = "/api/login"}
          >
            เข้าสู่ระบบ
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Cog className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-lg">จัดการเครื่องจักร</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                บันทึกข้อมูลเครื่องจักร ติดตามสถานะและประวัติการใช้งาน
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 text-secondary mx-auto mb-4" />
              <CardTitle className="text-lg">วางแผนการบำรุงรักษา</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                สร้างตารางการบำรุงรักษาอัตโนมัติ แจ้งเตือนล่วงหน้า
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <ClipboardCheck className="h-12 w-12 text-success mx-auto mb-4" />
              <CardTitle className="text-lg">บันทึกการทำงาน</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                บันทึกผลการบำรุงรักษา ติดตามค่าใช้จ่ายและเวลาที่ใช้
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-lg">รายงานและวิเคราะห์</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                สร้างรายงานสรุปผล วิเคราะห์ต้นทุนและประสิทธิภาพ
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8">คุณสมบัติเด่น</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">สำหรับผู้จัดการฝ่ายบำรุงรักษา</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• ภาพรวมสถานะเครื่องจักรทั้งหมด</li>
                <li>• จัดสรรทีมงานและกำหนดตารางเวลา</li>
                <li>• ติดตามงบประมาณและค่าใช้จ่าย</li>
                <li>• รายงานประสิทธิภาพและการวิเคราะห์</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">สำหรับช่างบำรุงรักษา</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• รายการงานที่ได้รับมอบหมาย</li>
                <li>• คู่มือและขั้นตอนการบำรุงรักษา</li>
                <li>• บันทึกผลการทำงาน PM</li>
                <li>• ติดตามประวัติการบำรุงรักษา</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
