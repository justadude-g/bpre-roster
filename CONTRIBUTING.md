# Contributing data

All game data is in `data/data.js`. Edit it in any text editor, or on GitHub with the pencil icon.

Before you open a pull request, run `node tools/validate-data.mjs`. It must print `Data OK.`

## Ground rules

- Include the source: book and page number, or card name and set.
- Keep `notes` to a short summary, under about 100 characters. The full effect goes in a card's `text` field.
- Only add official card or rules wording if you are a maintainer covered by Echelon Software's permission.
- An `id` is lowercase with hyphens (`cts-recce-raider`), unique and never renamed. Saved forces and share links refer to it.

## Game types (`modes`)

| Field | Meaning |
| --- | --- |
| `id`, `name`, `blurb` | Identifier, display name, one-line description |
| `presets` | Kill team CP limits offered, each `{ points, label }`. The label names the taskings that use it. Players can also type a custom limit |
| `defaultPoints` | Which preset is picked first |
| `unitSets` | Sets whose units can be taken. Every game type currently allows all three |
| `deployments` | Extra CP pools, each `{ id, name, points, note, optional }`. Phase Line uses these for reinforcements; Spearhead uses an optional one for the Specialist Reserve |
| `fireSlots` | Phase Line Fires placements, each `{ id, name }`. One card per slot |
| `qrf` | `false` where the Quick Reaction Force is not allowed |
| `interventionLimit` | Size of the Intervention hand (unique cards) |

The top-level `qrf` object sets the QRF discount and minimum cost.

## Factions (`factions`)

| Field | Meaning |
| --- | --- |
| `id`, `name`, `subtitle` | Identifier, display name, short line under it |
| `bloc` | Cold Harbor bloc or Hongbin bloc. Used to group the faction buttons |
| `allies` | Factions that can field alongside this one. A force is one faction plus at most one ally |
| `note` | Optional restriction shown to the player |
| `emblem` | Square image in `assets/factions/`, about 192 px |
| `tagline`, `lore` | Shown on the Factions page |

The top-level `incompatible` list holds faction pairs that can never be in one force, such as `["spear", "aayari"]`. It overrides `allies`.

## Quick reference (`data/reference.js`)

Sections of rules, each `{ id, title, kicker, lead, number, items: [{ term, text }] }`. `number` marks the three phases. The same file holds the war summary, the bloc layout and the hard restriction shown on the Factions page.

## Units (`units`)

| Field | Meaning |
| --- | --- |
| `id`, `name` | Identifier and display name |
| `faction`, `set` | Faction id, and `core`, `phaseline` or `spearhead` |
| `cost` | Capability Value in CP |
| `move` | Movement range in inches |
| `perPoints` | At most one per this many CP of warfighting units in the same deployment (e.g. `100`) |
| `fires` | Fires cards the unit adds to the hand, e.g. `[{ "card": "fires-scoria-rs", "count": 1 }]` |
| `options` | Upgrade ids from `options` |
| `notes` | Short list of ability names |

## Ratios (`ratios`)

Force-wide limits such as "every Muhtasib permits four Shurta": `{ id, label, members, per, max }`. The units in `members` together may not exceed `max` for each unit in `per`.

## Upgrades (`options`)

`{ id, name, cost, modes, notes }`. `modes` limits the game types that offer it. Attach an upgrade to a unit by listing its id in the unit's `options`.

## Cards (`cards`)

| Field | Meaning |
| --- | --- |
| `id`, `name` | Identifier and display name |
| `type` | `intervention`, `special` (Special Intervention) or `fires` |
| `set` | `core`, `phaseline` or `spearhead` |
| `factions` | The card shows that faction's emblem, so only a force with that faction can use it |
| `granted` | Fires cards that only come from units. They are added automatically, never picked |
| `slot` | Phase Line Fires, placed at a phase line |
| `subtype` | Label shown on the card |
| `notes` | Short summary shown on the card |
| `text` | Full effect, shown when the player taps **Full effect** |
