import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { parseIncomingWSMessage } from "../../../../shared/protocol/ws";
import { getWSInstance } from "../lib/wsInstance";

export default function useWsToastError() {
  const { t } = useTranslation();

  useEffect(() => {
    let ws: WebSocket;

    try {
      ws = getWSInstance();
    } catch {
      return;
    }

    ws.onmessage = async (event: MessageEvent) => {
      const parsed = await parseIncomingWSMessage(event.data);

      if (parsed.type === "general.error") {
        const errorMsg =
          parsed.data.error || t("Errors.UnknownErrorFromServer");
        toast.error(errorMsg);
      }
    };
  }, [t]);
}
