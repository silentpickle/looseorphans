# Story bible: Loose Orphans, Legend of Minsung
The cast's names live in `cast.toml` as {tokens}; this document uses the default cast.

### Premise
It's the night before the Loose Orphans' comeback. During a rooftop livestream, Sol finally starts
telling Rae something important. **Director Gwi** arrives: a demon executive at the agency and the game's Gwi-Ma
stand-in. He enforces the **Dating Ban Contract**, which feeds on idols' hidden feelings.

Gwi shatters the **Solmoon**, a barrier woven from Sol's songs. The eight members
are flung into the **Dramaverse**, a set of pocket worlds that each hold together around one story. To get home, the
party must win back seven **Lightstick Shards**, the game's crystals, one from each world's broken ending.

Through the whole journey, Sol and Rae keep almost meeting. They glimpse each other across worlds, trade notes
carried by Raebit and Sol Quokka, and get torn apart again at the worst moment. That running gag is the K-drama spine of
the game.

### Core FF systems, re-skinned
| FF thing | Here |
|---|---|
| Crystals | Lightstick Shards |
| Save points | Glowing lightsticks |
| Gil | Loose Change |
| Potion / Ether / Phoenix Down | Lio's Brownie / Banana Milk / Encore Ticket |
| Limit Break | **Encore** gauge |
| Summons | **Pets**: Wolf Dae, Raebit, Bopig, Arinet, Sol Quokka, Liochick, Junpup, Nicofox |
| Moogle | Bopig, who ends sentences with "dwae!" |
| Victory fanfare | An original chiptune "comeback stage" sting |

### The Minsung meter and the Drama Album
- Each chapter holds one scripted **K-drama trope moment**. When it fires, the screen letterboxes, slows down,
  sparkles, swells into an OST-style cue, and the camera zooms in. These are the hamfisted set pieces.
- Each trope is collected in the **Drama Album** menu and raises the **Minsung meter**.
- Dialogue choices and hidden **notes** (letters between Raebit and the Quokka, two per chapter) also raise it.
- The meter powers the final duo Encore, **Minsung Unison**, and picks the ending (see Finale).

### Party jobs
Each member gets one FF-style job, built from the character's own quirks.

| Member | Job | Signature kit |
|---|---|---|
| Sol | **Quokka Bard** | Song buffs; "Cheek Storage" holds an extra item, squirrel style; "Panic!" is a random-crit status |
| Dae | **Wolf Paladin** (leader) | "You okay, guys?" heals the party; covers allies; summons Wolf Dae |
| Ari | **Pictomancer** | Paints an effect onto the battlefield; "Dramatic Hair Flip" charms enemies |
| Rae | **Cat Ninja** | Fastest unit; summons cats (Pickle, Noodle, Waffle); "Tsundere Taunt" debuffs an enemy and secretly buffs Sol |
| Bo | **Gym Monk** | Multi-hit "Speed Rap" combo; "Dark Concept" self-buff |
| Lio | **Sunshine White Mage** | Brownie heals; "Deep Voice" stuns |
| Jun | **Puppy Scholar** | "Roast" deals mental damage; scans enemies for weaknesses |
| Nico | **Fox Thief** | Steal; "Maknae Privilege" makes enemies skip him on the first turn |

- **Skills** are named for each character's quirks. A few have names of their own in `cast.toml` (`sk_*`, `en_*`) so a fork can rename them.
- **Generic enemies** are industry jokes: Antis, Malicious Commenters, Feral Fancams, Sasaeng Shades, Algorithm Wisps.

### Chapter-by-chapter
Each chapter has one map of 2–3 screens, 3–6 NPCs, one minigame, 2–3 fights and a boss, and runs about 8 minutes.

**Prologue: The Rooftop** (tutorial; Chan, Sol, Rae, then all 8 briefly)
- In the dorm, Jun roasts everyone and Lio bakes.
- The livestream starts, and Sol nearly confesses on the rooftop.
- Director Gwi crashes it and serves as the tutorial boss. The fight is scripted to lose.
- The Solmoon shatters and everyone scatters.

**Ch 1: Where the Camilla Blooms** (Chan, Lio, Ari)
- **Setting:** a seaside town, Ongsang, and a little bar called *Camilla*. The timid owner is **Dong-baek-ish**, and
  **Officer Yong-sick** is an earnest cop who declares his love at full volume in public.
- **Plot:** a serial villain, **The Jester**, leaves clues around town.
- **Minigame:** a whodunit. Gather three clues by talking to the gossiping ajummas.
- **Boss:** The Jester.
- **Trope:** *the loud public declaration.* Yong-sick teaches Chan the skill "DECLARE!"
- **Minsung beat:** Sol's silhouette on a departing ferry, and the first Quokka note.

