import { auth } from "@/auth";
import { redirect } from "next/navigation";
import HomeClient from "@/components/HomeClient";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  return <HomeClient user={session.user} />;
}
