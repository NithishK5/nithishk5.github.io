---
title: Recipe generation
summary: One project covering the full arc of modern NLP, from a hand built RNN with attention through to LoRA fine tuning and a RAG menu designer.
category: Natural language
stack: [Python, PyTorch, Transformers, LoRA, RAG]
repo: https://github.com/NithishK5/recipe-generation-nlp
year: 2026
featured: true
order: 3
cover: ../../assets/covers/recipe-generation.png
---

## Situation

Most of what I had read about NLP jumped straight to loading a pretrained transformer and
calling it done. I understood how to use those models but I did not really understand what
they had replaced, or why the jump mattered.

## Task

Build every stage of that history on one task, so the comparisons would be fair. Recipe
generation worked well for this because the output has structure, an ingredient list and
ordered steps, so it is obvious when a model is producing fluent nonsense.

## Action

I worked through it in four stages.

First a sequence to sequence model with Bahdanau attention, written from scratch. I did
this deliberately before touching anything pretrained, because implementing attention by
hand is what made it click rather than being a diagram I had seen.

Then LoRA fine tuning on T5 and GPT-2. Instead of updating all the weights you train a
small pair of low rank matrices, which is what made it possible to fine tune models this
size on the hardware I actually own.

Then a retrieval augmented menu designer, which pulls relevant real recipes before
generating so the output is grounded in dishes that exist rather than plausible sounding
inventions.

Finally an evaluation setup using an LLM as judge, because BLEU tells you close to nothing
about whether a recipe makes sense.

## Result

All four stages work and can be run against the same data, which was the point.

The comparison was the useful bit. The RNN baseline produces something recipe shaped but
loses the thread over longer outputs. The fine tuned transformers stay coherent all the way
through. Seeing that difference on my own task, with my own baseline sat next to it, taught
me more about why the architecture won than reading about it did.

The RAG version was the one that surprised me. Grounding the generation in retrieved
recipes fixed a failure the fine tuned models still had, which was confidently inventing
ingredient quantities that did not work.
