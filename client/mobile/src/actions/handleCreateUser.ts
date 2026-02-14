import { t } from "i18next";

import apiInstance from "../lib/apiInstance";
import getAxiosErrorMessage from "../utils/general";

interface HandleCreateUserParams {
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  setAccessToken: (token: string) => void;
}

export default async function handleCreateUser({
  username,
  setUsername,
  setAccessToken,
}: HandleCreateUserParams) {
  try {
    const response = await apiInstance.post("/auth/sign-in", {
      username: username.trim(),
    });

    const accessToken = response.data.accessToken;

    setAccessToken(accessToken);

    setUsername("");
  } catch (error) {
    const errorMessage = getAxiosErrorMessage(
      error,
      t("Errors.FailedToCreateUser"),
    );

    console.error("Error creating user:", errorMessage);
  }
}
