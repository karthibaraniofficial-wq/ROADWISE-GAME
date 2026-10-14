# ROADWISE: Professional Traffic Rules Learning Game
## Game Design Document (GDD)

### 1. Vision & Core Philosophy
**ROADWISE** is a commercial-grade, educational 3D browser-based motorcycle delivery simulation game designed around Indian Left-Hand-Traffic (LHT) rules.
Players step into the shoes of a rookie courier navigating a vibrant, living urban road network. Rather than rewarding mindless speeding, the game rewards situational awareness, strict traffic compliance, defensive driving, and tactical route planning under dynamic urban hazards.

---

### 2. Core Gameplay Loop
```
[Main Menu] 
     ↓
[Player Profile & Garage] (Select / Upgrade Scooter or Motorcycle)
     ↓
[Delivery Board] (Review Available Contracts & Rule Challenges)
     ↓
[Accept Mission] → [Briefing & Route Planning]
     ↓
[Playable 3D City] 
  ├── Pre-departure Equipment Check (Helmet toggle)
  ├── Left-Hand Traffic Navigation (Drive on left, yield to right)
  ├── Real-time Rule Engine (Traffic signals, stop lines, speed limits)
  ├── Dynamic Logical Twists (Ambulances, jaywalkers, detours, rain)
  ├── Multi-point Pickups & Drop-offs
     ↓
[Delivery Complete / Timeout / Failed]
     ↓
[Mission Debrief & Analytics] (Breakdown of safety points, violations, tips, earnings ₹)
     ↓
[Progression System] (XP, License Tier Unlock, Safety Rating Grade A+ to C, Garage Upgrades)
```

---

### 3. Traffic Rules & Regulatory Engine (Indian Road Regulations)

#### 3.1 Rules Evaluated
| Rule Code | Description | Penalty / Consequence | Deduplication & Cooldown |
|---|---|---|---|
| `RULE_RED_LIGHT` | Crossing stop-line while signal is RED | -50 pts, ₹100 fine, Safety -5% | 3.0s cooldown per intersection |
| `RULE_STOP_LINE` | Overhanging stop-line on RED before clearing | -20 pts, ₹50 fine | 3.0s cooldown per intersection |
| `RULE_SPEEDING` | Exceeding zone speed limit (e.g. >30 in school, >40 in city) | -15 pts per tier, warning sound | Evaluated smoothly, 2.5s alert cooldown |
| `RULE_HELMET` | Riding without helmet fastened | -30 pts, instant reminder | Evaluated on ignition / riding |
| `RULE_WRONG_WAY` | Driving against traffic flow on dual-lane or divided roads | -40 pts, continuous warning | 2.0s cooldown |
| `RULE_ZEBRA_YIELD` | Failing to yield to pedestrian crossing in zebra zone | -50 pts, Safety -5% | 4.0s cooldown |
| `RULE_EMERGENCY_YIELD`| Blocking an approaching emergency vehicle (Ambulance) | -60 pts, major penalty | 5.0s cooldown |
| `RULE_COLLISION` | Colliding with vehicles, barriers, or street furniture | -75 pts, package damage -20% | 1.5s hit cooldown |
| `RULE_ILLEGAL_ENTRY` | Entering marked no-entry or closed construction zones | -40 pts, route invalidation | 3.0s cooldown |
| `RULE_SAFE_STOP` | Smooth stop before stop line on RED / yielding | +15 pts reward | Once per signal cycle |
| `RULE_CLEAN_DELIVERY` | Zero violations and 100% package condition | +50 pts bonus + ₹150 tip | At mission end |

---

### 4. Missions & Logical Twists Design

ROADWISE features 10 carefully balanced, progressive missions incorporating logical twists:

1. **Mission 1: First Ride (The Basics)**
   - *Goal*: Pick up order at Cafe Chai and deliver to Sector 1 Residence.
   - *Challenge*: Smooth acceleration, braking, and stopping in marked delivery bays.
   - *Rules*: Left-lane keeping, stopping within the bay.

2. **Mission 2: Red-Light Discipline**
   - *Goal*: Cross two major 4-way intersections along Mahatma Gandhi Marg.
   - *Challenge*: Signal cycles with red/amber/green; stopping before the solid white line.
   - *Twist*: Amber warning timing — stop if safe, do not gun the throttle!

3. **Mission 3: Helmet & Safety Protocol**
   - *Goal*: Urgent medicine delivery from City Clinic to Residential Tower.
   - *Challenge*: Must press [H] to fasten helmet before starting; strict 30 km/h in school sector.
   - *Twist*: Riding unhelmeted deducts points immediately with a police siren cue.

4. **Mission 4: School Zone & The Deceptive Green**
   - *Goal*: Deliver educational tablets to St. Jude Public School.
   - *Challenge*: 25 km/h speed limit zone with crossing guard warning.
   - *Twist: Deceptive Green* — The signal turns green, but a stray cart or crossing child is still clearing the junction. The player must wait despite the green light!

