import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export default function useTypingUsers() {
  const { t } = useTranslation();

  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<number | null>(null);
  const typingSentRef = useRef(false);

  const typingLabel = (() => {
    const names = Object.values(typingUsers);

    if (names.length === 0) {
      return "";
    }

    if (names.length === 1) {
      return t("Infos.UserIsTypingDotDotDot", { username: names[0] });
    }

    if (names.length === 2) {
      return t("Infos.TwoUsersAreTypingDotDotDot", {
        username1: names[0],
        username2: names[1],
      });
    }

    return t("Infos.MultipleUsersAreTypingDotDotDot", {
      username1: names[0],
      username2: names[1],
      count: names.length - 2,
    });
  })();

  return {
    setTypingUsers,
    typingTimeoutRef,
    typingSentRef,
    typingLabel,
  };
}
