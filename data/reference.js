/*
 * Quick Reference and Faction Reference content.
 *
 * Plain-English summaries of the core rules with Phase Line and Spearhead.
 * Edit freely; the app renders whatever is here. Each section has a title,
 * an optional kicker line, and items of { term, text }.
 */
window.BPRE_REFERENCE = {
  turnLimits: [
    { mode: "core", label: "Night Raid", turns: 7 },
    { mode: "spearhead", label: "Spearhead Tasking", turns: 10 },
    { mode: "phaseline", label: "Phase Line Tasking", turns: 14 }
  ],

  phases: ["Direct Fire", "Maneuver", "Finishing", "Cleanup"],

  sections: [
    {
      id: "activation",
      title: "Activation",
      kicker: "How a turn is played",
      items: [
        { term: "Alternating activation", text: "Players alternate one unit at a time, assaulting player first." },
        { term: "ACT chits", text: "An activating unit takes an ACT chit and cannot activate again that phase." },
        { term: "Passing is final", text: "Once you hand control over you cannot take it back. Immediate Actions are still allowed." },
        { term: "The phase ends when", text: "Neither player wants to activate or has an eligible unit, or someone has won." }
      ]
    },
    {
      id: "direct-fire",
      number: 1,
      title: "Direct Fire Phase",
      kicker: "Static, accurate shooting",
      lead: "The activated unit cannot move or rotate. It picks a target in line of sight and shoots.",
      items: [
        { term: "+1 to every roll", text: "Any attack made in this phase gets +1, including attacks granted by Intervention cards." },
        { term: "Grenades", text: "Throw up to 10\" at a point in line of sight. The grenade sits as a Frag chit and detonates in the Finishing Phase." },
        { term: "Other actions", text: "Setting explosives and most mission actions happen here, even for units with no line of sight." },
        { term: "QRF", text: "From turn 3 the defender rolls for Quick Reaction Force activation at the start of this phase, before any actions. Both players roll 2D10; on turns 5 and 6 the assaulting player rolls only 1D10. From turn 7 the QRF can no longer activate." }
      ]
    },
    {
      id: "maneuver",
      number: 2,
      title: "Maneuver Phase",
      kicker: "Movement, and the risk that comes with it",
      lead: "The activated unit moves up to its movement range from the centre of its base, rotating freely, and may attack at any point during the move.",
      items: [
        { term: "Immediate Actions", text: "Enter or start in the line of sight of an opponent with no ACT chit and that unit may shoot you first, at -3. It then takes an ACT chit. Any number of units may respond; none have to." },
        { term: "Crossing cover", text: "Once per activation a unit may cross one waist-high feature up to 2\" long. Roll 2D10: 10+ keeps moving; 9 or less staggers it on the far side and ends the activation. No attacking mid-crossing." },
        { term: "Doors", text: "Opening or closing a door costs 3\" of movement, or is free for an active unit already next to it." },
        { term: "Glint", text: "Units with Glint (Advisors, Enablers, Systems Operators, Assault Techs) may call down a Fires card once per turn on an exterior point in line of sight, without interrupting their move or shot." }
      ]
    },
    {
      id: "finishing",
      number: 3,
      title: "Finishing Phase",
      kicker: "Grenades land and the knife-fighting starts",
      lead: "Resolve in order. Here the ACT chit works backwards: a unit spends its chit to attack, and no chit means it is done.",
      items: [
        { term: "1. Frag chits", text: "Centre the template on each chit, roll 1D10 to bounce it along the 2\" increment, then detonate with a 2\" area of effect. A wall between chit and landing point keeps the blast on the chit's side." },
        { term: "2. Reset chits", text: "Give every unit on the battlespace exactly one ACT chit, whatever it had before." },
        { term: "3. Finishing attacks", text: "Alternate from the assaulting player. Activate a unit with an opponent in line of sight within 3\" and attack. The unit loses its chit." },
        { term: "Base to base", text: "A unit touching an opponent's base inside its own line of sight must attack that opponent, and keeps its chit. Fighting continues until no bases are touching." }
      ]
    },
    {
      id: "cleanup",
      title: "Cleanup and new turn",
      kicker: "Reset for the next turn",
      lead: "Remove every remaining ACT chit. Stand staggered units back up, facing wherever their player prefers, and advance the turn counter.",
      items: []
    },
    {
      id: "attacking",
      title: "Attacking",
      kicker: "2D10 against the unit card",
      items: [
        { term: "Roll", text: "2D10 against the marksmanship line on the unit card." },
        { term: "Good effect", text: "The target is killed outright, or rolls a save if its card gives one." },
        { term: "Save fails", text: "The target is killed and removed." },
        { term: "Save succeeds", text: "The target is staggered. Lay the model on its side." },
        { term: "20+ to attack", text: "Headshot. Killed immediately, no save roll." },
        { term: "20+ to save", text: "Completely unaffected. Treat it as a miss." },
        { term: "Staggered", text: "Cannot activate for the rest of the turn and auto-fails every save until the turn ends. It stands back up in cleanup." }
      ]
    },
    {
      id: "los",
      title: "Line of sight",
      kicker: "Base to base centre",
      items: [
        { term: "Direct", text: "An uninterrupted line from any part of the attacker's base to the centre of the target's base." },
        { term: "Obstructed", text: "A direct line that passes through waist-high cover, windows included." },
        { term: "Friendly units", text: "Never block line of sight. Opponent units do." },
        { term: "Own cover", text: "Waist-high cover touching the attacker's base is ignored when it attacks." },
        { term: "Doors", text: "Closed doors block line of sight; open ones do not. An inactive unit standing in an open doorway blocks both movement and sight." }
      ]
    },
    {
      id: "explosions",
      title: "Explosions",
      kicker: "Radius from the centre of the blast",
      items: [
        { term: "Who is caught", text: "A unit is affected only if a line runs from the centre of the blast to any part of its base without leaving the area of effect." },
        { term: "Cover helps", text: "Units with a save get +1 to saves against explosions in obstructed line of sight." },
        { term: "Doors", text: "Any door inside the radius is destroyed and the blast carries on through the gap." }
      ]
    },
    {
      id: "expansions",
      title: "Phase Line and Spearhead rules",
      kicker: "Expansion additions",
      items: [
        { term: "CQB results", text: "Roll 5D10 and read the dice individually. Five hits is a headshot that overrides any save; three or four is a normal hit; two staggers with no save; one or none does nothing. The whole roll is one attack, so the attacker shares modifiers across the dice after rolling. Shooting up costs -1 per storey." },
        { term: "Stairwells", text: "A unit in a stairwell is visible from both storeys and blocks movement for both sides. Enter and leave only where a step meets a floor. A unit inside takes -1 on saves." },
        { term: "Double activation", text: "CTS Automatic Riflemen and HVY, and Hongbin and Aayari PKM gunners, may take two ACT tokens a turn. Both must come from Direct Fire or Immediate Actions; a unit that activated in the Maneuver Phase cannot take the second, and only one Immediate Action per opponent activation." },
        { term: "Grenadiers", text: "Firing a grenade replaces the unit's attack and bursts 2\" across, 180 degrees off a wall or 360 degrees from a point. CTS Assault Grenadiers fire in Direct Fire or Maneuver; Hongbin Merc Grenadiers only in Direct Fire." },
        { term: "Respirators", text: "Standard for SPEAR, +5 CP each for CTS and Hongbin, unavailable to Nitto and the Aayari Network. A respirator gives +7 on the chlorine roll." },
        { term: "Phase Line Fires", text: "Each player places one face down at Phase Line One and Phase Line Two. They resolve the moment an assaulting warfighter's base touches the line. A player may skip theirs and take two unique Special Intervention cards instead." }
      ]
    }
  ],

  war: "Qasra, a former British colony and long-standing NATO partner, was run as a military dictatorship until the 2012 elections handed power to a Salafist party. Hydrocarbon money kept it afloat. Its move on neighbouring Sanhaja was sold as stabilisation; the real prize was several trillion dollars of lithium and rare earths. Fighting now runs along the Qasra-Awbari border and through the Jadid Salient, where Cold Harbor contractors, Chinese corporate mercenaries and a jihadist network are all operating inside the same few square kilometres.",

  blocs: [
    { name: "Cold Harbor bloc", factions: ["cts", "nitto"], note: "Nitto fields alone or alongside CTS kill teams." },
    { name: "Hongbin bloc", factions: ["hongbin", "aayari", "spear"], note: "Hongbin pairs with either proxy, but never both at once." }
  ],

  restriction: {
    title: "The one hard restriction",
    text: "The Aayari Network and SPEAR Brigade can never occupy the same battlespace. If a force built around one of them earns reinforcements, the other can only come on once the original troops have been wiped out to a man."
  }
};
