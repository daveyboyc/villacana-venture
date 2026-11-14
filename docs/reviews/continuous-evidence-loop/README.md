# Continuous evidence loop: tooling verification

This change adds workflow and UI tooling; it makes no geometry corrections or
new placement/photographic acceptance claims. The initial north-pool findings
remain two ready for comparison and two waiting for scoped evidence.

The screenshots show the actual scorecard module in the existing slice HTML/CSS
shell, with the renderer host isolated to keep the widget test independent of
software WebGL startup. They are UI evidence, not renders of an accepted model:

- [Desktop evidence flags](desktop-widget.png)
- [Phone evidence flags with scorecard=1](phone-widget.png)

Reproduce with `node scripts/test_scorecard_browser.cjs`. The separate
`test_inspection_browser.cjs` and `test_photo_map_browser.cjs` exercise the real
application; all run in the Continuous evidence loop workflow.

Policy checks cover scoped blockers, photo receipt versus review, absent source
access, dependencies/ownership, self-review, changed source/camera/model/artifact
bytes, explicit height uncertainty, placement tolerance and retained history.
Existing placement packets remain the authority for horizontal placement.
