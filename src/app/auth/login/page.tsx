import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="mt-2 text-gray-500">Welcome back</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
