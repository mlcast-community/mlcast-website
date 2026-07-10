# API Reference

The public API lives under `mlcast.config`. Training is configured as a
[Fiddle](https://github.com/google/fiddle) graph, then built and run.

## Configuration entry points

### `training_experiment`

The base `@auto_config` function. Defines the default ConvGRU ensemble setup:
dataset, data module, network, Lightning module, and trainer.

```python
from mlcast.config import training_experiment

cfg = training_experiment.as_buildable()  # returns a fdl.Config graph
```

- **Returns** — a `fdl.Config` graph that can be edited before building.
- Defined in `src/mlcast/config/base.py`.

### `train_from_config(cfg)`

Runs a full experiment from a config graph.

- **Input** — a `fdl.Config` graph (from `training_experiment.as_buildable()`).
- **Behaviour** — validates cross-parameter contracts, builds all objects,
  persists the resolved config YAML to the active logger, then calls
  `trainer.fit()` followed by `trainer.test()`.

```python
from mlcast.config import train_from_config
train_from_config(cfg)
```

### `validate_config(cfg)`

Lower-level contract check, called internally by `train_from_config`.

- **Input** — a `fdl.Config` graph.
- **Raises** — `ValueError` on any contract violation (e.g. dataset and network
  disagree on input channel count).

```python
from mlcast.config.consistency_checks import validate_config
validate_config(cfg)
```

### Manual build & run

```python
import fiddle as fdl
experiment = fdl.build(cfg)   # instantiates all objects
experiment.run()              # trainer.fit() + trainer.test()
```

## Fiddlers

Fiddlers are named mutator functions that change several related parameters at
once. Import from `mlcast.config.fiddlers` (Python) or apply via
`--config fiddler:<name>` (CLI).

| Fiddler | Arguments | What it does |
|---------|-----------|--------------|
| `use_mlflow_logger` | *(none)* | Replaces the default `TensorBoardLogger` with `MLFlowLogger` and appends `LogSystemInfoCallback`; respects the `MLFLOW_TRACKING_URI` environment variable |
| `set_variables` | `standard_names` | Sets the list of input variables on the dataset and updates `network.input_channels` to match |
| `toggle_masking` | `enabled` | Toggles masked-loss mode by setting both `dataset_factory.return_mask` and `pl_module.masked_loss` to the same value |
| `use_anon_s3_dataset` | `zarr_path`, `endpoint_url` | Points the dataset at an anonymous S3 object store; sets `zarr_path` and the required `storage_options` together |
| `use_random_sampler` | *(none)* | Switches the dataset factory to the on-the-fly random sampler (useful during development when no precomputed CSV is available) |

## Custom network interface

Any architecture can be used by replacing `cfg.pl_module.network` with a
`fdl.Config` node pointing at your class. The only requirement is that `forward`
accepts the following signature:

```python
from jaxtyping import Float
import torch

def forward(
    self,
    x: Float[torch.Tensor, "batch input_steps in_channels H W"],
    steps: int,          # number of forecast steps to produce
    ensemble_size: int,  # number of stochastic ensemble members
) -> Float[torch.Tensor, "batch steps out_channels H W"]:
    ...
```

`NowcastLightningModule` calls `network(x, steps=N, ensemble_size=M)`, so a
custom network must accept those keyword arguments. If your network uses a
different parameter name for the input channel count than `input_channels` (the
default assumed by `ConvGruModel` and the `set_variables` fiddler), set it
explicitly on the config node. Exposing an `input_channels` property also lets
the consistency checks verify that the dataset and model agree on the expected
number of input channels.

See [Examples](examples.md) for a full custom-network walkthrough.
