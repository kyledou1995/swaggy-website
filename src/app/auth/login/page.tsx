import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <span className="text-3xl font-bold text-gray-900 tracking-tight">
              swaggy<span className="text-emerald-500">.</span>
            </span>
          </a>
          <p className="mt-2 text-gray-500">Welcome back</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
