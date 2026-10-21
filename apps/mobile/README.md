# @opencarbon/mobile

Application mobile OpenCarbon — **React Native + Expo (TypeScript)**, routing `expo-router`,
data via `@opencarbon/api` (client fetch + React Query + Zod).

📐 **[ARCHITECTURE.md](ARCHITECTURE.md)** — structure du code, flux d'authentification, contrat backend et état
réel de l'implémentation. À lire avant de contribuer.

## Démarrer

Depuis la racine du monorepo :

```bash
pnpm install
cp apps/mobile/.env.example apps/mobile/.env   # puis renseigner EXPO_PUBLIC_API_BASE_URL
pnpm --filter @opencarbon/mobile start
```

Puis `i` pour le simulateur iOS, `a` pour l'émulateur Android, ou scanner le QR code avec
**Expo Go** sur un téléphone physique.

> **iPhone physique : Expo Go ne fonctionne pas pour l'instant.** Le projet est en **SDK 56**, alors que la version
> d'Expo Go de l'App Store ne supporte que le SDK le plus récent (57) et rejette le QR code. L'App Store ne permet
> pas d'installer une ancienne version. En attendant la montée en SDK 57 :
>
> - **Simulateur iOS / émulateur Android** (`i` / `a`) : la CLI Expo y installe d'elle-même l'Expo Go du bon SDK ;
> - **Android physique** : le Play Store a le même problème, mais l'APK Expo Go SDK 56 est téléchargeable depuis
>   [expo.dev/go](https://expo.dev/go).

Aucun dossier `ios/` ni `android/` n'est nécessaire : toutes les dépendances natives du projet
sont embarquées dans Expo Go. Ne pas lancer `expo prebuild` sans décision d'équipe.

### Configuration

`EXPO_PUBLIC_API_BASE_URL` est lue par `app.config.ts` (clé `extra`) puis validée au démarrage
dans `src/config/env.ts` — l'app refuse de démarrer si elle est absente. Ne jamais embarquer de
`.env` comme asset.

Selon la cible, l'URL du backend local n'est pas la même :

| Cible                       | Valeur                     |
| --------------------------- | -------------------------- |
| Simulateur iOS              | `http://localhost:3000`    |
| Émulateur Android           | `http://10.0.2.2:3000`     |
| Téléphone physique, Expo Go | `http://<IP-LAN-Mac>:3000` |

## Réinstallation propre — après un changement de version d'Expo SDK ou de React Native

**`pnpm install` seul ne suffit pas.** pnpm conserve les variantes de peers déjà résolues : un
`expo` en SDK N peut rester lié à un `@expo/metro-runtime` de SDK N-1. Le bundling réussit et
l'app crashe au démarrage, typiquement sur un `TypeError: Object is not a function`. Le réglage
`node-linker=hoisted` du `.npmrc` racine n'est lui aussi appliqué qu'à une install propre.

Depuis la racine :

```bash
rm -rf node_modules apps/mobile/node_modules packages/*/node_modules apps/mobile/.expo .turbo
pnpm install
pnpm --filter @opencarbon/mobile exec expo install --check   # aligner les versions sur le SDK
pnpm --filter @opencarbon/mobile exec expo start -c          # -c : vider le cache Metro
```

Contrôle en cas de doute — les deux lignes doivent afficher la même version :

```bash
node -e "const d=require('fs').realpathSync('node_modules/expo');
console.log(require(require.resolve('@expo/metro-runtime/package.json',{paths:[d]})).version);
console.log(require(require.resolve('@expo/metro-runtime/package.json',{paths:['apps/mobile']})).version)"
```

## Conventions

- Les écrans ne consomment que `@opencarbon/*` — jamais d'import relatif vers `packages/`.
- ESLint flat config à la racine, Prettier à 120 colonnes. `pnpm lint` et `pnpm typecheck`
  doivent passer avant toute PR.
