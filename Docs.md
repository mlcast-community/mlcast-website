MLCast
🌐 1. Home (/)
Purpose: First impression + navigation hub
MLCast is an open-source collaboration which develops machine learning “nowcasting” models for weather prediction
LINKS: Get Started, QuickLinks, GitHub Repo, Documentation
Our Mission:
We are an open-source community dedicated to advancing machine learning for weather nowcasting through collaborative development and shared resources.
Our collective gives institutes with GPU access the opportunity to train models, while those with limited resources can contribute to development, testing, and ultimately benefit from using these models.
Through equal ownership and transparent collaboration, we're creating a unified Python package that makes state-of-the-art nowcasting accessible to everyone.

🚀 2. Get Started (/get-started)
Purpose: Get users running quickly
Dataset
What is it?: Collection of open-source weather radar data for training MLCast models
How to use it?: 
1. [Most Recent] Install from github using Python packages
2. [Stable, preferred] Install from mlcast_database

Validator
A tool used to make sure that all datasets contributed to the MLCast community is compatible in a technical aspect
Machine Learning
Fork the project and clone the git repository locally
Start feeding in the data, training, and validating

📖 3. Documentation (/docs) ⭐ (MOST IMPORTANT)
This is the core of your ML website
Structure inside:
3.1 Overview
The MLCast Community is a collaborative effort bringing together meteorological services, research institutions, and academia across Europe to develop a unified Python package for AI-based nowcasting. This is an initiative of the E-AI WG6 (Nowcasting) of EUMETNET. 
MLCast aims to help connect the world of computer science and machine learning with meteorology and weather forecasting, particularly “nowcasting.”

3.2 How It Works
The main goal of MLCast is to incorporate machine learning and weather prediction to provide more accurate weather predicting
HOW IT IS DONE: High-resolution data is converted to a low-resolution image. The data is then fed into the MLCast model, which produces its own high-resolution weather map. The two high-resolution weather maps (original and produced) are compared to each other to assess the error of the model.
Data sources- Weather radar information from around the world (particularly from Europe)

3.3 Model Architecture
Type of model: ConvGRU-  dataset, data module, network, Lightning module, and trainer 
How it works
Encoder
Takes several past weather radar images as input.
Extracts important weather patterns and compresses them into a smaller internal representation (called a latent space).
ConvGRU Layers
ConvGRU (Convolutional Gated Recurrent Unit) layers learn how weather changes over time.
They capture both spatial information (where weather is happening) and temporal information (how it evolves).
Decoder
Uses the learned hidden representations to generate future weather radar images.
Unlike many forecasting models, it predicts future frames directly from the latent representation instead of repeatedly using previous predictions as new inputs. This helps reduce accumulated prediction errors.
Ensemble Forecasting
The model can produce multiple forecast scenarios by adding random noise during decoding.
These multiple predictions estimate the uncertainty of the forecast, making the results more reliable.


Training approach
Past Radar Images
        │
        ▼
    Encoder
        │
        ▼
  ConvGRU Layers
 (learn temporal patterns)
        │
        ▼
     Decoder
        │
        ▼
 Future Weather Forecasts
     (1 or many ensembles)


Key features
Encoder-decoder architecture for sequence prediction.
Uses ConvGRU blocks to model both space and time.
Predicts multiple future time steps from a sequence of past observations.
Supports probabilistic (ensemble) forecasting for uncertainty estimation.
Can be replaced with custom neural network architectures through mlcast's configuration system, as long as they follow the required input/output interface.

3.4 Usage
How to import the model
Prediction example
Training example (if applicable)

3.5 API Reference
predict()
train()
load_model()
Each should include:
What it does
Inputs
Outputs
Example

3.6 Examples
Sample predictions
Images / graphs
Real-world cases

3.7 Data
Where data comes from
Format
Preprocessing steps

3.8 Evaluation
Metrics (RMSE, accuracy, etc.)
Benchmarks

3.9 Troubleshooting
Common errors
Fixes

🤝 4. Collaborate (/collaborate)
Purpose: Open-source contribution


❓ 5. FAQs (/faqs)
Purpose: Reduce confusion
Include:
“What is MLCAST?”
“Do I need GPU?”
“How accurate is it?”
“Can I use it for research?”

🌍 6. Community and News (/community-and-news)
Purpose: Engagement
Include:
News posts (Webvalley/FBK/MLCast has access to make posts)
Discussion posts
MLCast Community document

🔗 8. Quick Links (/quick-links)
Purpose: Fast access
Include:
GitHub repo
Dataset links
Paper / research
API reference
Installation docs

