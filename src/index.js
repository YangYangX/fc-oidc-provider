import React, { createContext } from "react";
import { WebStorageStateStore, UserManager, User } from "oidc-client";

let userManager = null;

const defaultOidcConfiguration = {
    authority: "https://sso.chinambse.com/realms/FC-Applications",
    client_id: "",
    redirect_uri: `${window.location.origin}/fcid-callback`,
    response_type: "code",
    scope: "openid profile email",
    post_logout_redirect_uri: `${window.location.origin}`,
    automaticSilentRenew: true,
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    revokeAccessTokenOnSignout: true,
    monitorSession: true,
    checkSessionInterval: 2000,
};

const FcAuthContext = createContext({});
FcAuthContext.displayName = "FcAuthContext";

const FcAuthProvider = function ({ config, signOutCallback, children }) {
    return (
        <FcAuthContext.Provider value={{ config, signOutCallback }}>
            {children}
        </FcAuthContext.Provider>
    );
};

const useFcAuth = function () {
    const context = React.useContext(FcAuthContext);

    if (!context) {
        console.warn(
            "calling useFcAuth() in a child of a <FcAuthProvider> component."
        );
    }

    const oidcConfiguration = {
        ...defaultOidcConfiguration,
        authority: context?.config?.authority
            ? context?.config?.authority
            : "https://sso.chinambse.com/realms/FC-Applications",
        client_id: context?.config?.client_id,
        redirect_uri: context?.config?.redirect_uri
            ? context?.config?.redirect_uri
            : `${window.location.origin}/fcid-callback`,
    };

    if (userManager === null) {
        userManager = new UserManager(oidcConfiguration);

        userManager.events.addAccessTokenExpiring(function () {
            console.log("token expiring...");
        });

        userManager.events.addUserLoaded(function (user) {
            console.log("user loaded...");
        });

        userManager.events.addUserUnloaded(function (user) {
            context.signOutCallback();
        });

        userManager.events.addUserSignedIn(function () {
            console.log("user signedIn...");
        });

        userManager.events.addUserSignedOut(function () {
            userManager.signoutRedirect().then(() => {});
        });

        userManager.events.addUserSessionChanged(function () {
            console.log("user session changed ...");
        });
    }

    //Log.logger = console;
    const isAuthenticated = function () {
        const oidcStorage = localStorage.getItem(
            `oidc.user:${oidcConfiguration.authority}:${oidcConfiguration.client_id}`
        );

        if (!oidcStorage) {
            return false;
        }

        const user = User.fromStorageString(oidcStorage);
        return user !== null && !user.expired;
    };

    const getUser = function () {
        const oidcStorage = localStorage.getItem(
            `oidc.user:${oidcConfiguration.authority}:${oidcConfiguration.client_id}`
        );

        if (!oidcStorage) {
            return null;
        }

        return User.fromStorageString(oidcStorage);
    };

    const getAccessToken = function () {
        const oidcStorage = localStorage.getItem(
            `oidc.user:${oidcConfiguration.authority}:${oidcConfiguration.client_id}`
        );

        if (!oidcStorage) {
            return null;
        }

        return User.fromStorageString(oidcStorage).access_token;
    };

    return {
        fcAuthUserManager: userManager,
        signIn: function () {
            return userManager.signinRedirect();
        },
        signInCallback: function () {
            return userManager
                .signinRedirectCallback()
                .then((user) =>
                    user !== null || user !== undefined
                        ? Promise.resolve(user)
                        : Promise.reject({
                              message:
                                  "Failed to load user info from signin callback",
                          })
                )
                .catch(() => {});
        },
        signOut: function () {
            return userManager.signoutRedirect().then(() => {});
        },
        isAuthenticated,
        getUser,
        getAccessToken,
    };
};

export { useFcAuth, FcAuthProvider };
