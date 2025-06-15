# Word Defender - A Typing Game

A fast-paced typing game where you defend yourself from incoming enemies by typing words correctly.

## Game Description

In Word Defender:
- You play as a circle at the center of the screen
- Enemies (also circles) spawn from the edges of the screen and move toward you
- Each enemy has a random English word above it
- Type the word and press Enter to eliminate the corresponding enemy
- Gain points based on the enemy's speed
- The game gets progressively more difficult over time
- Game ends when an enemy reaches you

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- [pnpm](https://pnpm.io/) (v7 or newer)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd typing-game
```

2. Install dependencies
```bash
pnpm install
```

### Development

To run the game in development mode:
```bash
pnpm run dev
```

Visit `http://localhost:3000` in your browser to play the game.

### Building for Production

```bash
pnpm run build
```

### Previewing the Production Build

```bash
pnpm run preview
```

## Deploying to Vercel

### Using the Vercel CLI

1. Install the Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

### Deploying via the Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Import your repository on [Vercel](https://vercel.com/new)
3. Configure your project:
   - Framework Preset: Nuxt.js
   - Build Command: (leave as default)
   - Output Directory: (leave as default)
4. Click "Deploy"

## Technology Stack

- [Vue.js 3](https://v3.vuejs.org/)
- [Nuxt 3](https://nuxt.com/)
- HTML5 Canvas for game rendering

## Game Features

- Responsive canvas-based gameplay
- Dynamic difficulty progression
- Score tracking
- Simple, intuitive controls

## License

[MIT](LICENSE)
