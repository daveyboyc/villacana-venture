# PRD: photo coverage, so we know where to take photos and when we have enough

Status: draft, 18 November 2026. Written after the Elena junction work (`docs/HANDOVER_ELENA_JUNCTION.md`).
For a new chat to build. Read `AGENTS.md`, `docs/PHOTO_LOOP_PRD.md` and `docs/PHOTO_ALIGNMENT.md` first.

## 1. Problem

Dave walks the resort with a phone, and photos are the only way to fix what the model gets wrong. Today we cannot
answer two questions:

1. **Where are photos needed?** Photo requests (`data/photo_requests.json`, red spots on the map) are written by
   hand, only when an agent happens to notice a gap. There are 42 open now, of uneven quality.
2. **When do we have enough?** Nothing says whether a feature's photos can settle its position, depth and height.
   In the Elena work, several items stalled for the same reasons:
   - a feature seen only from far away: one camera at 20+ m fixes direction, not depth;
   - hidden behind a wall in every view;
   - photographed, but from a camera that is not solved;
   - two cameras that disagree with nothing to break the tie.

## 2. Goal

A coverage model that, for every feature and every area, says how well the photos pin it down. From that it writes
the shot list: where to stand, which way to face, what must be in frame. Dave can then walk a route on his phone
and know the area is done when its features turn green.

## 3. What "enough" means

Each feature needs evidence for the things that matter to it. Coverage is graded per feature, per question:

| Question | Enough when | Not enough when |
| --- | --- | --- |
| **Is it there, what does it look like** | One photo shows it clearly (tagged `shows`/`subject`, reviewed) | Only seen far off, cropped or behind planting |
| **Plan position (direction)** | One solved camera sees it, within 25 m | No solved camera sees it |
| **Plan position (depth)** | Two solved cameras see it with view directions at least 30° apart; or one solved camera within about 12 m; or one solved camera plus a feature the aerial shows sharply (lawn edge, roof edge) | All views come from one spot or one direction (the Elena roof: both cameras on one parapet) |
| **Height and levels** | A side-on or square-on view with a scale reference (door, tiles, steps), or the laser survey for open ground | Top hidden (the west wall under bougainvillea); seen only from above |
| **Hidden parts** | Recorded as `inferred` with the reason, and a request that names a viewpoint that can see it | Silently guessed |

The measured-approval bar (`docs/PLACEMENT_VERIFICATION.md`: 0.3 m rms with two solved cameras, or one plus the
aerial) is the top grade. Coverage says whether the photos *could* reach it, before anyone does the work.

Grades per feature: `unseen` → `seen` → `located` (direction) → `fixed` (position and depth) → `measured` (a
recorded measured approval). An area is **enough** when every structural feature in it is at least `fixed` and
every height-critical one has a height view. The scorecard turns green on that, not on "no open requests".

## 4. Requirements

1. **Coverage computation** (`scripts/photo_coverage.py` → `data/photo_coverage.json`):
   - **Inputs:** every feature in the evidence graph with a ring or points; every photo with a solved pose (a full
     view frustum) or an unsolved pin plus heading (a weaker, wider wedge).
   - **Visibility:** in frame, in range, and not blocked in plan by registry buildings or modelled walls taller
     than eye height (use the model export).
   - **Per feature:** the cameras that see it, their distances and view directions, the widest angle between two
     views, and the grade for each question in section 3.
2. **Requests from gaps:**
   - For each feature below `fixed` (or without a height view where one matters), propose a standing point on
     the walkable network. Pick a spot 4-12 m away that sees the feature, from a bearing at least 30° from its
     existing views and unblocked in plan, and give a look point.
   - State what must be in frame: the feature, plus two or three fixed corners for solving (registry corners,
     measured walls, kerbs).
   - Merge requests that one standing point serves. Keep hand-written requests and their wording; mark
     generated ones `generated: true`.
3. **Map layer and shot list:**
   - On `?view=map`, colour features by grade and show request spots with a look arrow. Group spots into a
     walking route per area.
   - Give a phone-friendly list: standing spot, facing, what to frame, why.
   - The existing `scripts/photo_requests.py` matching (position, heading, date) marks a request received when a
     matching photo arrives.
4. **Solve on intake:**
   - A new photo that answers a request gets a starting pose from its request (stand point and look point).
   - Its fixed corners get proposed as matches, so an agent only confirms them. Without this, new photos stay
     unsolved and coverage cannot rise past `seen`.
5. **Scorecard:** an area's colour comes from its coverage grades (section 3), and the count of features per
   grade shows in the scorecard panel.

## 5. Slices

1. **Coverage report only.** Run the computation on today's data; print the grades for the Elena and Cervantes
   areas. Check it against the handover's open items: it must flag the lawn's north edge, the cypress wall and the
   east patio wall as below `fixed`.
2. **Map layer.** Colour features by grade; show the existing 42 requests with arrows.
3. **Generated requests.** Propose requests for the gaps; an agent reviews them before they go live.
4. **Phone shot list.** A route per area, with the request text.
5. **Solve on intake.** Starting poses and proposed matches from the request.

## 6. Acceptance

- Slice 1 reproduces the known Elena gaps, and does not flag the measured lawns and west wall.
- For one area, Dave can open the map on his phone, walk the route, take the photos, and see that area's features
  move up a grade after intake and solving.
- No feature is shown `fixed` or `measured` on a single camera's depth beyond about 12 m.

## 7. Out of scope

- Automatic placement changes from coverage: coverage only says what the photos can support.
- New camera hardware (drones, laser measures). A tape measure note in a request is fine.
