---
name: draw
description: Draw Braille Unicode dot art (⣿⣶⣦ characters) on a 40x30 grid and save it as a .txt file in the drawings/ folder. Use when the user asks to draw something (e.g., "/draw flower", "/draw house").
user-invocable: true
argument-hint: <thing to draw>
allowed-tools: Bash, Write, Read
---

# Draw Braille Unicode Art

Draw **$ARGUMENTS** using **Braille Unicode characters** and save it to `drawings/`.

## Style: Braille Dot Art

All drawings use **Unicode Braille patterns** (U+2800–U+28FF). Each Braille character encodes a 2×4 pixel grid, giving much higher effective resolution than traditional ASCII art.

### How Braille characters work

- Each character is a 2-wide × 4-tall grid of dots (8 dots total)
- `⠀` (U+2800) = all dots off (blank)
- `⣿` (U+28FF) = all dots on (fully filled)
- Partial fills like `⠁⠂⠄⡀⠈⠐⠠⢀` toggle individual dots
- A 40×30 character grid gives an effective resolution of **80×120 pixels**

### Visual rules

- **High detail** — Use the dot density to create smooth curves, gradients, and fine detail that regular ASCII cannot achieve.
- **Shading via density** — Denser Braille patterns (`⣿⣷⣶⣦`) for dark/solid areas, sparser patterns (`⠁⠂⠄⡀`) for light areas, `⠀` for empty space.
- **Smooth contours** — Braille dots allow near-pixel-level edge placement. Use this to create smooth outlines and rounded shapes.
- **Realistic proportions** — Draw subjects with natural, realistic proportions. No cartoonish exaggeration.
- **Fill the canvas** — Subject should be centered and occupy at least 40% of the grid.

### Technical rules

1. **Canvas size** — 40 columns × 30 rows of Braille characters (effective resolution: 80×120 pixels).
2. **Characters** — Use ONLY Unicode Braille block characters (U+2800–U+28FF). Use `⠀` (Braille blank, U+2800) for empty areas — NOT regular spaces.
3. **Encoding** — Output file must be UTF-8 encoded.
4. **File name** — Derive a slug from the subject (e.g., "flower" → `flower.txt`, "monster" → `monster.txt`).

## Steps

### Step 1: Generate the drawing

Write a Python script that:

1. Creates an 80×120 pixel bitmap (2D array of booleans or 0/1 values)
2. Draws the subject using geometric primitives (circles, lines, fills, curves)
3. Converts the bitmap to Braille characters by mapping each 2×4 pixel block to the corresponding Braille codepoint

**Braille dot mapping** (pixel positions → bit values):

```
(0,0)=0x01  (1,0)=0x08
(0,1)=0x02  (1,1)=0x10
(0,2)=0x04  (1,2)=0x20
(0,3)=0x40  (1,3)=0x80
```

Braille character = `chr(0x2800 + sum_of_active_dot_bits)`

### Step 2: Save the file

Write the Braille art directly to `drawings/<subject-slug>.txt` (UTF-8).

### Step 3: Confirm

Show the full Braille art output to the user so they can see it rendered in the terminal.
