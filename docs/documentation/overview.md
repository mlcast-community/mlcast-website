# Project Overview

## What is weather nowcasting?

Weather nowcasting predicts conditions over the next few minutes to a few
hours — much shorter-range than standard numerical weather prediction (NWP).
It's especially valuable for fast-moving, high-impact events: heavy rainfall,
thunderstorms, lightning, snowfall, fog, and strong wind.

Machine learning is a natural fit here: instead of solving the full physical
equations of the atmosphere, models learn spatial and temporal patterns
directly from historical radar observations. This is cheaper to run than NWP
and can capture localized, rapidly evolving features — complementing rather
than replacing physical models.

## How the pieces fit together

```text
Source radar data
      ↓
Validation      — checked against the MLCast Zarr spec (see Validator)
      ↓
Intake catalog  — versioned, documented datasets (see Datasets)
      ↓
Sampling        — turns source data into training-ready indices (see Datasets)
      ↓
Training        — ConvGRU ensemble models, via CLI or Python API (see Usage)
      ↓
Evaluation      — shared metrics and benchmarks (see Evaluation)
```

See [Model Architecture](model-architecture.md) for how the model itself works.

## Where to go next

- [Get Started](get-started.md) — install and run your first training
- [Quick Links](quick-links.md) — every repo, dataset, and reference in one place
