import { redirect } from "next/navigation";
import { Chat } from "@/components/chat";
import { getServerSession } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/signin");
  }

  return <Chat />;
}
