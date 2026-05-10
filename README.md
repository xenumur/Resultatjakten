# Resultatjakten

Ett modernt tips-/bettingsystem för fotbollsturneringar (som VM 2026), byggt med Next.js, Tailwind CSS och Supabase.

## Lokal körning

1. **Installera beroenden**
   Kör följande kommando i rotmappen (`app`):
   ```bash
   npm install
   ```

2. **Sätt upp databasen i Supabase**
   - Skapa ett nytt projekt på [supabase.com](https://supabase.com).
   - Kör hela det genererade SQL-schemat (se `implementation_plan.md`) i Supabase SQL Editor för att skapa tabeller, RLS-regler (Row Level Security) och Typer.

3. **Konfigurera miljövariabler**
   Skapa en `.env.local` fil i rotmappen med dina Supabase-nycklar:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=din_supabase_projekt_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=din_supabase_anon_key
   ```

4. **Starta utvecklingsservern**
   ```bash
   npm run dev
   ```
   Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare!

## Deployment till Vercel

Eftersom projektet är byggt med Next.js är Vercel den rekommenderade hosting-lösningen:

1. Pusha koden till ett GitHub-repository.
2. Logga in på [Vercel](https://vercel.com) och skapa ett nytt projekt från ditt repo.
3. Vercel känner automatiskt igen att det är ett Next.js-projekt.
4. Gå till fliken **Environment Variables** i Vercel och lägg till:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Klicka på **Deploy**!
