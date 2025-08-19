import { SignupForm } from "@/components/signup-form";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <SignupForm className="w-full max-w-md" />
    </div>
  );
}