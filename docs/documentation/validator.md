# Dataset Validator

[mlcast-dataset-validator](https://github.com/mlcast-community/mlcast-dataset-validator)
is the validation tool for datasets contributed to the MLCast Intake catalog
([mlcast-datasets](data.md)). It ensures a dataset meets the technical
requirements for inclusion in the MLCast data collection before submission.

> Full specification docs:
> <https://mlcast-community.github.io/mlcast-dataset-validator/>

## Why it exists

During the MLCast community meeting, multiple entities offered to contribute
datasets. To streamline contribution and ensure data quality, the validator lets
providers verify their Zarr archives are compliant before submitting. It
addresses two needs:

1. **Specification compliance** — validates datasets against the formal MLCast
   Zarr format specification v1.0 (RFC 2119 keywords).
2. **Tool compatibility** — tests that datasets work correctly with common
   geospatial tools (xarray, GDAL, cartopy).

## What it validates

Currently covers radar precipitation source datasets.

**Minimum requirements for acceptance**

- 2D radar composite at 1 km resolution or finer
- at least 256×256 pixel valid sensing area
- minimum 3 years of temporal coverage
- consistent spatial domain across all timesteps
- data variable in mm (depth), mm/h (rate), or dBZ (reflectivity)

**Technical requirements**

- GeoZarr format (Zarr v2/v3 with proper georeferencing)
- CF-compliant coordinate and variable names
- correct dimension ordering (time × H × W)
- proper chunking (1 chunk per timestep)
- ZSTD compression (recommended)
- NaN values for missing / out-of-range data
- license metadata (CC-BY, CC-BY-SA, OGL, etc.)

**Tool compatibility**

- xarray can load and slice the data correctly
- GDAL can interpret the georeferencing (WKT parsing)
- cartopy can create CRS objects and transform coordinates
- cross-tool CRS consistency checks

## How it is organized

- **Spec modules by data stage / product** —
  `mlcast_dataset_validator/specs/<data_stage>/<product>.py` (e.g.
  `specs/source_data/radar_precipitation.py`). `specs/training_data/` is prepared
  for future ML training datasets.
- **Spec sections mirror an `xr.Dataset`** — each module follows the dataset
  layout (coordinates, variables, global attrs, tool compatibility).
- **Inline spec text drives each requirement** — human-readable RFC 2119 spec
  text sits next to the function calls that enforce it.
- **Reusable checks** — under
  `mlcast_dataset_validator/checks/<section>/<aspect>.py`.

```
mlcast_dataset_validator/
├── specs/
│   ├── source_data/
│   │   └── radar_precipitation.py
│   ├── training_data/          # no specs yet
│   └── cli.py
└── checks/
    ├── coords/                 # names, spatial, temporal, variable_timestep
    ├── data_vars/
    ├── global_attributes/
    └── tool_compatibility/
```

## Usage

### From the command line

Easiest path: run the PyPI release directly with
[uv](https://docs.astral.sh/uv/):

```bash
uvx --from mlcast-dataset-validator mlcast.validate_dataset <data_stage> <product> <dataset-path>
```

Validate a local Zarr dataset:

```bash
uvx --from mlcast-dataset-validator mlcast.validate_dataset \
    source_data radar_precipitation /path/to/radar_precip_source.zarr
```

Validate a remote Zarr in an S3 bucket at a custom endpoint (here the Radklim
Zarr already in the intake catalog):

```bash
uvx --from mlcast-dataset-validator mlcast.validate_dataset \
    source_data radar_precipitation \
    s3://mlcast-source-datasets/radklim/v0.1.1/5_minutes.zarr/ \
    --s3-endpoint-url https://object-store.os-api.cci2.ecmwf.int --s3-anon
```

Or clone and run directly:

```bash
git clone https://github.com/mlcast-community/mlcast-dataset-validator
cd mlcast-dataset-validator
pip install -e .
mlcast.validate_dataset source_data radar_precipitation /path/to/zarr/file.zarr
```

### From Python

Import the relevant spec and call it with an `xr.Dataset`. This is how the
validator runs in the CI of the
[mlcast-datasets](https://github.com/mlcast-community/mlcast-datasets) repo,
validating datasets on every PR and main-branch commit.

```python
import xarray as xr
from mlcast_dataset_validator.specs.source_data import radar_precipitation

storage_options = {
    "endpoint_url": "https://object-store.os-api.cci2.ecmwf.int",
    "anon": True,
}

ds = xr.open_zarr(
    "s3://mlcast-source-datasets/radklim/v0.1.1/5_minutes.zarr/",
    storage_options=storage_options,
)
# Preserve storage options so zarr_format checks can inspect remote-store metadata.
ds.encoding.setdefault("storage_options", storage_options)

report, _ = radar_precipitation.validate_dataset(ds)
report.console_print()
```
