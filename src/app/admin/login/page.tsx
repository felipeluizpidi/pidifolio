import { redirect } from "next/navigation";
import { adminConfigProblem, isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="gutter flex min-h-[100svh] flex-col justify-center">
      <p className="t-meta text-ash">FP® — Edit suite</p>
      <h1 className="t-display mt-3 text-[clamp(64px,12vw,180px)] text-red">Admin.</h1>
      <LoginForm disabledReason={adminConfigProblem()} />
    </main>
  );
}
