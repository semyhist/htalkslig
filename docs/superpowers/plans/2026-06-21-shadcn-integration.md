# shadcn/ui Integration and Prediction Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate shadcn/ui into the Vite React project with a monochrome and minimalist design language, and create a modern 'Prediction Card' component.

**Architecture:** Path alias resolution via `tsconfig.app.json` and `vite.config.ts`, followed by initializing shadcn. Then, design a minimalist, typographic-heavy `PredictionCard` component utilizing Tailwind CSS utility classes and clean borders.

**Tech Stack:** React, TypeScript, Tailwind CSS, shadcn/ui.

---

### Task 1: Configure Path Aliases

**Files:**
- Modify: [tsconfig.app.json](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/tsconfig.app.json)
- Modify: [vite.config.ts](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/vite.config.ts)

- [ ] **Step 1: Add path alias mapping to compilerOptions in tsconfig.app.json**

Modify [tsconfig.app.json](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/tsconfig.app.json):
```json
    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
```

- [ ] **Step 2: Add path alias resolution to vite.config.ts**

Overwrite [vite.config.ts](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/vite.config.ts):
```typescript
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 3: Commit path alias configuration**

Run:
```bash
git add tsconfig.app.json vite.config.ts
git commit -m "chore: configure paths alias resolution for ts and vite"
```

---

### Task 2: Initialize shadcn/ui

**Files:**
- Modify: [src/index.css](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/index.css)
- Create: [components.json](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/components.json)

- [ ] **Step 1: Run shadcn initialization CLI**

Run:
```bash
npx shadcn@latest init --template vite --yes
```

- [ ] **Step 2: Update index.css to enforce a monochrome theme**

Ensure that [src/index.css](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/index.css) enforces a minimalist monochrome layout (blacks, whites, grays, and clear borders):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 0% 9%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 0% 98%;
    --destructive-foreground: 0 0% 9%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
  }
}

body {
  margin: 0;
  background-color: #09090b;
  color: #fafafa;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}
```

- [ ] **Step 3: Commit shadcn configuration**

Run:
```bash
git add components.json src/index.css
git commit -m "chore: initialize shadcn and apply monochrome variables theme"
```

---

### Task 3: Create PredictionCard Component

**Files:**
- Create: [src/components/PredictionCard.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/PredictionCard.tsx)

- [ ] **Step 1: Write a minimalist PredictionCard component**

Create [src/components/PredictionCard.tsx](file:///c:/Users/Semih/Desktop/software/HTalksDunyaKupasiLigi/src/components/PredictionCard.tsx):
```tsx
import React, { useState } from 'react';

export interface MatchData {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  home_odd: number;
  draw_odd: number;
  away_odd: number;
}

interface PredictionCardProps {
  match: MatchData;
  initialPrediction?: { outcome: 'home' | 'draw' | 'away'; diff: number };
  onPredict: (matchId: string, outcome: 'home' | 'draw' | 'away', diff: number) => void;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  match,
  initialPrediction,
  onPredict,
}) => {
  const [outcome, setOutcome] = useState<'home' | 'draw' | 'away' | null>(
    initialPrediction?.outcome || null
  );
  const [diff, setDiff] = useState<string>(
    initialPrediction ? String(initialPrediction.diff) : ''
  );

  const handleSelectOutcome = (selected: 'home' | 'draw' | 'away') => {
    setOutcome(selected);
    const diffVal = selected === 'draw' ? 0 : (parseInt(diff, 10) || 0);
    if (selected === 'draw') setDiff('0');
    onPredict(match.id, selected, diffVal);
  };

  const handleDiffChange = (val: string) => {
    setDiff(val);
    if (outcome) {
      const diffVal = outcome === 'draw' ? 0 : (parseInt(val, 10) || 0);
      onPredict(match.id, outcome, diffVal);
    }
  };

  const formattedDate = new Date(match.commence_time).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-none shadow-none space-y-6 max-w-md w-full mx-auto text-zinc-100 font-mono">
      {/* Header Info */}
      <div className="flex justify-between items-center text-xs tracking-widest text-zinc-500 uppercase">
        <span>⚽ fıfa world cup</span>
        <span>{formattedDate}</span>
      </div>

      {/* Teams Display */}
      <div className="flex justify-between items-center text-sm font-medium border-y border-zinc-900 py-3 uppercase tracking-wider">
        <span className="flex-1 text-left">{match.home_team}</span>
        <span className="text-zinc-600 text-xs px-2">vs</span>
        <span className="flex-1 text-right">{match.away_team}</span>
      </div>

      {/* 1X2 Outcome Selector */}
      <div className="grid grid-cols-3 gap-1 border-b border-zinc-900 pb-6">
        <button
          onClick={() => handleSelectOutcome('home')}
          className={`py-3 text-xs uppercase border transition-colors ${
            outcome === 'home'
              ? 'bg-zinc-100 border-zinc-100 text-zinc-950 font-bold'
              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-500'
          }`}
        >
          {match.home_team}
          <div className="text-[10px] opacity-80 mt-1 font-sans">
            {match.home_odd} (x10p)
          </div>
        </button>

        <button
          onClick={() => handleSelectOutcome('draw')}
          className={`py-3 text-xs uppercase border transition-colors ${
            outcome === 'draw'
              ? 'bg-zinc-100 border-zinc-100 text-zinc-950 font-bold'
              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-500'
          }`}
        >
          beraberlik
          <div className="text-[10px] opacity-80 mt-1 font-sans">
            {match.draw_odd} (x10p)
          </div>
        </button>

        <button
          onClick={() => handleSelectOutcome('away')}
          className={`py-3 text-xs uppercase border transition-colors ${
            outcome === 'away'
              ? 'bg-zinc-100 border-zinc-100 text-zinc-950 font-bold'
              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-500'
          }`}
        >
          {match.away_team}
          <div className="text-[10px] opacity-80 mt-1 font-sans">
            {match.away_odd} (x10p)
          </div>
        </button>
      </div>

      {/* Goal Difference Input */}
      <div className="space-y-2">
        <label className="block text-xs uppercase tracking-widest text-zinc-500">
          gol farkı tahmini
        </label>
        <input
          type="number"
          min="0"
          disabled={outcome === 'draw'}
          placeholder={outcome === 'draw' ? 'beraberlik için 0' : 'kaç gol farkla kazanır?'}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-none p-3 text-sm text-zinc-100 font-mono focus:outline-none focus:border-zinc-100 disabled:opacity-50"
          value={diff}
          onChange={(e) => handleDiffChange(e.target.value)}
        />
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit PredictionCard component**

Run:
```bash
git add src/components/PredictionCard.tsx
git commit -m "feat: add minimalist and monochrome PredictionCard component"
```

---

### Task 4: Compilation and Build Verification

**Files:**
- None

- [ ] **Step 1: Verify the build**

Run:
```bash
npm run build
```
Expected: PASS with 0 errors.
