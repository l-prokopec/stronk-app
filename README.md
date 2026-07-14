# Stronk App

Mobile-first webová aplikace pro rychlé zapisování společných tréninků Lukáše a Terky. U každé série uchovává samostatnou váhu a počet opakování pro oba. Umožňuje upravit výchozí cviky i starší tréninky a vše ukládá automaticky.

## Stack a požadavky

Vite, React, TypeScript v strict režimu, čisté CSS, `localStorage`, Vitest, React Testing Library a ESLint. Aplikace nemá backend ani uživatelské účty a neposílá data na server.

Pro vývoj je potřeba Node.js 22+ a npm.

## Lokální spuštění

```bash
npm ci
npm run dev
```

Vite vypíše lokální adresu, obvykle `http://localhost:5173`.

## Kontroly a build

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
```

Produkční soubory vzniknou ve složce `dist`. Vite používá relativní `base: './'`, takže build funguje i z podadresáře GitHub Pages.

## Nasazení na GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` při pushi do `main` nebo `master` nainstaluje závislosti pomocí Node.js 22, provede lint, TypeScript kontrolu, testy a build a následně publikuje `dist`. Lze jej spustit i ručně přes **Actions → Test, build and deploy to GitHub Pages → Run workflow**.

Při prvním nasazení:

1. vytvořte GitHub repozitář a nastavte jej jako `origin`,
2. commitněte soubory a pushněte větev `main` nebo `master`,
3. v repozitáři otevřete **Settings → Pages**,
4. u **Build and deployment → Source** zvolte **GitHub Actions**,
5. po dokončení workflow otevřete adresu uvedenou v deploymentu.

## Důležité informace o datech

Data jsou uložena pouze v `localStorage` konkrétního prohlížeče. Nejsou synchronizována mezi zařízeními ani prohlížeči. Vymazáním dat webu se všechny uložené tréninky trvale odstraní. Tato verze neobsahuje import ani export.
