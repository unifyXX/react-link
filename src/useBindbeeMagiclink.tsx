import { useCallback, useEffect } from "react";
import { UseBindbeeMagicLinkProps, UseBindbeeMagicLinkResponse } from "./types";

const BINDBEE_BASE_URL = "https://magic-link.bindbee.dev";

export const useBindbeeMagiclink = ({
  linkToken,
  onSuccess = () => {},
  onClose = () => {},
}: UseBindbeeMagicLinkProps): UseBindbeeMagicLinkResponse => {
  const open = useCallback(() => {
    if (!document.getElementById("magic-link-flow")) {
      const iframe = document.createElement("iframe");
      iframe.src = `${BINDBEE_BASE_URL}/embed?link_token=${linkToken}`;
      iframe.id = "magic-link-flow";
      iframe.style.top = "0";
      iframe.style.position = "fixed";
      iframe.style.zIndex = "8460";
      iframe.style.height = "100%";
      iframe.style.width = "100%";
      iframe.style.backgroundColor = "transparent";
      iframe.style.border = "none";

      document.body.prepend(iframe);
      document.body.style.overflow = "hidden";
    }
  }, [linkToken]);

  const closeIframe = () => {
    const currentIframe = document.getElementById("magic-link-flow");
    if (currentIframe) {
      currentIframe.parentNode?.removeChild(currentIframe);
      document.body.style.overflow = "inherit";
      onClose();
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== BINDBEE_BASE_URL) return;

      try {
        const eventData = JSON.parse(event.data);

        switch (eventData.type) {
          case "CLOSE":
            closeIframe();
            break;
          case "SUCCESS":
            onSuccess(eventData?.temporary_token);
            break;
          default:
            console.log("Received unknown event from the iframe", eventData);
        }
      } catch (e) {
        console.error("error converting the event data", e);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return { open };
};
