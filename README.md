# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. (Optional) Run the in-memory dummy auth API for OTP / login testing:

   ```bash
   npm run api:dummy
   ```

   OTP codes are printed in that terminal. For Android emulator, set `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:4000/api` in a `.env` file (see `src/config/api.config.ts`).

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

## Physical phone + dummy API (same WiFi)

1. On your PC, find your **LAN IPv4** (same WiFi as the phone). Example on Windows:

   ```bash
   ipconfig
   ```

   Use the address that looks like `192.168.x.x` (often “Wireless LAN adapter Wi‑Fi” → IPv4 Address).

2. In the project root, create **`.env`** (same folder as `package.json`):

   ```env
   EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:4000/api
   ```

   Replace `192.168.x.x` with your PC’s IP. **Restart Expo** after changing `.env`.

3. **Windows:** allow Node through the firewall for **private networks**, or allow inbound **TCP 4000** when prompted.

4. Open **two terminals** in the project folder:

   **Terminal A — API**

   ```bash
   npm run api:dummy
   ```

   **Terminal B — Expo**

   ```bash
   npx expo start
   ```

   Scan the QR code with **Expo Go** (or use a dev build). The app will call `http://YOUR_PC_IP:4000/api`; OTP lines appear in Terminal A.

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
