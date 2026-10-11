# Carom

Carom is a browser paddle duel built on the Simple 2D engine. Move your paddle as it strikes to put spin on the ball, and use two swaying, rotating obstacles to bank shots through the field. Play Solo against an AI or Versus with two people on one keyboard. The first side to reach 11 points with a two-point lead wins.

## Run

```sh
npm ci
npm run dev
```

Open the address Vite prints. For a self-contained static build:

```sh
npm run build
```

Serve the `dist/` directory from any static server. No backend or runtime downloads are needed.

## Controls

| Action | Keys |
| --- | --- |
| Left paddle | W / S |
| Right paddle (Versus) | ↑ / ↓ |
| Left paddle (Solo) | W / S or ↑ / ↓ |
| Menu selection | W / S or ↑ / ↓, then Enter / Space |
| Pause / resume | P or Escape |
| Mute | M |

Menus can also be selected with a pointer or touch. Touch devices show on-screen controls. Press the backtick key for the engine's diagnostics overlay.

## Checks

Run `npm run typecheck`, `npm run lint`, `npm run format`, and `npm test` for the project's type, style, and simulation checks.
