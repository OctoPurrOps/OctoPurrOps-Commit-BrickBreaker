# Commit Brickbreaker
<img width="1353" height="777" alt="image" src="https://github.com/user-attachments/assets/09ab5afd-a7f5-4752-a902-24d453fe3920" />


GitHub heatmap but make it arcade: shoot to paint/erase tiles until the secret word matches.  
Made with plain HTML/CSS/JS + Canvas, pixel-style rendering, combos, and a few goofy power-ups.

## Quick try (no setup)
Open `index.html` (the single-file build) in your browser and play.

## Dev / source version
Source is split in `/src` (ES modules). Most browsers won’t load module imports from `file://`, so run a tiny server:

```bash
python -m http.server 8000
