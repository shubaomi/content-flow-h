# Commercial Execution Context Design

## Boundary

ContentFlow owns:

- script editing
- cover upload status
- filming/editing/publishing state
- platform metrics entered by the user

Psychelog owns:

- topic selection
- personal material pool
- commercial intent
- morning and evening mobile nudges

## Import Extension

`commercialIntent` is optional:

```json
{
  "commercialIntent": {
    "stage": "pain_validation",
    "targetAudience": "...",
    "audiencePain": "...",
    "businessHypothesis": "...",
    "cta": "...",
    "relatedOffer": "..."
  }
}
```

The import script turns it into a note block. No schema migration is required for current data files.
