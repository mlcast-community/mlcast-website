# Get Started

MLCast is split across several repositories under
[github.com/mlcast-community](https://github.com/mlcast-community), built around
three main pieces that follow the data from raw radar to trained model:

1. **Datasets** ([mlcast-datasets](https://github.com/mlcast-community/mlcast-datasets))
   — an Intake catalog of curated, mlcast-compliant source radar datasets, with
   per-provider converters and a sampler that turns source data into
   training-ready indices.
2. **Validator** ([mlcast-dataset-validator](https://github.com/mlcast-community/mlcast-dataset-validator))
   — checks that a contributed dataset meets the MLCast Zarr specification and
   works with common geospatial tools before it joins the catalog.
3. **Machine learning** ([mlcast](https://github.com/mlcast-community/mlcast))
   — the main Python package: ConvGRU ensemble nowcasting models and a
   configuration-driven CLI / Python API for training.

The typical flow: a dataset is converted and **validated**, registered in the
**catalog**, **sampled** into training indices, then fed to the **mlcast**
package for training.

## Quick start

1. **Get data** — open the Intake catalog of curated radar datasets. Install from
   GitHub for the latest version, or `pip install mlcast-datasets` for a stable
   release. See [Datasets](documentation/data.md).
2. **Validate** (contributors only) — if you are adding a new dataset, check it
   against the MLCast Zarr spec first. See [Validator](documentation/validator.md).
3. **Train a model** — fork and clone [mlcast](https://github.com/mlcast-community/mlcast),
   install with `uv sync`, then run `mlcast train`. See [Usage](documentation/usage.md).
