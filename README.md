# MagicHango / Permio

Application Next.js pour aider les dog trainers à organiser leurs réservations, leurs disponibilités, leur planning, leurs clients, leurs paiements et leurs notifications.

Ce README sert de mémo de travail pour lancer le projet, vérifier le code, prévisualiser les emails, utiliser Inngest et générer des graphes de dépendances.

## Démarrage

Installer les dépendances :

```bash
pnpm install
```

Lancer l'application en local :

```bash
pnpm run dev
```

L'application Next.js est ensuite disponible sur :

```text
http://localhost:3000
```

## Variables d'environnement

Le projet utilise un fichier `.env` à la racine. Vérifier notamment les variables liées à :

- Clerk
- Stripe
- Resend / emails
- Inngest
- base de données
- Google Maps / Places si le parcours adresse est utilisé

Pour Inngest, garder les variables du même environnement Cloud :

```env
INNGEST_ENV=production
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

Ne pas commiter les secrets.

## Scripts utiles

Vérifier TypeScript :

```bash
.\node_modules\.bin\tsc.cmd --noEmit --incremental false
```

Build Next.js :

```bash
pnpm run build
```

Attention : sur certaines machines Windows/sandbox, le build peut compiler puis échouer sur `spawn EPERM`. Dans ce cas, vérifier surtout les erreurs avant cette étape.

## Emails et Inngest

### Logs des mails envoyés

Route Inngest :

```text
/app/api/inngest/route.ts
```

Lancer Inngest en local :

```bash
pnpm dlx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

Dashboard Inngest :

```text
http://localhost:8288
```

### Visualiser les emails

Lancer le serveur de preview React Email :

```bash
npx email dev --dir src/emails --port 3001
```

Preview :

```text
http://localhost:3001
```

Script équivalent disponible dans `package.json` :

```bash
pnpm run email:dev
```

Exporter les templates :

```bash
pnpm run email:export
```

## Knip

Knip sert à repérer les fichiers morts, exports inutilisés et imports inutiles.

Commandes conservées :

```bash
npx knip
npx knip --fix
```

Script équivalent :

```bash
pnpm run knip
```

## Dependency Cruiser

Dependency Cruiser permet de visualiser les dépendances entre fichiers et les appels API depuis les pages front.

### Scan simple

```bash
npx depcruise src app components lib
```

### Générer un graphe SVG simple

```powershell
npx depcruise src --output-type dot | & "C:\Program Files\Graphviz\bin\dot.exe" -Tsvg > dependency-graph.svg
start dependency-graph.svg
```

### Graphe enrichi avec les appels `fetch`

```powershell
npx depcruise app components src lib --include-only "^(app|components|src|lib)" --output-type dot --output-to doc/dependency-cruiser/dependency-graph.dot
node .\doc\dependency-cruiser\augment-dot-with-fetch.js
& "C:\Program Files\Graphviz\bin\dot.exe" -Tsvg doc/dependency-cruiser/dependency-graph.with-fetch.dot -o doc/dependency-cruiser/dependency-graph.with-fetch.svg
start doc/dependency-cruiser/dependency-graph.with-fetch.svg
```

### Résumés API et contrats

```powershell
npx depcruise app components src lib --no-config --include-only "^(app|components|src|lib)" --output-type dot --output-to doc/dependency-cruiser/dependency-graph.dot
node .\doc\dependency-cruiser\generate-api-summary.js
node .\doc\dependency-cruiser\generate-api-contracts.js
```

### Génération complète des graphes documentés

Créer le dossier de sortie :

```powershell
New-Item -ItemType Directory -Force -Path .\doc\dependency-cruiser | Out-Null
```

Générer le graphe DOT :

```powershell
npx depcruise --no-config --ts-config tsconfig.json app components src lib --include-only "^(app|components|src|lib)" --output-type dot --output-to doc/dependency-cruiser/dependency-graph.dot
```

Ajouter les liens `fetch` :

```powershell
node .\doc\dependency-cruiser\augment-dot-with-fetch.js
```

Générer les SVG :

```powershell
& "C:\Program Files\Graphviz\bin\dot.exe" -Tsvg doc/dependency-cruiser/dependency-graph.with-fetch.dot -o doc/dependency-cruiser/dependency-graph.with-fetch.svg
& "C:\Program Files\Graphviz\bin\dot.exe" -Tsvg doc/dependency-cruiser/dependency-graph.front-lib.dot -o doc/dependency-cruiser/dependency-graph.front-lib.svg
start .\doc\dependency-cruiser\dependency-graph.front-lib.svg
```

## Commandes historiques conservées

Cette section garde le mémo original sous forme rangée, pour ne pas perdre les commandes déjà présentes.

```bash
/app/api/inngest/route.ts
pnpm dlx inngest-cli@latest dev -u http://localhost:3000/api/inngest
http://localhost:8288
```

```bash
npx email dev --dir src/emails --port 3001
http://localhost:3001
```

```bash
npx knip
npx knip --fix
```

```powershell
npx depcruise src app components lib
npx depcruise src --output-type dot | & "C:\Program Files\Graphviz\bin\dot.exe" -Tsvg > dependency-graph.svg
start dependency-graph.svg
```

```powershell
npx depcruise app components src lib --include-only "^(app|components|src|lib)" --output-type dot --output-to doc/dependency-cruiser/dependency-graph.dot
node .\doc\dependency-cruiser\augment-dot-with-fetch.js
& "C:\Program Files\Graphviz\bin\dot.exe" -Tsvg doc/dependency-cruiser/dependency-graph.with-fetch.dot -o doc/dependency-cruiser/dependency-graph.with-fetch.svg
start doc/dependency-cruiser/dependency-graph.with-fetch.svg
```

```powershell
npx depcruise app components src lib --no-config --include-only "^(app|components|src|lib)" --output-type dot --output-to doc/dependency-cruiser/dependency-graph.dot
node .\doc\dependency-cruiser\generate-api-summary.js
node .\doc\dependency-cruiser\generate-api-contracts.js
```

```powershell
New-Item -ItemType Directory -Force -Path .\doc\dependency-cruiser | Out-Null
npx depcruise --no-config --ts-config tsconfig.json app components src lib --include-only "^(app|components|src|lib)" --output-type dot --output-to doc/dependency-cruiser/dependency-graph.dot
node .\doc\dependency-cruiser\augment-dot-with-fetch.js
& "C:\Program Files\Graphviz\bin\dot.exe" -Tsvg doc/dependency-cruiser/dependency-graph.with-fetch.dot -o doc/dependency-cruiser/dependency-graph.with-fetch.svg
& "C:\Program Files\Graphviz\bin\dot.exe" -Tsvg doc/dependency-cruiser/dependency-graph.front-lib.dot -o doc/dependency-cruiser/dependency-graph.front-lib.svg
start .\doc\dependency-cruiser\dependency-graph.front-lib.svg
```
