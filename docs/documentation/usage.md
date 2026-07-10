# Usage

`mlcast` exposes two interfaces for training, both built on
[Fiddle](https://github.com/google/fiddle) — a configuration library that lets
you build a full experiment graph, override any parameter, and reproduce runs
exactly from a saved YAML file.

- a **command-line interface (CLI)** for interactive and scripted use
- a **Python API** for programmatic control

## Installation

`mlcast` is in rapid development, so the recommended path is to clone locally
rather than install a pinned release from PyPI.

### Local development (recommended)

[Fork the repository](https://github.com/mlcast-community/mlcast/fork), then
clone your fork:

```bash
git clone https://github.com/<your-github-username>/mlcast
cd mlcast

# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies (pick the variant matching your hardware)
uv sync                       # CPU
uv sync --extra gpu-cu128     # GPU — CUDA 12.8
uv sync --extra gpu-cu130     # GPU — CUDA 13.0
```

If you intend to modify the code, set up the dev toolchain:

```bash
uv sync --extra dev
uv run pre-commit install     # runs checks automatically on every commit
```

### PyPI release

Tagged releases are published to PyPI:

```bash
pip install mlcast
```

## Configuration model

Training is built around a single base configuration function,
`training_experiment`, which defines the default ConvGRU ensemble nowcasting
setup: dataset, data module, network, Lightning module, and trainer. Rather than
writing a new config from scratch, start from this base and apply targeted
modifications:

- **`set:` overrides** — change a single scalar (batch size, learning rate, epochs)
- **fiddlers** — named mutator functions that keep multiple related parameters
  in sync (switching the dataset class, toggling masking, changing the logger)
- **direct graph edits** (Python API only) — replace a sub-object entirely, e.g.
  swap in a different network architecture

Any combination can be layered on top of the base config. The fully resolved
config is always saved to YAML alongside the training logs, so runs reproduce
exactly.

## Command-line interface

```bash
mlcast train
```

This trains with the built-in `training_experiment` defaults. All parameters are
controlled via `--config` flags, applied in order and freely combinable:

| Prefix | Purpose | Example |
|--------|---------|---------|
| *(none)* | Use the built-in default config | `mlcast train` |
| `set:` | Override a single parameter | `--config set:data.batch_size=32` |
| `fiddler:` | Apply a semantic mutator (multi-param change) | `--config fiddler:use_random_sampler` |
| `config:` | Switch to a different `@auto_config` function | `--config=config:my_experiment` |
| `path/to/config.yaml` | Load a previously saved config | `--config saved.yaml` |

### Examples

```bash
# Override dataset path and batch size
mlcast train \
    --config set:data.dataset_factory.zarr_path=/data/radar.zarr \
    --config set:data.batch_size=32

# Switch to random sampler and log to MLflow
mlcast train \
    --config fiddler:use_random_sampler \
    --config fiddler:use_mlflow_logger

# Resume from a saved config with an epoch override
mlcast train \
    --config logs/mlcast/version_0/config.yaml \
    --config set:trainer.max_epochs=50

# Inspect the fully resolved config without starting training
mlcast train --config fiddler:use_random_sampler --print_config_and_exit
```

Run `mlcast train --help` for the full list of examples and available fiddlers.

## Python API

The Python API gives full programmatic control over the config graph before
anything is instantiated.

```python
import fiddle as fdl
from mlcast.config import training_experiment, train_from_config
from mlcast.config.fiddlers import use_random_sampler

cfg = training_experiment.as_buildable()  # returns a fdl.Config graph

# Apply a fiddler to switch the dataset sampler
use_random_sampler(cfg)

# Override individual parameters directly on the config graph
cfg.data.batch_size = 32
cfg.trainer.max_epochs = 50

# Validates cross-parameter contracts, builds all objects, persists config
# YAML to the active logger, then calls trainer.fit() + trainer.test()
train_from_config(cfg)
```

For lower-level control, run the steps of `train_from_config` individually:

```python
import fiddle as fdl
from mlcast.config.consistency_checks import validate_config

validate_config(cfg)          # raises ValueError on any contract violation
experiment = fdl.build(cfg)   # instantiates all objects
experiment.run()              # trainer.fit() + trainer.test()
```

See the [API Reference](api-reference.md) for fiddlers and the custom-network
interface.
