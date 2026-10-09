# Daily Snake

Snake with a daily twist: every day there's one new board, and it's the same for everyone. Share your result Wordle-style. There's also an endless Classic mode.

Built with Expo (React Native + TypeScript). It runs on Android, iOS and web. There's no server: the daily board comes from the date, and scores are saved on the device.

## Run it

```bash
npm install
npx expo start          # press w for web, or scan the QR code with Expo Go on your phone
npm test                # game logic tests (node --test)
npm run typecheck
```

## How it's put together

| Path | What |
|---|---|
| `src/game/engine.ts` | Pure game state: movement, turn queue, collisions, food placement |
| `src/game/daily.ts` | Date-seeded wall layout and day numbering |
| `src/game/rng.ts` | Seeded PRNG (mulberry32), so every device gets the same board |
| `src/game/share.ts` | Share-card text |
| `src/screens/` | Menu and game screens |
| `src/hooks/useControls.ts` | Swipe gestures, plus arrow keys/WASD on web |
| `src/storage.ts` | Best scores and daily attempts (AsyncStorage) |
