import { useCallback, useEffect, useMemo, useRef } from "react";
import { UseBindbeeMagicLinkProps, UseBindbeeMagicLinkResponse } from "./types";

const BINDBEE_LINK_URL = "https://link.bindbee.dev";

// Only https is accepted, except plain http on localhost for local development.
const parseLinkUrl = (linkUrl: string) => {
  try {
    const url = new URL(linkUrl);
    const isLocalhost =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalhost)) {
      return null;
    }

    return {
      origin: url.origin,
      // Keep any sub-path so the link app can be hosted under e.g. /bindbee-link
      embedUrl: `${url.origin}${url.pathname.replace(/\/+$/, "")}/embed`,
    };
  } catch (e) {
    return null;
  }
};

let isInitialized = false;

export const useBindbeeMagiclink = ({
  linkToken,
  linkUrl = BINDBEE_LINK_URL,
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

  const link = useMemo(() => parseLinkUrl(linkUrl), [linkUrl]);

  const open = useCallback(() => {
    if (!link) {
      console.error(
        `Invalid linkUrl "${linkUrl}". It must be an absolute https URL (http is only allowed for localhost).`
      );
      return;
    }

    if (!document.getElementById("magic-link-flow")) {
      const iframe = document.createElement("iframe");
      // The flow is cross-origin to the host app, so its copy buttons can only
      // use the Clipboard API if we delegate the permission. It is fixed at
      // navigation time, so it must be set before the iframe is inserted.
      iframe.allow = "clipboard-write";
      const params = new URLSearchParams({ link_token: linkToken });
      if (serverUrl) params.set("server_url", serverUrl);
      if (instanceId) params.set("instanceId", instanceId);
      iframe.src = `${link.embedUrl}?${params.toString()}`;
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
  }, [link, linkUrl, linkToken, serverUrl, instanceId]);

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
      // Only trust messages from the origin we loaded the iframe from.
      if (!link || event.origin !== link.origin) return;

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
  }, [link, onSuccess, closeIframe, instanceId]);

  return { open };
};
