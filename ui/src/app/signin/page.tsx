import SignIn from "@/components/auth/sign-in";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-xl font-semibold tracking-tight">
        Multi AI
      </h1>
      <SignIn />
    </div>
  );
}
