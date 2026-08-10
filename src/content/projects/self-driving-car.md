---
title: Self-driving car
summary: A driving simulation with a neural network written from scratch in JavaScript. No libraries anywhere, including the network.
category: Simulation
stack: [JavaScript, Canvas]
repo: https://github.com/NithishK5/Self-Driving-Car-Neural-Networks-and-ML-P-1
year: 2024
featured: true
order: 6
cover: ../../assets/covers/self-driving-car.png
---

## Situation

I had used neural network libraries without really knowing what they were doing
underneath. Calling `model.fit()` and getting a result felt like using something I could
not explain.

## Task

Build a driving simulation where I wrote every part myself, including the network. No
libraries at all, so there was nowhere for my understanding to have a gap.

## Action

Everything is hand written in JavaScript on canvas.

The car physics, the ray casting sensors that detect how far the road edges and other cars
are, the collision detection, the road generation, and the network that reads those sensor
values and outputs steering and acceleration.

The network is a plain feedforward model. I wrote the forward pass directly against arrays,
then trained it with a genetic approach instead of backpropagation. Each generation spawns a
population of cars with mutated weights, the best one survives, and the next generation
mutates from there.

## Result

The cars learn to drive the road and overtake traffic without hitting anything.

Using mutation rather than backpropagation turned out to be the more useful choice for
learning. You can watch a whole generation fail in exactly the same place, mutate, and see
one survive. The search process is visible on screen instead of hidden in a gradient, and
that made the idea of a loss landscape feel like a real thing rather than a metaphor.

Writing the sensors myself also changed how I think about model inputs. How far the rays
reach and how many there are affects what the car can possibly learn, and no amount of
training fixes a sensor that cannot see the thing it needs to react to.
