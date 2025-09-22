import type { GetUserDto, RoomsUserMapValue } from "src/chat/dto/get-user.dto";

interface RenderParticipantsParams {
  onlineUsers: RoomsUserMapValue[];
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

  // Clear the current list
  participantsList.innerHTML = "";

  // Create a document fragment to improve performance
  const fragment = document.createDocumentFragment();

  // Add "You" (the current user) to the list
  const liYou = document.createElement("li");
  liYou.textContent = `You (${username})`;
  liYou.classList.add(
    "font-medium",
    "text-indigo-400",
    "mb-2",
    "border-b",
    "border-gray-600",
    "pb-2",
  );
  liYou.setAttribute("data-user", userId);
  fragment.appendChild(liYou);

  // Add h3 "Others"
  const h3 = document.createElement("h3");
  h3.textContent = "Others";
  h3.classList.add("font-semibold", "text-gray-300", "mt-4", "mb-2");
  fragment.appendChild(h3);

  const seen = new Set<string>();

  for (const u of onlineUsers) {
    if (u.userId === userId) {
      continue;
    }

    const key = `${u.userId}|${u.username.toLowerCase()}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    const li = document.createElement("li");
    li.textContent = u.username;
    li.classList.add("font-semibold", "text-green-400", "mb-1");
    li.setAttribute("data-user", u.userId);
    fragment.appendChild(li);
  }

  countSpan.textContent = `(${seen.size})`;

  participantsList.appendChild(fragment);
}
