import "./App.css";
import "higlass/dist/hglib.css";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { useAuth0, Auth0Provider } from "./react-auth0-spa";
import { View } from "./View";

function App1() {
  const navigate = useNavigate();

  const onRedirectCallback = (appState: any & { targetUrl: string }) => {
    navigate(
      appState && appState.targetUrl
        ? appState.targetUrl
        : window.location.pathname
    );
  };
  const { loading } = useAuth0();

  if (loading) {
    return <p>{loading}</p>;
  }

  return (
    <Auth0Provider onRedirectCallback={onRedirectCallback}>
      <View />
    </Auth0Provider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <App1 />
    </BrowserRouter>
  );
}

export default App;
