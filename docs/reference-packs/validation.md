# Entrance reference-pack validation

Historical PR109 pilot snapshot (41 components). The later tunnel draft adds
T13/T14 and a 43-component pack; see
[updated validation](../reviews/silvia-tunnel-details/validation.md).

22 October 2026. Scope: source-reference tooling and metadata; no runtime
geometry, collision, camera positions or placement policy changed.

- Reference catalogue: 176 references, 176 tagged/reviewed, zero catalogue problems.
  Catalogue review does not establish model fidelity.
- Pack generation/check: six inspected source sheets, 41 component rows and 14
  area templates; deterministic generated outputs current.
- Portable JSON schema and pilot data validate.
- Ten reference-pack tests pass, including stale source hash, out-of-bounds
  locators, private source rejection, unknown IDs, unsupported connection claims
  model-state evidence requirements and a second area without a model snapshot.
- Existing photo-assignment/reference-index/placement-policy tests: 50 pass.
- Actual Chromium viewer regression passes source switching, component lookup
  and clipboard JSON, photo/trace/label controls, model-state filter, stable deep
  links, checklist, drawings, 14-area rollout and 320/390px mobile widths. No
  browser page errors observed.
- Eleven shareable figures exported from the actual SVGs/viewer; zero page errors.
- Production build passes, with the existing Vite large-chunk advisory.
- Placement change gate against origin/main passes: no unapproved geometry changes.
- `git diff --check` passes.
- Independent corrected-source review accepts this bounded pilot; see
  [review](independent-source-review.md). This is not placement approval.

All six sources are available public 1200 × 1600 web copies. Original photos are
unchanged. Source boxes are locators; explicit polylines alone are traces. The
schematics are unscaled and do not establish concealed boundaries or coordinates.
The positive model comparisons refer to draft PR108 revision 51b75f5, not main.
Silvia/Jorge remain distinct; the exact entrance/tunnel link and some duplicate
opening identities remain unresolved. No full area or per-instance survey is
claimed complete.
