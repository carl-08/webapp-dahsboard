# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.


## Firebase Authentication setup

The sign-in, account creation, and password-reset screens use Firebase Authentication's email/password REST endpoints. No Firebase Admin credentials or service-account private keys belong in this front-end repository.

1. In Firebase Console, open **Authentication → Sign-in method** and enable **Email/Password**.
2. In **Project settings → General**, register a Web app if you have not already, then copy its Web API key.
3. Copy `.env.example` to `.env.local` and set `VITE_FIREBASE_API_KEY` to that key.
4. Restart the Vite server with `npm run dev`.
5. Add your deployed domain under **Authentication → Settings → Authorized domains** if your Firebase project requires it.

Authentication is separate from event-data access. Event history is still demo data until a real, access-controlled event-sync path is connected. The app uses a tab-scoped session and refreshes expired ID tokens. Configure Firestore/Storage security rules separately before connecting real household event records or snapshots.
