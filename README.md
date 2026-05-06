<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# OmniPost AI

> **One idea. Infinite reach.**

OmniPost is an AI-powered, multi-platform social media content generator. Paste a single content idea and OmniPost produces fully tailored post drafts **and** matching AI-generated images for **LinkedIn**, **Twitter/X**, and **Instagram** — all at once, all on-brand.

View your app in AI Studio: https://ai.studio/apps/1dbbab86-c5e7-4ac9-94e6-ded964ca8ad1

---

## Features

| Feature | Description |
|---|---|
| **Multi-platform drafts** | Generates platform-optimised text for LinkedIn (long-form), Twitter/X (punchy), and Instagram (visual + hashtags) in a single click. |
| **AI image generation** | Produces a tailored header / post image for each platform using Gemini's image model, at the correct aspect ratio (16:9 for LinkedIn & Twitter, 1:1 for Instagram). |
| **Google Search grounding** | The text model uses live Google Search results to enrich posts with current trends, statistics, and news relevant to your idea. |
| **Tactical tone control** | Choose from three content tones — **Professional** 💼, **Witty** 💡, or **Urgent** 🚨 — and every draft adapts accordingly. |
| **Brand kit** | Upload a PNG logo and pick a brand accent colour. The logo is embedded into each AI-generated image and the colour is used throughout every prompt. When a logo is uploaded, its dominant colour is auto-detected and pre-populates the colour picker. |
| **Resource link analysis** | Add URLs (your website, LinkedIn page, Instagram profile, etc.) and OmniPost analyses your existing brand voice, image style, and messaging history to align the new posts with your established presence. A strategic analysis note is shown alongside the results. |
| **Copy & export** | Copy any post text to the clipboard in one click. Export all drafts as **JSON** or **CSV** for use in scheduling tools. |
| **Image lightbox** | Click any generated image to open a full-screen lightbox with a download button. |

---

## Tech Stack

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build tool:** [Vite 6](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (via `@tailwindcss/vite`)
- **AI SDK:** [`@google/genai`](https://www.npmjs.com/package/@google/genai) — Gemini models
  - Text & grounding: `gemini-3-flash-preview` with Google Search tool
  - Image generation: `gemini-2.5-flash-image`
- **Animations:** [Motion (Framer Motion)](https://motion.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Markdown rendering:** [react-markdown](https://github.com/remarkjs/react-markdown)

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A **Gemini API key** — obtain one for free at [Google AI Studio](https://aistudio.google.com/apikey)

---

## Run Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure your API key

Create a `.env.local` file in the project root (it is git-ignored) and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Tip:** `.env.example` is included in the repo as a reference template showing all supported variables.

The `APP_URL` variable is optional for local development — it is used in production (e.g. on Cloud Run) for self-referential links.

### 3. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

### 4. Build for production

```bash
npm run build        # outputs to ./dist
npm run preview      # serves the production build locally
```

### 5. Type-check (lint)

```bash
npm run lint         # runs tsc --noEmit
```

---

## How to Use OmniPost

1. **Enter your content seed** — type or paste a topic, announcement, or article idea into the main text area.
2. **Select a tone** — click **Professional**, **Witty**, or **Urgent** to set the voice for all posts.
3. **(Optional) Add resource links** — paste URLs to your existing social profiles or website and press **Enter**. OmniPost will analyse them to match your brand voice.
4. **(Optional) Upload a logo** — click **Upload PNG** to add your brand logo. It will be composited into every generated image.
5. **(Optional) Set a brand colour** — click the colour swatch to open the colour picker, or let it be set automatically from your uploaded logo.
6. **Click "Generate Multi-Post"** — OmniPost calls Gemini to research your topic, write three platform-specific drafts, and generate three matching images in parallel. This typically takes 20–40 seconds.
7. **Review the results** — each platform card shows the generated image, the post text (rendered as Markdown), and a mock social UI. If resource links were provided, a **Strategic Analysis** note summarises how your existing brand style was applied.
8. **Export or copy** — use the **Copy** button on any card to copy the text, click an image to download it, or use **Export CSV** / **Export JSON** to save all drafts at once.

---

## Project Structure

```
OmniPost/
├── src/
│   ├── App.tsx          # Main application component — all UI and AI logic
│   ├── main.tsx         # React entry point
│   ├── index.css        # Global styles
│   ├── types.ts         # Shared TypeScript types (Tone, PostContent, GeneratedPost)
│   └── lib/
│       └── utils.ts     # Tailwind class merging utility (cn)
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration (injects GEMINI_API_KEY at build time)
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
├── metadata.json        # AI Studio app metadata
└── .env.example         # Environment variable reference template
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Authenticates calls to the Gemini API. |
| `APP_URL` | No | The URL where the app is hosted (injected automatically by AI Studio / Cloud Run). |
