# Fieldnote — a free, deployable AI chatbot

This repo has two parts:

- `chatbot.html` — the chat UI (static, goes on GitHub Pages)
- `worker.js` — a tiny backend that holds your API key and talks to Groq's free LLM API

You need both, because a browser can never hold a secret key safely — anything
in `chatbot.html`'s JavaScript is visible to anyone who opens dev tools. The
worker keeps the real key server-side and only exposes a safe "send a message"
endpoint to the frontend.

Total cost: **$0**. No credit card required for either service, at the free
tiers used here.

## 1. Get a free Groq API key

1. Go to https://console.groq.com and sign up (free)
2. Create an API key from the dashboard
3. Copy it somewhere safe — you'll paste it once during deployment

Groq hosts fast, free-tier access to strong open models (this project uses
Llama 3.3 70B).

## 2. Deploy the backend (Cloudflare Workers, free tier)

1. Go to https://dash.cloudflare.com and sign up (free)
2. In the dashboard, go to **Workers & Pages → Create → Create Worker**
3. Give it a name (e.g. `fieldnote-chat`) and deploy the default starter
4. Click **Edit code**, delete everything, and paste in the contents of `worker.js`
5. Click **Deploy**
6. Go to the worker's **Settings → Variables and Secrets**, add a secret:
   - Name: `GROQ_API_KEY`
   - Value: the key you copied in step 1
7. Save. Your worker is now live at something like:
   `https://fieldnote-chat.<your-subdomain>.workers.dev`

## 3. Point the frontend at your backend

Open `chatbot.html`, find this line near the top of the `<script>`:

```js
const BACKEND_URL = "https://your-worker-name.your-subdomain.workers.dev";
```

Replace it with your actual worker URL from step 2.6.

## 4. Put it on GitHub

```bash
git init
git add chatbot.html worker.js README.md
git commit -m "Add Fieldnote chatbot"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## 5. Turn on GitHub Pages

1. In your repo, go to **Settings → Pages**
2. Under **Source**, pick the `main` branch, root folder
3. Save — GitHub gives you a live URL in a minute or two
   (e.g. `https://<you>.github.io/<repo>/chatbot.html`)

That's it — a real, working AI chatbot, live on the internet, for free.

## Notes for your portfolio / resume

- The architecture here (static frontend + serverless proxy holding a secret
  key) is the standard, correct pattern for shipping an AI feature safely —
  worth mentioning explicitly if you're showing this to anyone technical.
- Conversation history is in-memory only (clears on refresh). Adding
  persistence (e.g. `localStorage`, or a small database) is a natural next
  feature to build and demo if you want to go further.
- Swapping `worker.js` to call a different provider (Gemini, OpenAI, etc.)
  only requires changing the `fetch` call inside it — the frontend never
  needs to know which model is behind the API.
