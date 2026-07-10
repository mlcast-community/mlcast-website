# Examples

See [Usage](usage.md) for the default-experiment and CLI examples. This page
covers the one worked example not shown there: swapping in a fully custom
network architecture.

## Custom network architecture

You can swap in any architecture by replacing `cfg.pl_module.network` with a
`fdl.Config` node. The network must implement the nowcasting forward interface
(see [API Reference](api-reference.md#custom-network-interface)).

As an example, here is how to wrap an
[mfai](https://github.com/meteofrance/mfai) `HalfUNet` (a plain single-step
U-Net) to satisfy the interface. The wrapper channel-stacks the past frames and
runs the U-Net autoregressively for each requested forecast step.

> **Note** — `input_steps` equals `dataset_factory.input_steps` (6 by default)
> and is directly readable from the config graph before building.

```python
import einops
import fiddle as fdl
import torch
import torch.nn as nn
from jaxtyping import Float
from mfai.torch.models import HalfUNet
from mlcast.config import training_experiment, train_from_config
from mlcast.config.fiddlers import use_random_sampler

# Minimal adapter: channel-stack past frames → HalfUNet → one step at a time.
# NowcastLightningModule calls network(x, steps=N, ensemble_size=M), so any
# custom network must accept those keyword arguments.
class HalfUNetNowcaster(nn.Module):
    def __init__(self, input_steps: int = 6, num_vars: int = 1):
        super().__init__()
        self.input_steps = input_steps
        self.num_vars = num_vars
        self.unet = HalfUNet(
            input_shape=(256, 256),
            in_channels=input_steps * num_vars,
            out_channels=num_vars,
            settings=fdl.Config(HalfUNet.settings_kls),
        )

    @property
    def input_channels(self) -> int:
        # Lets the config consistency checks verify that the dataset and model
        # agree on the expected number of input channels.
        return self.num_vars

    def forward(
        self,
        x: Float[torch.Tensor, "batch input_steps in_channels H W"],
        steps: int,
        ensemble_size: int = 1,
    ) -> Float[torch.Tensor, "batch steps out_channels H W"]:
        # channel-stack all input frames: (b, t, c, h, w) -> (b, t*c, h, w)
        x_flat = einops.rearrange(x, "b t c h w -> b (t c) h w")
        preds = []
        for _ in range(steps):
            y = self.unet(x_flat)   # [B, num_vars, H, W]
            preds.append(y.unsqueeze(1))
            # slide window: drop the oldest timestep, append the latest prediction
            x_flat = torch.cat([x_flat[:, self.num_vars:], y], dim=1)
        return torch.cat(preds, dim=1)

cfg = training_experiment.as_buildable()
use_random_sampler(cfg)

cfg.pl_module.network = fdl.Config(
    HalfUNetNowcaster,
    input_steps=cfg.data.dataset_factory.input_steps,
    num_vars=len(cfg.data.dataset_factory.standard_names),
)

train_from_config(cfg)
```
