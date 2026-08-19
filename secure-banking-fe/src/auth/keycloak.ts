import Keycloak from "keycloak-js";

const url = import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8085";
const realm = import.meta.env.VITE_KEYCLOAK_REALM || "banking";
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "banking-frontend";

export const keycloakConfig = { url, realm, clientId };

export const keycloak = new Keycloak({ url, realm, clientId });

let initPromise: Promise<boolean> | null = null;

export function initKeycloak() {
  if (!initPromise) {
    initPromise = keycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    });
  }
  return initPromise;
}

export function loginWithKeycloak() {
  return keycloak.login({ redirectUri: `${window.location.origin}/overview` });
}

export function logoutKeycloak() {
  return keycloak.logout({ redirectUri: `${window.location.origin}/login` });
}
