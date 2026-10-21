/*
 * BPRE Force Builder game data.
 *
 * This is the only file you need to edit to add units, fix points or add cards.
 * See CONTRIBUTING.md for the field reference. Run `node tools/validate-data.mjs`
 * after editing to catch typos and broken references.
 *
 * Sources: Core Rules (Unforgiving Close Combat) unit and card pages 68-81,
 * Phase Line Expansion pages 30-42, Spearhead Expansion pages 70-77, and the
 * rules quick reference.
 *
 * Keep card and unit text to names and short summaries. Do not paste full
 * rules text from the books or cards into this file.
 */
window.BPRE_DATA = {
  version: "0.8.0",
  pointsLabel: "CP",
  // Set this to your GitHub repo URL so the app can link to issues.
  repoUrl: "https://github.com/justadude-g/bpre-roster",

  sets: [
    { id: "core", name: "Core Set", short: "Core" },
    { id: "phaseline", name: "Phase Line", short: "PL" },
    { id: "spearhead", name: "Spearhead", short: "SH" }
  ],

  // Game types.
  //   presets:      points limits offered for the main kill team, with the taskings that use them
  //   unitSets:     which sets' units can be taken (every unit works in every game type)
  //   deployments:  extra CP pools on top of the main kill team
  //   fireSlots:    Phase Line Fires placements (one card per slot); optional ones get a toggle
  //   deployments:  reserve: true skips the 1-per-100 and ratio limits; allowedUnits limits what it can hold
  //   qrf:          false where the Quick Reaction Force is not allowed
  //   interventionLimit: size of the Intervention hand (unique cards)
  modes: [
    {
      id: "core",
      name: "Core Set",
      blurb: "Night Raids from the core rulebook. Turn limit 7.",
      presets: [
        { points: 150, label: "Standard taskings" },
        { points: 180, label: "Carcass Wraith, defender" },
        { points: 200, label: "Carcass Wraith, assaulter" }
      ],
      defaultPoints: 150,
      unitSets: ["core", "phaseline", "spearhead"],
      deployments: [],
      interventionLimit: 3,
      verified: true
    },
    {
      id: "phaseline",
      name: "Phase Line",
      blurb: "Multi-storey close combat. Reinforcements arrive as each phase line falls. Turn limit 14.",
      presets: [
        { points: 200, label: "Initial deployment" }
      ],
      defaultPoints: 200,
      unitSets: ["core", "phaseline", "spearhead"],
      deployments: [
        { id: "pl1", name: "Phase Line 1", points: 150, note: "Deploys when Phase Line 1 is breached." },
        { id: "pl2", name: "Phase Line 2", points: 150, note: "Deploys when Phase Line 2 is breached." }
      ],
      // Each player places one Phase Line Fires card face down at each phase line.
      fireSlots: [
        { id: "pl1", name: "Phase Line 1", short: "PL 1" },
        { id: "pl2", name: "Phase Line 2", short: "PL 2" }
      ],
      qrf: false,
      interventionLimit: 3,
      verified: true
    },
    {
      id: "spearhead",
      name: "Spearhead",
      blurb: "Final phase of the Awbari Civil War. Turn limit 10.",
      presets: [
        { points: 200, label: "Combat Patrol" },
        { points: 350, label: "Fighting Position, Command Net, Forward Observer Post, ESM Site" }
      ],
      defaultPoints: 350,
      unitSets: ["core", "phaseline", "spearhead"],
      deployments: [
        {
          id: "reserve", name: "Specialist Reserve", points: 350, optional: true, reserve: true,
          note: "Campaign only. Specialist classes bought at the start of a Spearhead campaign; losses come off the Record Sheet.",
          allowedUnits: ["cts-advisor", "cts-auto-rifleman-hvy", "cts-assault-grenadier", "cts-assault-tech", "nitto-sysop", "aa-shurta-pkm", "hb-enabler", "hb-merc-grenadier", "hb-pkm-gunner", "spear-sysop", "spear-marksman"]
        }
      ],
      fireSlots: [
        { id: "fop", name: "Held Phase Line Fires", short: "Hold", optional: true, note: "Forward Observer Post tasking: each player holds one Phase Line Fires card." }
      ],
      interventionLimit: 3,
      verified: true
    }
  ],

  // Quick Reaction Force (core rules): the defending player can set aside part
  // of the kill team's CP. QRF units cost 5 CP less, to a minimum of 5.
  qrf: { discount: 5, minimum: 5 },

  // Factions. allies: factions that can field alongside this one.
  // A force is one faction plus at most one ally.
  //   emblem:  square image shown on buttons, cards and the Factions page
  //   tagline, lore: shown on the Factions page
  factions: [
    {
      id: "cts", name: "Crisis Troop Scorch", subtitle: "Cold Harbor contractors", bloc: "Cold Harbor bloc", allies: ["nitto"],
      emblem: "assets/factions/cts.png",
      tagline: "Western special operations contractors",
      lore: "Cold Harbor's contract kill teams, forward deployed from combat outposts Torch and White Birch either side of Jadid. Special Purpose Force 6 embeds with client forces inside the city, advising on internal defence and running protection details for ministry officials. Night raids, dead checks, no prisoners."
    },
    {
      id: "nitto", name: "00 Unit Nitto", subtitle: "Awbari Border Protection", bloc: "Cold Harbor bloc", allies: ["cts"],
      emblem: "assets/factions/nitto.png",
      tagline: "State strike unit, indiscriminate and extrajudicial",
      lore: "A national strike unit answering to the Awbari National Directorate of Intelligence, built to pursue and interdict extremists crossing from Qasra. It opened its account in 2025 at the Awbari holding centre, where rather than retake a compound full of dead hostages the team leader dropped it with thermobaric UAS."
    },
    {
      id: "hongbin", name: "Hongbin", subtitle: "Kinetic Forces / Alloy Security", bloc: "Hongbin bloc", allies: ["aayari", "spear"],
      emblem: "assets/factions/hongbin.png",
      tagline: "Corporate mercenaries, in it for the margin",
      lore: "Officially protection officers guarding company sites and assets. In practice a battalion of PLAN marine veterans and North Korean special operations personnel, leased to Chinese foreign intelligence, running a ground force of Syrian mercenaries. Calculating, profitable, and content to spend proxy lives to protect its own."
    },
    {
      id: "aayari", name: "Aayari Network", subtitle: "The Aayar Guard", bloc: "Hongbin bloc", allies: ["hongbin"],
      emblem: "assets/factions/aayari.png",
      tagline: "Jihadist network fighting as Hongbin's proxy",
      lore: "Drawn from the secret police and republican guards of the pre-Arab Spring order, the Network supplies Hongbin with bodies. Muhtasib sappers storm positions and detonate their vests on the survivors; Shurta screen the advance and are spent freely. Hongbin sends them into close combat with Scorch teams and shoots from cover behind them."
    },
    {
      id: "spear", name: "SPEAR Brigade", subtitle: "Qasran special mission unit", bloc: "Hongbin bloc", allies: ["hongbin"],
      emblem: "assets/factions/spear.png",
      tagline: "Qasran marauders with electronic warfare",
      lore: "Recruited only from commandos and special forces and built as infiltration marauders. Backpack cognitive jammers classify enemy emitters on the fly and can hijack a remote pilot's signal outright, blinding opposing drones. SPEAR isolates an area, works it over with kinetic UAS swarms, then walks a kill team onto the objective.",
      note: "SPEAR and the Aayari Network never share a battlespace. If one earns reinforcements, the other can only come on once the first is wiped out."
    }
  ],

  // Factions that can never be in the same force, whatever the allies lists say.
  incompatible: [
    ["spear", "aayari"]
  ],

  // Units.
  //   cost:      Capability Value in CP
  //   move:      movement range in inches
  //   perPoints: at most one per this many CP of warfighting units in the same deployment
  //   fires:     Fires cards the unit adds to the hand when first positioned
  //   options:   ids from `options` below that this unit can take
  units: [
    // Crisis Troop Scorch
    { id: "cts-advisor", faction: "cts", set: "core", name: "Operational Advisor", cost: 50, move: 6, perPoints: 100, fires: [{ card: "fires-scoria-rs", count: 1 }], options: ["respirator"], notes: "Kinetic ISR, Glint, Frag." },
    { id: "cts-assaulter", faction: "cts", set: "core", name: "Assaulter", cost: 20, move: 6, options: ["respirator"], notes: "Frag." },
    { id: "cts-auto-rifleman", faction: "cts", set: "core", name: "Automatic Rifleman", cost: 40, move: 6, perPoints: 100, options: ["respirator"], notes: "LAMG, Bipod." },
    { id: "cts-recce", faction: "cts", set: "core", name: "Recce", cost: 30, move: 8, options: ["respirator"], notes: "Doorkicker, Initiative, Pointman." },
    { id: "cts-recce-raider", faction: "cts", set: "phaseline", name: "Recce Raider", cost: 30, move: 8, options: ["forward-deployed", "respirator"], notes: "CQB 5D10. Doorkicker, Initiative, CQB." },
    { id: "cts-assault-grenadier", faction: "cts", set: "phaseline", name: "Assault Grenadier", cost: 40, move: 6, perPoints: 100, options: ["respirator"], notes: "Grenadier Front." },
    { id: "cts-auto-rifleman-hvy", faction: "cts", set: "phaseline", name: "Automatic Rifleman HVY", cost: 50, move: 6, perPoints: 100, options: ["respirator"], notes: "Base of Fire, Bipod, Fire for Effect." },
    { id: "cts-assault-tech", faction: "cts", set: "spearhead", name: "Assault Tech", cost: 60, move: 6, perPoints: 100, fires: [{ card: "fires-scoria-rs", count: 1 }], options: ["respirator"], notes: "Kinetic ISR, Glint, Swarm Controller, Cognitive Jammers." },

    // 00 Unit Nitto
    { id: "nitto-sysop", faction: "nitto", set: "spearhead", name: "Systems Operator", cost: 50, move: 8, perPoints: 100, fires: [{ card: "fires-quadrotor", count: 2 }], notes: "Quadrotor, Glint, Multiplier, Unflinching." },
    { id: "nitto-rifleman", faction: "nitto", set: "spearhead", name: "Rifleman", cost: 30, move: 8, notes: "Sustained Fire, Frag, Unflinching." },
    { id: "nitto-pointman", faction: "nitto", set: "spearhead", name: "Pointman", cost: 30, move: 8, notes: "Doorkicker, Breacher, Unflinching." },

    // Hongbin
    { id: "hb-enabler", faction: "hongbin", set: "core", name: "Enabler", cost: 40, move: 6, perPoints: 100, fires: [{ card: "fires-fenghuang-918", count: 2 }], options: ["respirator"], notes: "Kinetic ISR, Glint, Frag." },
    { id: "hb-merc", faction: "hongbin", set: "core", name: "Merc", cost: 20, move: 6, options: ["respirator"], notes: "RPK, Bipod, Frag." },
    { id: "hb-merc-grenadier", faction: "hongbin", set: "phaseline", name: "Merc Grenadier", cost: 20, move: 6, perPoints: 100, options: ["respirator"], notes: "Grenadier Direct Fire, Frag." },
    { id: "hb-pkm-gunner", faction: "hongbin", set: "spearhead", name: "PKM Gunner", cost: 65, move: 5, perPoints: 100, options: ["respirator"], notes: "PKM Professional, Bipod, Fire for Effect." },

    // Aayari Network
    { id: "aa-muhtasib", faction: "aayari", set: "core", name: "Guard Muhtasib", cost: 15, move: 6, notes: "S-Vest, Frag." },
    { id: "aa-shurta", faction: "aayari", set: "core", name: "Guard Shurta", cost: 5, move: 6, notes: "Non-Professional. No save roll." },
    { id: "aa-muhtasib-sapper", faction: "aayari", set: "phaseline", name: "Muhtasib Sapper", cost: 25, move: 8, notes: "CQB 5D10. S-Vest, Doorkicker, CQB." },
    { id: "aa-shurta-pkm", faction: "aayari", set: "phaseline", name: "Shurta PKM Gunner", cost: 45, move: 4, perPoints: 100, notes: "PKM, Bipod, Fire for Effect. No save roll." },
    { id: "aa-assistant-pkm", faction: "aayari", set: "phaseline", name: "Assistant PKM Gunner", cost: 5, move: 6, notes: "Non-Professional, Crew Served. No save roll." },

    // SPEAR Brigade
    { id: "spear-sysop", faction: "spear", set: "spearhead", name: "Systems Operator", cost: 50, move: 6, perPoints: 100, fires: [{ card: "fires-quadrotor", count: 2 }], notes: "Quadrotor, Swarm Controller, Cognitive Jammers, Laser Detector. Respirator standard." },
    { id: "spear-marksman", faction: "spear", set: "spearhead", name: "Marksman", cost: 35, move: 6, notes: "Marksman, Supported Fire, Laser Detector. Respirator standard." },
    { id: "spear-assaulter", faction: "spear", set: "spearhead", name: "Assaulter", cost: 20, move: 8, notes: "Breacher, Frag, Laser Detector. Respirator standard." }
  ],

  // Force-wide ratios. Units in `members` together may not exceed `max` for
  // each unit in `per`.
  ratios: [
    {
      id: "shurta",
      label: "Every Muhtasib permits four Shurta",
      members: ["aa-shurta", "aa-shurta-pkm", "aa-assistant-pkm"],
      per: ["aa-muhtasib", "aa-muhtasib-sapper"],
      max: 4
    }
  ],

  // Paid upgrades a unit can take. modes limits where the option is offered.
  options: [
    { id: "respirator", name: "Respirator", cost: 5, modes: ["phaseline", "spearhead"], notes: "+7 on chlorine rolls. Standard for SPEAR; not available to Nitto or Aayari Network." },
    { id: "forward-deployed", name: "Forward Deployed", cost: 5, modes: ["phaseline"], notes: "Deploy up to 13\" closer to the opponent's edge in Phase Line taskings." }
  ],

  // Cards. type is "intervention", "special" (Special Intervention) or "fires".
  //   factions:  card shows that faction's emblem, so only that faction can use it
  //   granted:   true for Fires cards that only come from units (not picked)
  //   slot:      true for Phase Line Fires, placed at a phase line
  //   subtype:   label shown on the card
  //   text:      what the card does, in our own words (not the printed card text)
  cards: [
    // Core Set Fires (granted by units)
    { id: "fires-scoria-rs", type: "fires", set: "core", name: "Scoria RS", factions: ["cts"], granted: true, notes: "Thermobaric loitering munition, 3\" radius.", text: "Called down with Glint. Explodes with a 3\" radius around the target point or unit. Every unit inside is killed or rolls a save. Single use." },
    { id: "fires-fenghuang-918", type: "fires", set: "core", name: "FengHuang-918 UAS", factions: ["hongbin"], granted: true, notes: "Single-target loitering munition.", text: "Called down with Glint on a single unit. Roll 2D10. On 7 or less it goes astray: pick one of your own units within 2\" of the target, which is killed or rolls a save (nothing happens if none is there). On 8 or more it hits the target, which saves at +1 if it has a save; a target with no save rolls 2D10 and dies on anything under 18." },
    // Spearhead Fires (granted by units)
    { id: "fires-quadrotor", type: "fires", set: "spearhead", name: "Quadrotor", granted: true, notes: "2\" radius.", text: "Called down with Glint or a Swarm Controller. Explodes with a 2\" radius around the target point or unit; every unit inside is killed or rolls a save. Once used, it is gone for the rest of the Night Raid." },

    // Phase Line Fires
    { id: "plf-sensor-fuzed", type: "fires", set: "phaseline", subtype: "Phase Line Fires", slot: true, name: "Sensor Fuzed Munition", factions: ["cts"], notes: "Two 3\" target points.", text: "Pick two target points. Roll 2D10 for one exterior unit whose base is at least partly within 3\" of them; on 5 or more it dies outright with no save. Then two 2\" explosions land, each scattering up to 3\" from its target point using the Radial Template. Gone for the rest of the Night Raid." },
    { id: "plf-hesh", type: "fires", set: "phaseline", subtype: "Phase Line Fires", slot: true, name: "HESH Rounds", factions: ["aayari"], notes: "Hits one structure.", text: "Pick one structure. Every unit inside it or within 2\" of it is killed or rolls a save. Survivors on upper storeys drop to the first storey, repositioned by their owner only if they would end up inside a wall. Mark the structure with a face-down Tactical Exploitation token: for the rest of the tasking its inside walls are waist-high cover, its stairwells are impassable full-height walls, and all its doors are destroyed. Gone for the rest of the Night Raid." },
    { id: "plf-drone-swarm", type: "fires", set: "phaseline", subtype: "Phase Line Fires", slot: true, name: "Drone Swarm", notes: "Two 3\" explosions.", text: "Pick two target points and scatter each with the Radial Template, then resolve two 3\" explosions at each point. Gone for the rest of the Night Raid." },
    { id: "plf-chlorine", type: "fires", set: "phaseline", subtype: "Phase Line Fires", slot: true, name: "Chlorine Gas", notes: "Chemical exposure for every unit.", text: "Every unit on the battlespace rolls 2D10 for exposure. 2 to 8: the unit dies, no save. 9 to 17: it takes an exposure token (use a face-down ACT chit). 18 or more: no effect. Each exposure token gives -2\" movement and -2 to attack and save rolls, to a minimum of 0. A respirator adds +7 to the exposure roll. Gone for the rest of the Night Raid." },
    { id: "plf-gps-mortars", type: "fires", set: "phaseline", subtype: "Phase Line Fires", slot: true, name: "GPS-Guided Mortars", notes: "Seven frag tokens.", text: "Place seven Frag tokens on exterior points anywhere on the battlespace, then roll straight away to scatter each one and resolve a 2\" explosion for each. Gone for the rest of the Night Raid." },

    // Core Set Intervention
    { id: "int-lift-and-shift", type: "intervention", set: "core", name: "Lift and Shift", notes: "Activate a unit that already has an ACT chit.", text: "Use when you pick a unit to activate in the Maneuver Phase. Discard it to activate a unit that already has an ACT chit. That unit can move no more than 4\" and cannot attack this activation." },
    { id: "int-full-send", type: "intervention", set: "core", name: "Full Send", notes: "Attack again after a miss.", text: "Discard before rolling an attack against an enemy unit. If the attack misses, attack again." },
    { id: "int-save-last-bullet", type: "intervention", set: "core", name: "Save the Last Bullet", notes: "A killed unit attacks its killer.", text: "Use when one of your units is killed by an enemy unit it has line of sight to. Discard it and the dying unit makes one attack against its killer before it is removed." },
    { id: "int-kill-not-capture", type: "intervention", set: "core", name: "Kill, Not Capture", notes: "+3 to one attack roll.", text: "Discard before rolling an attack. Add 3 to the result of one attack roll." },
    { id: "int-hasty-ambush", type: "intervention", set: "core", name: "Hasty Ambush", notes: "+1 to one attack roll.", text: "Discard after attacking with a unit. Add 1 to the result of one of its attack rolls." },
    { id: "int-break-contact", type: "intervention", set: "core", name: "Break Contact", notes: "+2 to a failed save in obstructed LOS.", text: "Use after one of your units in obstructed line of sight from its attacker fails a save. Discard it to add 2 to the save roll." },
    { id: "int-bat-country", type: "intervention", set: "core", name: "This Is Bat Country", notes: "Move 3\" in the Finishing Phase.", text: "Use when picking a unit to activate in the Finishing Phase. Discard it to activate a unit that would not otherwise be eligible. The unit cannot attack but can move up to 3\", then loses an ACT chit." },
    { id: "int-frag-out", type: "intervention", set: "core", name: "Frag Out", notes: "Throw a frag in the Maneuver Phase.", text: "Use when activating a unit with the Frag attribute in the Maneuver Phase. Discard it to place a Frag chit within 10\" of the unit and in its line of sight. The unit cannot move or attack, and takes an ACT chit." },
    { id: "int-door-is-yours", type: "intervention", set: "core", name: "The Door Is Yours", notes: "Free door interaction.", text: "Discard when a unit opens or closes a door. The unit takes no movement penalty for the door." },
    { id: "int-pile-little-arms", type: "intervention", set: "core", name: "Pile of Little Arms", notes: "Ignore a stagger result.", text: "Discard when one of your units rolls a stagger result on a save. The unit stays alive and is not staggered." },
    { id: "int-ambush", type: "intervention", set: "core", name: "Ambush", factions: ["aayari"], notes: "S-Vest unit maneuvers and detonates.", text: "Use when picking a unit to activate in the Direct Fire Phase. Discard it to activate a unit with the S-Vest attribute. It cannot attack, can maneuver up to 6\", and must detonate its vest this activation. Enemy units without ACT chits may take Immediate Actions against it, but each one that does takes an ACT chit." },
    { id: "int-front-towards-enemy", type: "intervention", set: "core", name: "Front Towards Enemy", factions: ["aayari"], notes: "S-Vest detonates on a failed save.", text: "Discard before a unit with the S-Vest attribute makes a save roll. If the save fails, the unit detonates." },
    { id: "int-fire-for-effect", type: "intervention", set: "core", name: "Fire for Effect", factions: ["cts"], notes: "Three Finishing Phase attacks.", text: "Discard when activating a unit in the Finishing Phase. It attacks up to three eligible targets instead of one." },
    { id: "int-react-to-contact", type: "intervention", set: "core", name: "React to Contact", factions: ["cts"], notes: "Attack again after failing to kill.", text: "Discard after an attack fails to kill its target. The unit attacks again." },

    // Phase Line Intervention
    { id: "int-troops-in-contact", type: "intervention", set: "phaseline", name: "Troops in Contact", notes: "Immediate Action with an ACT chit.", text: "Play in the Maneuver Phase when one of your units that already has an ACT chit has line of sight to the active enemy unit. Your unit can take an Immediate Action anyway. Then discard." },
    { id: "int-shoot-first", type: "intervention", set: "phaseline", name: "Shoot First, Hit First", notes: "Pre-empt an Immediate Action.", text: "Play when your opponent declares an Immediate Action against your unit before it has attacked in a Maneuver Phase activation. Every Immediate Action against your active unit is cancelled and those enemy units do not take ACT chits. Your unit must immediately attack (or fire a grenade, for an Assault Grenadier) the enemy unit that tried it. Your unit's activation then ends with no further action from either unit. Then discard." },
    { id: "int-fix-and-finish", type: "intervention", set: "phaseline", name: "Fix and Finish", notes: "Attack a staggered unit again.", text: "Play when an enemy unit you hit rolls a stagger result. Attack that unit again. Then discard." },
    { id: "int-time-table", type: "intervention", set: "phaseline", name: "Time Table", notes: "Move the turn counter one turn.", text: "Play in the Direct Fire Phase before any unit has activated. Move the turn counter one turn forward or back. Then discard." },
    { id: "int-course-of-action", type: "intervention", set: "phaseline", name: "Course of Action", notes: "Smother a frag token.", text: "While active in the Maneuver Phase, a unit can move onto a Frag token whose centre is within its movement range. The unit is killed at once and the Frag token is removed. Then discard." },
    { id: "int-return-to-sender", type: "intervention", set: "phaseline", name: "Return to Sender", notes: "Relocate a frag chit.", text: "Play when one of your units moves onto a Frag chit in the Maneuver Phase. Move the chit to any point in the unit's line of sight up to 3\" away. It then works as normal, exploding with dispersion at the start of the Finishing Phase. Then discard." },
    { id: "int-hell-for-heroes", type: "intervention", set: "phaseline", name: "Hell Is for Heroes", notes: "Charge a frag chit.", text: "Play when one of your units moves onto a Frag chit in the Maneuver Phase. The unit can no longer attack this activation, but can maneuver up to 4\" whatever it has already moved, and must explode with a 2\" radius when the activation ends, even if an Immediate Action kills it first. Then discard." },
    { id: "int-target-of-opportunity", type: "intervention", set: "phaseline", name: "Target of Opportunity", notes: "Attack twice this activation.", text: "Play when one of your units activates in the Maneuver Phase. It can attack twice this activation, but cannot attack again for the rest of the turn, including Finishing attacks and attacks from Intervention cards. Discard at the end of the activation." },
    { id: "int-defilade", type: "intervention", set: "phaseline", name: "Defilade", notes: "Penalise a Direct Fire attack.", text: "Play when an enemy declares an obstructed line-of-sight attack on one of your units in the Direct Fire Phase. The attacker loses the Direct Fire +1 and takes -2 instead. Discard once the attack is resolved." },
    { id: "int-3-second-rule", type: "intervention", set: "phaseline", name: "3 Second Rule", notes: "Unstagger an adjacent friendly.", text: "Play when a friendly unit is active in the Maneuver Phase, has not attacked yet, and is touching a staggered friendly unit. The staggered unit stands back up, both units take ACT chits, and the active unit's activation ends. Then discard." },

    // Core Set Special Intervention (earned, not chosen at muster).
    // Names from the core rulebook's card list; faction emblems not yet checked.
    { id: "sint-wide-band-jammers", type: "special", set: "core", name: "Wide-Band Jammers" },
    { id: "sint-seize-initiative", type: "special", set: "core", name: "Seize the Initiative" },
    { id: "sint-hongbin-jammers", type: "special", set: "core", name: "Hongbin Jammers" },
    { id: "sint-violence-of-action", type: "special", set: "core", name: "Violence of Action" },
    { id: "sint-set-support-element", type: "special", set: "core", name: "Set Support Element" },
    { id: "sint-go-pills", type: "special", set: "core", name: "Go Pills" },
    { id: "sint-tunnel-rats", type: "special", set: "core", name: "Tunnel Rats" },
    { id: "sint-timeline", type: "special", set: "core", name: "Timeline" },
    { id: "sint-courtesy-burn", type: "special", set: "core", name: "Courtesy Burn" },
    { id: "sint-give-peace-a-chance", type: "special", set: "core", name: "Give Peace a Chance" },
    { id: "sint-killing-is-my-business", type: "special", set: "core", name: "Killing Is My Business" }
  ]
};
