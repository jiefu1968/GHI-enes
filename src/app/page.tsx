import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await readSession();
  if (session?.role === "mentor") redirect("/mentor");
  if (session) redirect("/chat");
  redirect("/login");
}
