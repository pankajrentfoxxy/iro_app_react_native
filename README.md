# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Run **iro-server** (the real API) — from the **`iro/server`** workspace in separate terminal:

   ```bash
   cd path/to/iro/server
   npm install
   cp .env.example .env    # Postgres + Redis credentials; OTP is logged when NODE_ENV is development or SMS worker consumes queue
   npm run db:generate && npm run dev
   ```

   Listen on **`http://YOUR_PC_IP:4000`**; routes are under **`/api`** (same as Expo `API_BASE_URL`).

   In development, OTP is written to **iro-server logs** (`authService`). Run **BullMQ workers** if you enqueue SMS (`npm run worker` in `iro/server`).
3. Start the app

   ```bash
   npx expo start
   ```

### Open on your phone with Expo Go (scan QR)

1. Install **[Expo Go](https://expo.dev/go)** on your phone (Play Store / App Store).
2. Put the **phone and PC on the same Wi‑Fi** (best for the default “LAN” URL in the QR code).
3. In the terminal where Metro is running you should see a **QR code**.
   - **Android:** open **Expo Go** → **Scan QR code**, and scan the terminal QR (or use the OS camera if it offers to open in Expo Go).
   - **iOS:** open the **Camera** app, point at the QR, tap the banner to open in **Expo Go**.
4. If it won’t connect (strict Wi‑Fi / VPN / firewall), stop Expo and start with a tunnel:

   ```bash
   npx expo start --tunnel
   ```

   Scan again; tunnel is slower but works without same-LAN reachability.

**Other ways to run** (from the same Metro terminal):

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction/). For a map of `app/` vs `src/`, URLs, and navigation flow, see **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**.

## Same Wi‑Fi + real API (**iro-server**, port **4000**)

`src/config/api.config.ts` derives the REST host from **`Constants.expoConfig.hostUri`** when you use **Expo Go / dev LAN**, so phones on your Wi‑Fi often **auto-use your PC’s IP** for `http://<host>:4000/api`. If that fails (multiple NICs, VPN, etc.), set **`EXPO_PUBLIC_API_BASE_URL`** in `.env` (see **`.env.example`**). Restart Expo after editing env.

1. **Windows firewall:** allow inbound **TCP 4000** (or allow **Node** on private networks).
2. **iro-server:** must listen on **0.0.0.0** (default for `server.listen(PORT)` on Node so LAN works).
3. **Physical device + tunnel:** `npx expo start --tunnel` does **not** route phone traffic to your LAN API; use **LAN** mode with same Wi‑Fi or set a **publicly reachable** API URL in `.env`.
## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
