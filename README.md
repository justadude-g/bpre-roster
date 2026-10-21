# BPRE Force Builder

A force builder for **Black Powder Red Earth**. It runs in any browser, needs no install or account, and is built for phones at the table as much as desktops.

1. Pick the game type (Core Set, Phase Line or Spearhead) and the tasking's CP limit. Phase Line adds the two 150 CP reinforcement waves; Spearhead can add the 350 CP Specialist Reserve for campaigns. Defenders can set aside a Quick Reaction Force where the rules allow it.
2. Pick a faction and, if you want, one ally from the same bloc. Illegal pairings such as SPEAR with the Aayari Network can't be built.
3. Build each deployment. The app tracks CP per pool, the one-per-100-CP limits, the Muhtasib-to-Shurta ratio, QRF discounts, and upgrades such as respirators and Forward Deployed.
4. Choose a hand of three unique Intervention cards from any set. Unit Fires cards (Scoria RS, FengHuang-918, Quadrotor) are added automatically; in Phase Line you place one Phase Line Fires card at each line. Faction-emblem cards only appear for forces that include that faction.

Forces save to your browser. You can copy a force as text for Discord or email, share a link or a short force code that loads it for someone else, export or import a file, or print a one-page force sheet. Light and dark mode follow your device, or set one with the theme button.

## Use it

Once GitHub Pages is on (see below), the app lives at:

```
https://justadude-g.github.io/bpre-roster/
```

To run it offline, download `dist/bpre-force-builder.html` and open it. It is the whole app in one file.

## Put it on GitHub

1. The repository is [justadude-g/bpre-roster](https://github.com/justadude-g/bpre-roster). For a fork or a fresh copy, create an empty public repository (no README, .gitignore or licence).
2. Upload the contents of this folder. Either drag the files into the GitHub web page ("uploading an existing file"), or from a terminal:
   ```sh
   cd bpre-roster
   git init -b main
   git add -A
   git commit -m "Initial release"
   git remote add origin https://github.com/justadude-g/bpre-roster.git
   git push -u origin main
   ```
3. In the repository go to **Settings → Pages**. Under "Build and deployment" choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save. The site is live a minute or two later.
4. Open `data/data.js`, set `repoUrl` to your repository's URL and commit. The app then links people to the issue form when they spot a mistake.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The page |
| `css/style.css` | Styles, including dark mode and a print layout |
| `js/app.js` | App logic. Plain JavaScript, no build step |
| `data/data.js` | **All game data**: game types, points presets, factions, units, cards |
| `tools/validate-data.mjs` | Checks the data file for mistakes |
| `tools/build-single.mjs` | Rebuilds `dist/bpre-force-builder.html` |
| `dist/bpre-force-builder.html` | Single-file offline copy |

## Help fill in the data

Everything game-specific lives in `data/data.js`, taken from the unit and card pages of the Core, Phase Line and Spearhead books. To fix a value or add something, edit that file and open a pull request, or open a **Data correction** issue with the page number from your rulebook. [CONTRIBUTING.md](CONTRIBUTING.md) lists every field.

After editing, run:

```sh
node tools/validate-data.mjs
node tools/build-single.mjs
```

The first catches typos and broken references. The second refreshes the offline copy.

Each card has a `text` field that the app shows when a player taps **Full effect**. It currently holds a plain-English explanation of what the card does. Maintainers with Echelon Software's permission can replace it with the official card wording.

## Permission and credits

A community tool for the Black Powder Red Earth Patreon, made with permission from Echelon Software. Black Powder Red Earth and all related names and marks belong to Echelon Software. Buy the game: [blackpowderredearth.com](https://blackpowderredearth.com/).

## Licence

Code is MIT licensed. See [LICENSE](LICENSE).
