export type ClientPortalAuthTab = "login" | "register";

export type UseClientPortalAuthOptions = {
  authRailMode: boolean;
  authTab?: ClientPortalAuthTab;
};
