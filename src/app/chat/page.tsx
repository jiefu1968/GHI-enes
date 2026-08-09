import { readSession } from "@/lib/auth";
import ChatApp from "@/components/ChatApp";

export default async function ChatPage() {
  const session = await readSession();

  return (
    <ChatApp
      missionaryName={session?.missionaryName ?? null}
      missionaryId={session?.missionaryId ?? null}
    />
  );
}
