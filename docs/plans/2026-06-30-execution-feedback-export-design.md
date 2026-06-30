# Execution Feedback Export Design

## Boundary

ContentFlow owns execution evidence:
- Which packet was imported.
- Which video is active.
- Which status the user moved it to.
- Whether cover images exist.
- Whether platforms are marked published, skipped, or violated.

It does not decide tomorrow's topic and does not generate weekly strategy.

## Export Shape

`state/contentflow-active.json` remains the exchange file. It is extended with:
- `importMarker`
- `importDate`
- `thumbnailNote`
- `hasCoverPortrait`
- `hasCoverLandscape`
- `statusHistory`
- `notesSummary`

Consumers must tolerate older snapshots.
