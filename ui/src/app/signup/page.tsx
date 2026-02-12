import SignUp from "@/components/auth/sign-up";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-xl font-semibold tracking-tight">
        Multi AI
      </h1>
      <SignUp />
    </div>
  );
}