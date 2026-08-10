---
title: Algorithmic trading
summary: Machine learning applied to systematic trading. Asset clustering, sentiment signals and volatility forecasting, tested honestly enough to see most of it fall over.
category: Machine learning
stack: [Python, scikit-learn, pandas, Jupyter]
repo: https://github.com/NithishK5/Algorithmic_Trading_ML
year: 2025
featured: true
order: 2
cover: ../../assets/covers/algorithmic-trading.png
---

## Situation

I kept seeing machine learning trading projects online that showed a beautiful equity curve
and no discussion of how it was tested. I was suspicious of that and wanted to find out for
myself whether ML actually adds anything in markets or whether it mostly just fits noise.

## Task

Build a full strategy end to end, but hold it to a standard where I would believe the
result. That meant the validation mattered more to me than the models did.

## Action

I built the strategy out of three signals that do different jobs.

Unsupervised clustering groups assets by how they actually behave rather than by their
sector label, so diversification is based on observed correlation instead of what an
exchange calls something.

Sentiment analysis over news and social data gives a directional prior.

Volatility forecasting sizes the positions, so exposure comes down when the model's own
uncertainty goes up.

The part that took the longest was the testing. I used walk forward validation instead of a
single train test split, so the model only ever sees data that would have existed at the
time. Then I put realistic transaction costs in.

## Result

The pipeline works and the notebooks lay out each stage so the reasoning is visible.

The honest finding is that transaction costs killed most of what looked profitable. Several
versions that produced a lovely backtest curve went flat or negative once I charged
realistic costs per trade. The signals that survived were the slower ones that traded less.

That is the main thing I took away. The modelling was the easy part. The hard part was
building a test I could not fool, and then accepting the answer when it was not the one I
was hoping for.
