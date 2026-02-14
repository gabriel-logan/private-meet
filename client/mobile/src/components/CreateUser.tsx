import { useState } from "react";
import { useTranslation } from "react-i18next";

import handleCreateUser from "../actions/handleCreateUser";
import { useAuthStore } from "../stores/authStore";

export default function CreateUser() {
  const { t } = useTranslation();

  const setAccessToken = useAuthStore(s => s.setAccessToken);

  const [username, setUsername] = useState("");

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    handleCreateUser({
      username,
      setUsername,
      setAccessToken,
    });
  }

  return null;
}
