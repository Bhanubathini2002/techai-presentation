<div align="center">

# 💸 AI Without the Bill Shock

### *How to get more useful work from every AI dollar*

**A TechAI talk by [Bhanuprakash](#) · May 21, 2026**

`#AI` &nbsp;·&nbsp; `#Tokens` &nbsp;·&nbsp; `#Productivity`

<br>

![Made with HTML](https://img.shields.io/badge/Made%20with-HTML%2FCSS%2FJS-04CCBA?style=for-the-badge)
![Slides](https://img.shields.io/badge/Slides-61-04CCBA?style=for-the-badge)
![No build step](https://img.shields.io/badge/Build%20step-none-03B8A8?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-03B8A8?style=for-the-badge)

</div>

---

> **The point is not token volume. The point is *productive* token volume.**

A self-contained, zero-dependency **HTML slide deck** that walks an audience from *"AI is too expensive"* to a concrete, repeatable playbook for squeezing real work out of every token — complete with live pricing teardowns, myth-busting reveals, and a presenter mode that runs your speaker notes on a second screen.

No framework. No `npm install`. No server required. Just open it and present.

---

## ✨ Highlights

| | |
|---|---|
| 🎬 **61 hand-built slides** | Title, pop quizzes, myth reveals, pricing breakdowns, a 3-slide MCP mini-explainer, and a closing CTA |
| ⌨️ **Keyboard-driven** | Arrow keys, space, `Home`/`End` — drive the whole deck without a mouse |
| 🖥️ **Presenter mode** | Press `S` to pop out a dual-pane view with current + next slide and live notes |
| 🎨 **Custom editorial theme** | Warm-paper palette, Playfair Display headlines, TechAI teal `#04CCBA` accents |
| 🪶 **Fade-up animations** | Subtle entrance motion via `data-anim` hooks |
| 📦 **Zero dependencies** | Pure HTML + CSS + vanilla JS. Fonts via Google Fonts CDN. That's it |

---

## 🚀 Quick Start

```bash
# Clone it
git clone <your-repo-url>
cd site

# Open it — pick whichever you like:
start index.html                 # Windows
open index.html                  # macOS
xdg-open index.html              # Linux
```

Prefer a local server (recommended for clean font loading)?

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

That's the whole setup. There is no build step. 🎉

---

## ⌨️ Controls

| Key | Action |
|-----|--------|
| `→` &nbsp;·&nbsp; `Space` &nbsp;·&nbsp; `Enter` | Next slide |
| `←` | Previous slide |
| `Home` | Jump to first slide |
| `End` | Jump to last slide |
| `S` | Toggle **Presenter Mode** (current slide, next slide, speaker notes, timer) |

> 💡 **Tip:** Open presenter mode on your laptop, mirror the main window to the projector, and your notes stay private.

> 🔗 **Deep links:** open `index.html?slide=31` to jump straight to slide 31. The URL stays in sync as you navigate, so you can bookmark or share any slide.

---

## 🧭 What's Inside the Talk

The narrative is structured to flip beliefs, not just dump facts:

- **🃏 Pop Quiz** — surface the assumptions the talk will dismantle
- **🔥 Four Myths, Four Reveals** — *"You need expensive models," "Open source is garbage," "Local is cheapest," "More tokens = better results"*
- **💰 Pricing Teardowns** — GLM, Kimi, and friends, with real numbers
- **📊 My Proof** — actual daily token usage and spend
- **🛠️ The Playbook** — from goals to missions, the `/goal` workflow, caching, and a curated shortlist
- **🔌 MCP in 3 Slides** — what the Model Context Protocol is, how it works, why it matters
- **🎯 Closing CTA** — a business framework and a way to connect

---

## 📂 Project Structure

```
site/
├── index.html            # The deck — all 61 slides live here
├── presenter.js          # Keyboard navigation + presenter window
├── base.css              # Layout & deck primitives
├── techai-theme.css      # TechAI brand colors & typography tokens
├── style.css             # Slide-specific styling & animations
├── *.png / *.jpg         # Charts, diagrams, and proof screenshots
└── README.md             # You are here ✦
```

---

## 🎨 Theming

The look is driven entirely by CSS custom properties in `techai-theme.css`. Want to rebrand it? Change a handful of variables:

```css
:root {
  --bg:     #faf9f6;   /* warm off-white paper   */
  --accent: #04CCBA;   /* TechAI teal            */
  --text-1: #0d0d0d;   /* near-black headlines   */
}
```

Swap the accent, reload, done.

---

## ➕ Adding a Slide

Slides are just `<section>` elements. Drop a new one anywhere in `index.html`:

```html
<section class="slide" data-title="My New Slide">
  <p class="kicker">Section label</p>
  <h2 class="h2 anim-fade-up" data-anim="fade-up">Your headline</h2>
  <aside class="notes">
    <p>Private speaker notes — visible only in presenter mode.</p>
  </aside>
</section>
```

Slide numbers and totals update **automatically** — no counting required.

---

<div align="center">

**Built for the stage. Open it. Present it. No bill shock.** 💸

<sub>MIT Licensed · Crafted with HTML, CSS, and a little bit of teal.</sub>

</div>
