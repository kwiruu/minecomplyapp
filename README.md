# MineComply Mobile App

This Expo application talks to the NestJS API (`minecomplyapi`) and the shared Supabase project.

## 🚀 Quick start

```cmd
cd minecomplyapp
npm install
npx expo start
```

Log in with a Supabase account that has access to the MineComply backend. The app automatically refreshes Supabase sessions and attaches the access token to every API request.

## � Sample storage upload

- Visit the Profile tab and tap **Upload Sample File** to generate a temporary text file and push it to the Supabase storage bucket.
- The app confirms the stored object path so you can verify it from the dashboard or Supabase Studio.

## �🔗 API base URL detection

You no longer need to hardcode `API_BASE_URL` during local development. The client walks through the following resolution order the moment it boots:

1. `EXPO_PUBLIC_API_BASE_URL`
2. `API_BASE_URL`
3. Host/IP of the current Expo dev server (the same address shown in the Metro terminal)
4. Fallback to `http://localhost:3000`

That means when you run the Expo app on the same network as your Nest API, the client automatically assumes the API is on port `3000` of the Metro host. Override the env variables only when:

- The backend runs on a different port or host than the bundler
- You expose the API through ngrok, tunneling, or a deployed URL
- You ship a production build and want to point at a staging/production environment

## 🔐 Environment variables

- Copy `.env` ➜ `.env.local` to customize settings per developer
- Keep `SUPABASE_URL` and `SUPABASE_ANON_KEY` in sync with the backend project
- Set `EXPO_PUBLIC_API_BASE_URL` when bundler autodetection is not applicable

## 🧪 Linting & typechecking

```cmd
npm run lint
npm run typecheck
```

## 🤝 Collaboration tips

- When sharing the project, deliver `.env` files securely (never commit them)
- Rotate Supabase keys or PII credentials when teammates roll off the project
- Coordinate backend schema changes via Prisma migrations and keep everyone in sync
