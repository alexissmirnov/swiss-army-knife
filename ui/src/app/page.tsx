import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/header";
import LetterGlitch from "@/components/animations/letter-glitch";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import Footer from "@/components/layout/footer";
import { authClient } from "@/lib/auth-client";
import { Separator } from "@/components/ui/separator";

export default async function Home() {
  const session = await authClient.getSession();
  const isLoggedIn = !!session;

  return (
    <div>
      <h1>Hello World</h1>
    </div>
  )

}
