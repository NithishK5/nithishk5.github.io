---
title: Cryptograms
summary: Generates and solves substitution cipher puzzles, written to be read by someone learning how those ciphers break.
category: Systems
stack: [Java]
repo: https://github.com/NithishK5/Cryptograms
year: 2023
cover: ../../assets/covers/cryptograms.png
---

## Situation

A Java project on substitution ciphers. The brief was a working program, but the useful
version of it is a program someone can learn from.

## Task

Build something that both generates cryptogram puzzles and supports solving them, and write
it so the mechanism is visible rather than hidden.

## Action

It generates puzzles from a phrase bank by applying a random letter substitution, then lets
you solve them interactively by guessing letter mappings.

I added frequency analysis hints, which is the actual technique for breaking these ciphers.
Common letters show up at predictable rates in English, so the frequency of symbols in the
ciphertext leaks the mapping.

I chose readable code over clever code throughout, since the point was for someone to follow
it.

## Result

It works both ways, generating and solving.

Building the solver is what taught me why substitution ciphers are weak. They preserve
letter frequency exactly, so the structure of the language comes straight through the
encryption. Implementing the attack made that much clearer than being told it.
