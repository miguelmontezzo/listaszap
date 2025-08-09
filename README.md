
# ListasZap UI (Vite + React + Tailwind)

Frontend mobile-first. Toda a lógica (OTP, listas, itens, membros) via webhooks do n8n. Leitura (opcional) de dados via Supabase (views com RLS).

## Rodar local
```bash
npm i
cp .env.example .env # edite as variáveis
npm run dev
```

## Variáveis (.env)
- `VITE_N8N_BASE=https://SEU_N8N/webhook`
- `VITE_SUPABASE_URL=https://SEU_PROJECT.supabase.co`
- `VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY`

## Build
```bash
npm run build && npm run preview
```

## Deploy na Vercel
1. Suba no GitHub.
2. New Project na Vercel -> importe o repositório.
3. Build command: `npm run build` | Output: `dist`
4. Crie as variáveis de ambiente (Production + Preview) com as `VITE_*`.
5. Deploy.
