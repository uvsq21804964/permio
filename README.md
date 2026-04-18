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
