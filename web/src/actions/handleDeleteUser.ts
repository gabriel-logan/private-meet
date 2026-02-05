import { toast } from "react-toastify";
import { t } from "i18next";

interface HandleDeleteUserParams {
  revokeAccessToken: () => void;
}

export default function handleDeleteUser({
  revokeAccessToken,
}: HandleDeleteUserParams) {
  revokeAccessToken();

  toast.info(t("Infos.UserDeletedSuccessfully"));
}
