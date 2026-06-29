# Data

This page covers the **mlcast-datasets** intake catalog — the source data layer
of the MLCast project — and the sampler used to turn source data into
training-ready indices.

## Data flow

The diagram below (from the
[mlcast-datasets](https://github.com/mlcast-community/mlcast-datasets) README)
shows the intended data flow and how the intake catalog fits into the overall
architecture of the MLCast project.

![MLCast data infrastructure](<img width="1920" height="1080" alt="ML CAST DATA INFRASTRUCTURE (1)" src="https://github.com/user-attachments/assets/6fe0f228-a3fc-44ae-866b-0522c433960d" />
)

[source for this graphic](https://docs.google.com/presentation/d/1hIlPOer4T9hlxp0mnQ8WQRggSzVUqMID/edit?slide=id.p1#slide=id.p1)

## The intake catalog

The catalog is a curated collection of open-source weather radar datasets, made
available so you can build machine-learning training datasets from them.

### Reading the catalog directly from GitHub

Use this for the most recent version of the catalog. Install the required
packages:

```bash
pip install intake intake-xarray zarr jinja2
# or pull everything via the package:
pip install git+https://github.com/mlcast-community/mlcast-datasets
```

Then open the catalog from Python:

```python
import intake
cat = intake.open_catalog(
    "https://raw.githubusercontent.com/mlcast-community/mlcast-datasets/main/src/mlcast_datasets/catalog/catalog.yml"
)
```

### Installing the `mlcast_datasets` package

Use this for a stable, tagged version of the catalog:

```bash
pip install mlcast-datasets
```

```python
import mlcast_datasets
cat = mlcast_datasets.open_catalog()
```

### Using data within the catalog

List the available sources, then load a [dask](https://github.com/dask/dask)-backed
`xarray.Dataset` with all variables and attributes:

```python
>>> list(cat)
['precipitation']

>>> list(cat.precipitation)
['radklim_hourly', 'radklim_5_minutes']

>>> ds = cat.precipitation.radklim_5_minutes.to_dask()
>>> ds
<xarray.Dataset> Size: 10TB
Dimensions:          (time: 2419200, y: 1100, x: 900)
Coordinates:
  * time             (time) datetime64[ns] ...
  * y                (y) float64 ...
  * x                (x) float64 ...
    lat              (y, x) float64 dask.array<...>
    lon              (y, x) float64 dask.array<...>
Data variables:
    rainfall_amount  (time, y, x) float32 dask.array<...>
    crs              float64 ...
Attributes:
    mlcast_dataset_identifier:         DE-DWD-radar_precipitation-RADKLIM
    mlcast_dataset_identifier_format:  {country_code}-{entity}-{physical_var...}
    mlcast_dataset_version:            0.1.1
    ...
```

## Format

Datasets are stored as **GeoZarr** (Zarr v2/v3 with proper georeferencing),
following the MLCast Zarr format specification. In short:

- CF-compliant coordinate and variable names
- dimension ordering `time × H × W`, one chunk per timestep
- data variable in mm (depth), mm/h (rate), or dBZ (reflectivity)
- NaN for missing / out-of-range data
- `mlcast_*` global attributes recording provenance (version, identifier,
  creator)

The [Validator](validator.md) enforces the full specification.

## Per-provider converters

Several converter repositories exist under
[github.com/mlcast-community](https://github.com/mlcast-community). Repository
names and their GitHub descriptions:

| Repository | Description |
|------------|-------------|
| `mlcast-dataset-DE-DWD-radklim` | Conversion of radklim dataset to zarr |
| `mlcast-dataset-msgcpp` | Code to convert msgcpp netCDF dataset to zarr |
| `mlcast-dataset-DMI-radar_precipitation` | *(no description)* |
| `mlcast-dataset-IT-DPC-SRI` | Code to convert the TIFF files from the Italian radar composite dataset to Zarr format. |
| `mlcast-dataset-tiff2zarr` | Generic GeoTIFF → mlcast-compliant Zarr v3 converter |
| `mlcast-dataset-metoffice-nimrod` | Download and convert UK Met Office NIMROD radar data to mlcast-compliant GeoTIFF |
| `mlcast-dataset-BE-RMI-radclim` | This project contains the needed source code to create a mlcast-dataset zarr archive of the Belgian RMI RADCLIM dataset |

## Sampling training-ready data

[mlcast-dataset-sampler](https://github.com/mlcast-community/mlcast-dataset-sampler)
turns a source Zarr dataset into a CSV of `(t, x, y)` indices that point directly
into the source data — ready for a PyTorch `Dataset`. It runs in two steps.

Run directly with `uvx` (no installation needed):

```bash
uvx --from "git+https://github.com/mlcast-community/mlcast-dataset-sampler" mlcast.sample_dataset --help
```

### Step 1 — Filter valid datacubes

Scan the dataset and identify valid datacube coordinates (handles time gaps and
NaN regions):

```bash
uv run mlcast.sample_dataset filter-nan /path/to/radar.zarr \
    --start-date 2021-01-01 \
    --end-date 2024-12-31 \
    --time-depth 24 \
    --width 256 \
    --height 256 \
    --max-nan 10000
```

This outputs a CSV of valid `(t, x, y)` coordinates.

### Step 2 — Importance sampling

Weight samples by rain intensity:

```bash
uv run mlcast.sample_dataset sample /path/to/radar.zarr \
    valid_datacubes_2021-01-01-2024-12-31_24x256x256_3x16x16_10000.csv \
    --q-min 1e-4 \
    --mean-weight 0.1
```

**Why importance sampling?** Equal-frequency sampling gives every precipitation
intensity the same probability, which causes models to hallucinate thunderstorms
after ~30 minutes of lead time. Importance sampling sets a minimum selection
probability (`--q-min`) for all samples and adds a weighted contribution based on
mean rain rate (`--mean-weight`), keeping low-intensity samples in training while
oversampling interesting meteorological events.

## Contributing a dataset

The community is always looking for new datasets. To contribute, open an issue or
pull request on
[mlcast-datasets](https://github.com/mlcast-community/mlcast-datasets), and check
your Zarr archive against the spec with the [Validator](validator.md) first.
