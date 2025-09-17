import type { GetUserDto } from "src/chat/dto/get-user.dto";

interface RenderParticipantsParams {
  onlineUsers: GetUserDto[];
  participantsList: HTMLUListElement;
  countSpan: HTMLSpanElement;
  getUser: () => Partial<GetUserDto>;
}

export default function renderParticipants({
  onlineUsers,
  participantsList,
  countSpan,
  getUser,
}: RenderParticipantsParams): void {
  const { userId, username } = getUser();

  if (!userId) {
    return;
  }

  const quantity = onlineUsers.length - 1;
  countSpan.textContent = `(${quantity})`;

  // Clear the current list
  participantsList.innerHTML = "";

  // Add "You" (the current user) to the list
  const li = document.createElement("li");
  li.textContent = `You (${username})`;
  li.classList.add(
    "font-medium",
    "text-indigo-400",
    "mb-2",
    "border-b",
    "border-gray-600",
    "pb-2",
  );
  participantsList.appendChild(li);

  // Add h3 "Others"
  const h3 = document.createElement("h3");
  h3.textContent = "Others";
  h3.classList.add("font-semibold", "text-gray-300", "mt-4", "mb-2");
  participantsList.appendChild(h3);

  // Filter out the current user from the online users list
  const otherUsers = onlineUsers.filter((user) => user.userId !== userId);

  // Add the other online users to the list
  otherUsers.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user.username;
    li.classList.add("font-semibold", "text-green-400");
    participantsList.appendChild(li);
  });
}
