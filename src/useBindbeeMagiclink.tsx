import { useCallback, useEffect, useMemo, useRef } from "react";
import { UseBindbeeMagicLinkProps, UseBindbeeMagicLinkResponse } from "./types";

const BINDBEE_BASE_URL = "https://link.bindbee.dev";

let isInitialized = false;

export const useBindbeeMagiclink = ({
  linkToken,
  serverUrl = "",
  onSuccess = () => {},
  onClose = () => {},
}: UseBindbeeMagicLinkProps): UseBindbeeMagicLinkResponse => {
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      if (!isInitialized) {
        isInitialized = true;
      } else {
        console.error(
          "One instance of useBindbeeMagiclink hook has already been registered. Please ensure only one instance is called."
        );
      }

      isMounted.current = true;
    }
  }, []);

  const generateUniqueId = useCallback(() => {
    return "xxxx-xxxx-xxxx-xxxx".replace(/[x]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      return r.toString(16);
    });
  }, []);

  const instanceId = useMemo(() => generateUniqueId(), []);

  const open = useCallback(() => {
    if (!document.getElementById("magic-link-flow")) {
      const iframe = document.createElement("iframe");
      iframe.src = `${BINDBEE_BASE_URL}/embed?link_token=${linkToken}${
        !!serverUrl ? `&server_url=${serverUrl}` : ""
      }${!!instanceId ? `&instanceId=${instanceId}` : ""}`;
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
  }, [linkToken, serverUrl, instanceId]);

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

        if (eventData.instanceId !== instanceId) return;

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
      isInitialized = false;
    };
  }, [onSuccess, closeIframe, instanceId]);

  return { open };
};
