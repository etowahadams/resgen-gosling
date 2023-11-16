// src/react-auth0-spa.js
import React, { useState, useEffect, useContext } from 'react';
import createAuth0Client, {
  Auth0Client,
  IdToken,
  PopupLoginOptions,
  User,
} from '@auth0/auth0-spa-js';

import SOURCE_SERVER from './utils/source-server';

const DEFAULT_REDIRECT_CALLBACK = () =>
  window.history.replaceState({}, document.title, window.location.pathname);

interface IAuth0Context {
  isAuthenticated: boolean;
  user: User | undefined;
  loading: boolean;
  popupOpen: boolean;
  loginWithPopup: (params: PopupLoginOptions) => void;
  handleRedirectCallback: () => Promise<void>;
  authFetch: (url: string, params?: any) => Promise<Response>;
  getIdTokenClaims: (...p: any) => Promise<IdToken | undefined>;
  loginWithRedirect: (...p: any) => Promise<void>;
  getTokenSilently: (...p: any) => Promise<string>;
  getTokenWithPopup: (...p: any) => Promise<string>;
  logout: (...p: any) => void | Promise<void>;
}
export const Auth0Context = React.createContext<IAuth0Context>(
  {} as IAuth0Context,
);
export const useAuth0 = () => useContext(Auth0Context);

interface Auth0ProviderProps {
  onRedirectCallback: (appState?: any) => void;
}

export const Auth0Provider: React.FC<Auth0ProviderProps> = ({
  children,
  onRedirectCallback = DEFAULT_REDIRECT_CALLBACK,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User>();
  const [auth0Client, setAuth0] = useState<Auth0Client>();
  const [loading, setLoading] = useState(true);
  const [popupOpen, setPopupOpen] = useState<boolean>(false);

  useEffect(() => {
    const initAuth0 = async () => {
      const ret = await fetch(`${SOURCE_SERVER}/auth-config/`);
      const serverInitOptions = await ret.json();

      serverInitOptions.redirect_uri = `${window.location.origin}/home`;

      const auth0FromHook = await createAuth0Client(serverInitOptions);
      setAuth0(auth0FromHook);

      if (
        window.location.search.includes('code=') &&
        window.location.search.includes('state=')
      ) {
        const { appState } = await auth0FromHook.handleRedirectCallback();
        onRedirectCallback(appState);
      }

      const _isAuthenticated = await auth0FromHook.isAuthenticated();

      setIsAuthenticated(_isAuthenticated);

      if (_isAuthenticated) {
        const _user = await auth0FromHook.getUser();
        setUser(_user);
      }

      setLoading(false);
    };
    initAuth0();
    // eslint-disable-next-line
  }, []);

  const authFetch = async (url: string, params?: any): Promise<Response> => {
    const newParams = {
      ...params,
    };

    let authHeader = null;
    const rgToken = localStorage.getItem('rgToken');

    if (isAuthenticated || rgToken) {
      const token = rgToken || (await auth0Client!.getTokenSilently());

      authHeader = `Bearer ${token}`;

      newParams.headers = (params && params.headers) || {};
      newParams.headers = Object.assign(newParams.headers, {
        Authorization: authHeader,
      });
    }

    return fetch(url, newParams);
  };

  const loginWithPopup = async (params: PopupLoginOptions = {}) => {
    setPopupOpen(true);
    try {
      await auth0Client!.loginWithPopup(params);
    } catch (error) {
      console.error(error);
    } finally {
      setPopupOpen(false);
    }
    const _user = await auth0Client!.getUser();
    setUser(_user);
    setIsAuthenticated(true);
  };

  const handleRedirectCallback = async () => {
    setLoading(true);
    await auth0Client!.handleRedirectCallback();
    const _user = await auth0Client!.getUser();
    setLoading(false);
    setIsAuthenticated(true);
    setUser(_user);
  };
  return (
    <Auth0Context.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        popupOpen,
        loginWithPopup,
        handleRedirectCallback,
        authFetch,
        getIdTokenClaims: (...p: any) => auth0Client!.getIdTokenClaims(...p),
        loginWithRedirect: (...p: any) => auth0Client!.loginWithRedirect(...p),
        getTokenSilently: (...p: any) => auth0Client!.getTokenSilently(...p),
        getTokenWithPopup: (...p: any) => auth0Client!.getTokenWithPopup(...p),
        logout: (...p: any) => auth0Client!.logout(...p),
      }}
    >
      {children}
    </Auth0Context.Provider>
  );
};