5. **Mission 5: Pedestrian Priority**
   - *Goal*: Lunch rush orders through Commercial Promenade.
   - *Challenge*: Multiple busy zebra crossings with pedestrians moving across.
   - *Twist*: Pedestrians stepping onto the zebra crossing; player must stop and yield completely.

6. **Mission 6: The Golden Hour (Emergency Route)**
   - *Goal*: Express courier across Central Ring Road.
   - *Challenge*: Normal traffic flow interrupted.
   - *Twist: Emergency Vehicle* — A loud ambulance with flashing red/blue lights approaches from behind. The player must pull over to the left side and stop until it clears.

7. **Mission 7: Construction Detour & The Shortcut Trap**
   - *Goal*: Hardware component delivery across industrial sector.
   - *Challenge*: GPS shows a tempting narrow alleyway shortcut.
   - *Twist: Shortcut Trap* — The alley is blocked with barriers and marked "NO ENTRY". Entering incurs penalties; the player must read signs and take the designated diversion.

8. **Mission 8: Monsoon Express (Wet Weather Driving)**
   - *Goal*: Urgent grocery delivery during a heavy rainstorm.
   - *Challenge*: Wet asphalt with 40% reduced tire grip, increased braking distance, and reduced visibility.
   - *Twist*: Water puddles cause hydroplaning if turning aggressively at high speed. Speed limit reduced to 30 km/h.

9. **Mission 9: Multi-Stop Rush**
   - *Goal*: Deliver 3 separate parcels to 3 distinct locations within a strict time budget.
   - *Challenge*: Tactical route planning: choosing optimal delivery sequence (A → B → C vs B → A → C) to minimize left turns across heavy traffic.

10. **Mission 10: Master Delivery Examination (Final Judgment Test)**
    - *Goal*: Night delivery test spanning the entire city map.
    - *Challenge*: Night visibility, reflective signs, headlights required.
    - *Twist*: Combines Deceptive Green, emergency vehicle response, jaywalking pedestrians, and construction detours under night conditions.
    - *Outcome*: Unlocks the "Master Delivery Partner" License and the flagship Ather Apex EV.

---

### 5. Vehicle Roster & Upgrade Mechanics

| Vehicle Name | Class | Top Speed | Accel | Brakes | Handling | Unlock Requirement |
|---|---|---|---|---|---|---|
| **Scooty 110** | Starter Scooter | 42 km/h | Moderate | Drum (Fair) | High Agility | Free / Default |
| **Tork Cargo 125** | Heavy Courier | 48 km/h | Strong Torque | Disc/Drum | Stable | 250 XP / ₹500 |
| **Pulsar 150** | Street Bike | 58 km/h | Fast | Dual Disc | Precise | 600 XP / ₹1,200 |
| **Ather Apex EV**| Premium Electric | 65 km/h | Instant | ABS Dual Disc| Elite Grip | 1,200 XP / ₹2,500 |

#### Upgrades Available in Garage:
- **Engine Tuning**: Stages I, II, III (+15% acceleration & top speed).
- **Brake System**: Drum → Front Disc → Dual ABS (Shortens stopping distance by up to 35%).
- **Tire Compound**: Standard Nylon → Soft Compound → All-Weather Monsoon Radial (Superior wet grip).
- **Custom Livery & Colors**: Electric Teal, Crimson Red, Cyber Yellow, Midnight Stealth, Delivery Orange.

---

### 6. Audio Architecture (Procedural Web Audio API)
ROADWISE utilizes an in-house procedural Web Audio synthesizer:
- **Engine Synth**: Dual oscillator (triangle + saw) modulated by real-time vehicle RPM and throttle input.
- **Brake Squeal**: High-frequency bandpass-filtered noise on hard deceleration.
- **Horn**: Dual-tone 440Hz / 494Hz classic scooter horn on keypress.
- **Emergency Siren**: Modulated pitch sweeping LFO (650Hz – 950Hz) for ambulance.
- **Violation Alert**: Low-pitched double buzz on traffic violation.
- **Success Chime**: Pentatonic ascending arpeggio on checkpoint / mission complete.
- **Rain Ambience**: Filtered white noise with randomized raindrop clicks in rainy missions.
- **Autoplay Compliance**: Audio context initializes on first user touch/click. Mute toggle provided in HUD and Settings.

---

### 7. Controls & Accessibility
- **Desktop**:
  - `W` / `↑`: Accelerate
  - `S` / `↓`: Brake & Reverse
  - `A` / `←`: Steer Left
  - `D` / `→`: Steer Right
  - `Space`: Handbrake / Quick Stop
  - `E`: Interact / Pick Up / Deliver
  - `H`: Fasten / Unfasten Helmet
  - `C`: Change Camera Angle (Chase / First-Person / Top-Down)
  - `Esc`: Pause / Settings Menu
- **Mobile / Touch**:
  - On-screen virtual joystick or left/right steering pads.
  - Large touch buttons for Throttle, Brake, Interact, and Horn.
