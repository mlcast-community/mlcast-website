# Evaluation

## Loss functions

`mlcast` implements **CRPS, AFCRPS, MSE** loss functions (in
`src/mlcast/losses.py`).

## Benchmarks

Community benchmarks are being developed in the
[mlcast-benchmarks](https://github.com/mlcast-community/mlcast-benchmarks)
repository — described on GitHub as "(the future home) of benchmarks developed by
the MLCast community".

## Reproducibility

The fully resolved config is always saved to YAML alongside the training logs, so
runs can be reproduced exactly:

```bash
mlcast train --config logs/mlcast/version_0/config.yaml
```
