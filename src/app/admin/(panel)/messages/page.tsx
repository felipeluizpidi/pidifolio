import { readMessages } from "@/lib/messages";
import { MessagesInbox } from "@/components/admin/MessagesInbox";

export default async function MessagesPage() {
  return <MessagesInbox messages={await readMessages()} />;
}
