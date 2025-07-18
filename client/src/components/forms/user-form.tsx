import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { createUserSchema, type CreateUser } from '@shared/schema';

interface UserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function UserForm({ onSuccess, onCancel }: UserFormProps) {
  const { toast } = useToast();

  const form = useForm<CreateUser>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      password: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'technician',
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUser) => {
      return apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "สร้างผู้ใช้สำเร็จ",
        description: "ผู้ใช้ใหม่ได้ถูกเพิ่มเข้าสู่ระบบแล้ว",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถสร้างผู้ใช้ได้",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CreateUser) => {
    await createUserMutation.mutateAsync(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ชื่อผู้ใช้ *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="กรุณาใส่ชื่อผู้ใช้" 
                    {...field}
                    disabled={createUserMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>รหัสผ่าน *</FormLabel>
                <FormControl>
                  <Input 
                    type="password"
                    placeholder="กรุณาใส่รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)" 
                    {...field}
                    disabled={createUserMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ชื่อ *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="กรุณาใส่ชื่อ" 
                    {...field}
                    disabled={createUserMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>นามสกุล *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="กรุณาใส่นามสกุล" 
                    {...field}
                    disabled={createUserMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>อีเมล</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="กรุณาใส่อีเมล (ไม่จำเป็น)" 
                    {...field}
                    disabled={createUserMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>บทบาท *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={createUserMutation.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกบทบาท" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="technician">ช่างเทคนิค</SelectItem>
                    <SelectItem value="manager">ผู้จัดการ</SelectItem>
                    <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={createUserMutation.isPending}
            >
              ยกเลิก
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending ? 'กำลังสร้าง...' : 'สร้างผู้ใช้'}
          </Button>
        </div>
      </form>
    </Form>
  );
}