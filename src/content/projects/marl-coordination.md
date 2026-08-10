---
title: Multi-agent coordination
summary: Two agents learning to cooperate in a stochastic grid world with no way to communicate, and watching the theory break in the learning curves.
category: Reinforcement learning
stack: [Python, NumPy, Q-learning]
repo: https://github.com/NithishK5/MARL-Coordination-QLearning
year: 2026
featured: true
order: 4
cover: ../../assets/covers/marl-coordination.png
---

## Situation

Single agent reinforcement learning has clean convergence guarantees. As soon as you put a
second learning agent in the same environment those guarantees stop holding, and I wanted
to see that happen rather than just know it.

## Task

Implement tabular Q-learning for two agents that have to coordinate in a stochastic grid
world, with no communication channel between them, and then actually analyse what the
learned policies were doing.

## Action

I implemented independent Q-learning, where each agent treats the other as part of the
environment, with expected value Bellman updates over the stochastic transitions.

Then I analysed the result two ways. I used replicator dynamics from game theory to look at
the learned policies as strategies rather than as tables of numbers, which shows you which
equilibria the agents are being pulled towards. And I ran a structural experiment varying
the step penalty across two asymmetric coordination phases, to see how much the reward
shaping was doing versus the learning.

## Result

It coordinates, and more usefully it fails in the way the theory says it should.

Q-learning's convergence proof assumes a stationary environment. With two learners that
assumption is broken, because each agent is chasing a target the other one keeps moving.
That is a sentence I had read plenty of times. Seeing it as instability in my own learning
curves, where both agents keep adjusting to each other and the values wobble instead of
settling, is what actually made it mean something.

The step penalty experiment showed how much of the coordination was coming from the reward
design rather than from the agents working anything out, which was a useful check on not
overclaiming what the learning had achieved.
