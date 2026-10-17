# VEYZL evidence plan

Goal for the VEYZL side track: show one PR where the audit flags a real issue, and a follow-up PR
that fixes it with the check passing. Save screenshots of both to `docs/veyzl/`.

## The issue we expect it to catch
Expiration dates come from an AI model (Bedrock estimating shelf life from a receipt line). In PR #1
the app shows those dates as fact: the user can't correct them and nothing says they're estimates.
People decide whether food is safe to eat from these dates, so AI output with no human oversight is a
genuine risk, not a staged one.

## PR #1 — ship the inventory as-is
Open the PR that adds the pantry/inventory UI (the starter app). Capture the VEYZL result.
If VEYZL doesn't flag it, check its configuration/rules with the sponsor table, and fall back to
whatever it *does* flag — the requirement is a real finding plus a real fix.

## PR #2 — the fix (prompt for Claude Code)
> Implement the human-oversight fix described in docs/VEYZL.md. In ItemEditor, make the expiration
> date an editable `<input type="date">` saved through `api.updateItem` (send `expirationDate` and
> `edited: true`). Under the date, show: "Estimated from typical shelf life. Check the package and
> trust your senses — edit this if it's wrong." In ItemRow, show a small "Estimated" marker when
> `edited` is false and "Checked" when true. Add the same one-line disclaimer under the pantry
> headline. Remove the VEYZL NOTE comment in ItemEditor. Keep the mock in sync. Run the build.

Ask Advait to make sure `PATCH /inventory/{id}` accepts `expirationDate` and `edited`.

## Screenshots to collect
- [ ] PR #1 with the VEYZL finding visible
- [ ] PR #2 diff
- [ ] PR #2 with VEYZL check passing
- [ ] App before (date read-only) and after (editable date + disclaimer)
