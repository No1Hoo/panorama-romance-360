# Verification Guide

Use this checklist before considering changes complete.

## Baseline Commands

```bash
npm run lint
npm run build
```

Run both commands from the repository root.

## UI Smoke Test

For React UI changes:

```bash
npm run dev
```

Then open the local Vite URL and check:

- Page renders without console-visible runtime failure.
- Main interaction paths work.
- Desktop layout is stable.
- Mobile layout is stable.
- Text does not overlap or overflow controls.
- Images and videos load from the intended paths.

## Asset-Sensitive Changes

When editing or referencing media assets, confirm:

- The path exists.
- The asset is not accidentally replaced by a placeholder.
- Large videos or generated outputs are not deleted unless requested.
- Screenshots used for reports still match the described workflow.

## Multi-Agent Verification

When multiple agents contribute:

```text
agent:
files changed:
commands run:
result:
remaining risk:
```

The primary agent should run the final verification after integrating all changes.

## Failure Triage

If `npm run lint` fails:

- Fix real code issues first.
- Avoid blanket disabling rules.
- If a rule is unsuitable, document the reason near the narrow exception.

If `npm run build` fails:

- Check TypeScript errors before Vite output details.
- Confirm imported assets and modules exist.
- Re-run after each focused fix.

If the browser smoke test fails:

- Reproduce with the smallest viewport or interaction that shows the issue.
- Fix layout or state logic before cosmetic polishing.
