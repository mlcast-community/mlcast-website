---
title: What is MLCast
---

# Open-source machine learning for weather nowcasting

MLCast is a collaborative effort bringing together meteorological services,
research institutions, and academia across Europe to develop a unified Python
package for AI-based nowcasting. It is an initiative of the E-AI WG6 (Nowcasting)
of EUMETNET.

We connect the world of computer science and machine learning with meteorology
and weather forecasting — particularly *nowcasting*, the short-range prediction
of precipitation from recent radar observations.

::::{grid} 1 1 3 3

:::{card} 📦 mlcast
:link: documentation/usage.md
The main Python package — ConvGRU ensemble nowcasting models, a configuration
system, and a CLI / Python API for training.
:::

:::{card} 🗂️ Datasets
:link: documentation/data.md
A curated Intake catalog of mlcast-compliant source radar datasets, plus
converters and a training-data sampler.
:::

:::{card} ✅ Validator
:link: documentation/validator.md
A tool that checks contributed datasets against the MLCast Zarr specification
and common geospatial tools.
:::

::::

```{warning}
`mlcast` is under active development. The API and functionality are subject to
change until the v1.0.0 release.
```

## Our mission

We are an open-source community dedicated to advancing machine learning for
weather nowcasting through collaborative development and shared resources.

Our collective gives institutes with GPU access the opportunity to train models,
while those with limited resources can contribute to development, testing, and
ultimately benefit from using these models.

Through equal ownership and transparent collaboration, we're creating a unified
Python package that makes state-of-the-art nowcasting accessible to everyone.

## Get started

- 🚀 [Get Started](get-started.md) — install the package and run your first training
- 📖 [Documentation](documentation/overview.md) — overview, architecture, and API reference
- 🔗 [Quick Links](quick-links.md) — fast access to repos, datasets, and references
- 💻 [GitHub](https://github.com/mlcast-community) — all MLCast community repositories

## License

`mlcast` is dual-licensed under Apache-2.0 or BSD-3-Clause, at your option.
