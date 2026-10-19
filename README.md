# react-link

[![NPM](https://img.shields.io/npm/v/@bindbee/react-link)](https://www.npmjs.com/package/@bindbee/react-link)

The React SDK for embedding Bindbee's Connector Link Flow

See the detailed documentation on [Bindbee SDK Documentation](https://docs.bindbee.dev/sdk/bindbee-embed)

## Install

```bash
npm install --save @bindbee/react-link
```

or

```bash
yarn add @bindbee/react-link
```

## Usage

```jsx
import React from "react";
// Run this in your React project:
// npm install --save @bindbee/react-link
import { useBindbeeMagiclink } from "@bindbee/react-link";

const App = () => {
  const handleOnSuccess = (temporary_token) => {
    // Use this token to get the connector_token
    console.log("Temporary Token:", temporary_token);
  };

  const handleOnClose = () => {
    // Optional: Perform any action when the user closes the linking flow
    console.log("Linking flow closed");
  };

  const { open } = useBindbeeMagiclink({
    linkToken: "LINK_TOKEN", // Replace LINK_TOKEN with the token retrieved from previous step,
    serverUrl: "https://api.bindbee.dev", // (OPTIONAL): use 'https://api-eu.bindbee.dev' for EU Region
    onSuccess: handleOnSuccess,
    onClose: handleOnClose,
  });

  return <button onClick={open}>Open Linking Flow</button>;
};

export default App;
```

## Self-hosted deployments

If you run the Bindbee link app and API on your own infrastructure, point the hook at them with `linkUrl` and `serverUrl`:

```jsx
const { open } = useBindbeeMagiclink({
  linkToken: "LINK_TOKEN",
  linkUrl: "https://link.your-domain.com", // Base URL of your self-hosted link app (defaults to https://link.bindbee.dev)
  serverUrl: "https://api.your-domain.com", // Base URL of your self-hosted API
  onSuccess: handleOnSuccess,
  onClose: handleOnClose,
});
```

- `linkUrl` must be an absolute `https` URL. Plain `http` is accepted only for `localhost`, for local development.
- The link app may live under a sub-path (e.g. `https://your-domain.com/bindbee-link`); the hook loads `<linkUrl>/embed`.
- Events from the flow are only accepted from the origin of `linkUrl`.
- The link app must be embeddable by your application: make sure no `X-Frame-Options` or `Content-Security-Policy: frame-ancestors` header in front of it (e.g. at your reverse proxy) blocks your app's origin.
- Your API must allow CORS requests from the link app's origin.
