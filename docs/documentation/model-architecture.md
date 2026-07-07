# Model Architecture

**Type of model:** ConvGRU — dataset, data module, network, Lightning module, and trainer.

```
 Past Radar Images
        │
        ▼
    Encoder            halves resolution per block (PixelUnshuffle)
        │
        ▼
  ConvGRU Layers        roll out in latent space, no fed-back frames
        │
        ▼
     Decoder            doubles resolution per block (PixelShuffle)
        │
        ▼
 Future Weather Forecasts
     (1 or many ensemble members)
```

## Implementation: `ConvGruModel`

`ConvGruModel` (in `src/mlcast/models/convgru.py`) is an encoder-decoder
architecture. It is **not autoregressive at forecast time**: instead of
generating each forecast frame from the previous predicted frame, the decoder
performs the temporal roll-out entirely in **latent space**, which avoids
accumulating prediction error over the forecast.

- **Encoding** — a stack of `EncoderBlock` layers unrolls a ConvGRU sequentially
  over the `input_steps` observed frames. Each block halves spatial resolution
  via `PixelUnshuffle(2)`; the last hidden state of each block is retained.
- **Decoding** — a stack of `DecoderBlock` layers performs a latent-space
  roll-out at each spatial scale. Each decoder block's ConvGRU is initialised
  with the final hidden state of the matching encoder block, then unrolls over
  `forecast_steps` driven by noise or zeros. Spatial resolution is doubled at
  each block via `PixelShuffle(2)`. Forecast frames are only materialised at the
  end, never fed back as inputs.
- **Ensemble** — when `ensemble_size > 1`, the decoder runs `ensemble_size`
  times, each with freshly sampled Gaussian noise; results are concatenated along
  the channel dimension, giving multiple forecast scenarios for uncertainty
  estimation.

## Custom architectures

Any network can replace `cfg.pl_module.network` as long as its `forward` accepts
`(x, steps, ensemble_size)` and returns `[batch, steps, out_channels, H, W]`.
See the [custom network interface](api-reference.md#custom-network-interface) and
the [worked example](examples.md#custom-network-architecture).
