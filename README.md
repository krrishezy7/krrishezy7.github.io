# Krrish Sharma — Portfolio

Personal portfolio site. Plain HTML/CSS/JS, no build step, no dependencies.

## Structure

- `index.html` — page content and structure
- `style.css` — all styling
- `script.js` — cursor effects, scroll animations, scrollspy nav, and the Snake game
- `favicon.svg` — site favicon
- `og-image.png` — social share preview image

## Running locally

Just open `index.html` in a browser, or serve it with any static server, e.g.:

```
npx serve .
```

## Deploying

Push to GitHub, then connect the repo to Netlify or Vercel for automatic deploys.
No build command needed — the site is fully static.

## TODO

- [ ] Swap the "View code" placeholder links on each project card for real GitHub repo links
- [ ] Point a custom domain at the deployed site

## Global snake high score

The ambient Snake game (`initAmbientSnake()` in `script.js`) shows a global
"High Score" badge sourced from a Supabase table. To turn it on:

1. Create a free project at supabase.com.
2. In the SQL editor, run:

   ```sql
   create table public.snake_scores (
     id bigint generated always as identity primary key,
     score integer not null check (score > 0 and score <= 100000),
     created_at timestamptz not null default now()
   );

   alter table public.snake_scores enable row level security;

   create policy "Public read" on public.snake_scores
     for select using (true);

   create policy "Public insert" on public.snake_scores
     for insert with check (true);
   ```

3. In Project Settings → API, copy the Project URL and the `anon` public key
   into `SUPABASE_URL` / `SUPABASE_ANON_KEY` at the top of `script.js`.

The anon key is meant to be exposed client-side — RLS policies above (public
read, public insert, capped score) are what keep it sane, not secrecy of the
key. There's no server-side game validation, so this is an honor-system
leaderboard: anyone could POST a fake score directly to the API. Fine for a
portfolio easter egg, not something to rely on for anything that matters.
