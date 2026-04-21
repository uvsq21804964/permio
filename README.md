Logs mails envoyés
bash ```
/app/api/inngest/route.ts
npx --ignore-scripts=false inngest-cli@latest dev -u http://localhost:3000/api/inngest
http://localhost:8288

```

ou


Visualiser mails
```

npx email dev --dir src/emails --port 3001
http://localhost:3001

```

```

---

KNIP - Sypprimer les fichiers morts et imports inutiles

npx knip
npx knip --fix

---

dependency-cruiser - visualiser les dépendances entre fichiers et les appels API depuis les pages front

---

npx depcruise src app components lib  
npx depcruise src --output-type dot | & "C:\Program Files\Graphviz\bin\dot.exe" -Tsvg > dependency-graph.svg
start dependency-graph.svg

---

npx depcruise app components src lib --include-only "^(app|components|src|lib)" --output-type dot --output-to doc/dependency-cruiser/dependency-graph.dot
node .\doc\dependency-cruiser\augment-dot-with-fetch.js
& "C:\Program Files\Graphviz\bin\dot.exe" -Tsvg doc/dependency-cruiser/dependency-graph.with-fetch.dot -o doc/dependency-cruiser/dependency-graph.with-fetch.svg
start doc/dependency-cruiser/dependency-graph.with-fetch.svg

---

npx depcruise app components src lib --no-config --include-only "^(app|components|src|lib)" --output-type dot --output-to doc/dependency-cruiser/dependency-graph.dot
node .\doc\dependency-cruiser\generate-api-summary.js
node .\doc\dependency-cruiser\generate-api-contracts.js

---

New-Item -ItemType Directory -Force -Path .\doc\dependency-cruiser | Out-Null
npx depcruise --no-config --ts-config tsconfig.json app components src lib `  --include-only "^(app|components|src|lib)"`
--output-type dot `--output-to doc/dependency-cruiser/dependency-graph.dot
node .\doc\dependency-cruiser\augment-dot-with-fetch.js
& "C:\Program Files\Graphviz\bin\dot.exe"` -Tsvg doc/dependency-cruiser/dependency-graph.with-fetch.dot`-o doc/dependency-cruiser/dependency-graph.with-fetch.svg
& "C:\Program Files\Graphviz\bin\dot.exe"` -Tsvg doc/dependency-cruiser/dependency-graph.front-lib.dot`
-o doc/dependency-cruiser/dependency-graph.front-lib.svg
start .\doc\dependency-cruiser\dependency-graph.front-lib.svg
