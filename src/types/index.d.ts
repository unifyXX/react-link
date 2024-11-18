export type UseBindbeeMagicLinkResponse = {
  open: () => void;
};

export type UseBindbeeMagicLinkProps = {
  linkToken: string;
  serverUrl?: string;
  onSuccess?: (temporary_token: string) => void;
  onClose?: () => void;
};
