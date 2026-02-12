import Image from "next/image";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default async function Home() {
  const session = await authClient.getSession();
  const isLoggedIn = !!session;

  return (
    <div>
      <h1>Hello World</h1>
    </div>
  )

}
