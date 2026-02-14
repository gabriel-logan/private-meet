interface HandleDeleteUserParams {
  revokeAccessToken: () => void;
}

export default function handleDeleteUser({
  revokeAccessToken,
}: HandleDeleteUserParams) {
  revokeAccessToken();
}