**Ch 2: Squish Game** (Rae, Jun, Nico)
- **Setting:** green tracksuits and pink guards wearing ○△□ masks. Sol is **Player 143**.
- **Minigames:** Red Light Green Light, a timing game against the giant doll. Dalgona, where you trace a quokka shape.
  The Glass Bridge, solved with Jun's roast logic.
- **Boss:** The **Front Manager**.
- **Trope:** *the piggyback ride.* Rae carries Sol across the glass.
- **Minsung beat:** the pair reunite for one fight, then a trapdoor separates them.

**Ch 3: Scarlet Heart Ryeo** (Sol, Ari, Jun, Nico; Rae joins mid-chapter)
- **Setting:** the Goryeo palace. Sol time-slips in and is mistaken for a court lady, so it's hanbok comedy. The members
  are recast as Goryeo princes, and Rae is the masked, feared 4th prince, **Wang Sooo**.
- **Minigames:** a palace-etiquette dialogue quiz, then a tea-pouring timing game.
- **Boss:** the scheming **Queen Mother Yoo-hoo**.
- **Trope:** *the wrist grab, then the unmasking.* This is the game's romantic peak: a near-kiss interrupted by Dating
  Ban lightning.

**Ch 4: The Glory** (Ari, Jun, Nico, Lio)
- **Setting:** a revenge drama. Patient strategist **Moon Dong-un** recruits the party against a bully queen,
  **Park Yeon-jinx**, who is a TV weather forecaster.
- **Minigame:** a baduk (Go) puzzle board: surround the bully's stones.
- **Boss:** Yeon-jinx. Her weather report changes the battle weather every turn, FF style.
- **Trope:** *the long game.*
- **Story beat:** Yeon-jinx reveals Director Gwi's plan. The Contract must be signed in "the room where it happens."
- **Keep it light:** no bullying violence or injury imagery, only the strategy and the weather bit.

**Ch 5: The Bog of Hosier** (Sol, Bo, Lio)
- **Setting:** an Irish bog-forest. **Hosier** is a gentle giant bog wizard who also sells socks. His bog is a
  9-room descent in the manner of Dante, one tiny room per circle.
- **Circle 2:** the lovers' whirlwind, a Francesca nod that mirrors Minsung. Sol's lowest moment.
- **Minigame:** a bass-off, where Lio's deep voice duels Hosier's.
- **Boss:** the "Eat Your Young" banquet ghoul.
- **Trope:** *sharing an umbrella in the rain.* Rae appears only as a reflection in the bog.

**Ch 6: Hamilsung** (THE TRIAD: Dae, Bo, Sol)
- **Setting:** the party must get into **the Room Where It Happens** to stop the Contract signing.
- **Minigame:** "My Shot" rap battles, a rhythm game that suits THE TRIAD.
- **Rival:** **Aaron Burr-sung**, who tells them to talk less.
- **Boss:** **King Geor-Gwi**, a pompous breakup-ballad tyrant who promises "You'll be back."
- **Mechanic:** a "Satisfied" rewind. The boss fight replays a turn from the other side.
- **Trope:** *the intercepted letter.* Rae is the "Wait for It" one.

**Ch 7: KPop Demon Hunters** (Dance-racha: Rae, Ari, Lio)
- **Setting:** a demon boy band, the **Saja Boyz**, is draining fans to break the Solmoon. A trio of golden hunters
  helps the party, with mascots **Durpy** the tiger and **Sussy** the magpie.
- **Minigame:** a dance-battle rhythm game.
- **Story beat:** the Saja Boyz leader, a regretful demon, defects. Director Gwi is revealed as their Gwi-Ma.
- **Items:** "Soda Pop" restores MP. "Golden" names the shard.
- **Trope:** *the duet.*

**Finale: The Solmoon Concert** (all 8; Sol and Rae are locked into the party, the player picks 2 more)
- **Boss phase 1:** the Dating Ban Contract.
- **Boss phase 2:** Director Gwi.
- **Boss phase 3:** Gwi's true form. **Minsung Unison** is the finishing move.
- **Ending A** (meter high): a full K-drama rooftop confession in the rain, slow-mo, with a shared umbrella and held
  hands, then the cut to credits.
- **Ending B:** they almost do it, the camera pans to the moon, and Ari breaks the fourth wall: "LOOSE ENDS knows."
- **Post-credits:** Bopig mops up and Lio is still baking.

Party appearances: Sol 6, Rae 5, Ari 4, Chan 3, and everyone else 2–3.

---

