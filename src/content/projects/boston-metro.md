---
title: Boston Metro System
summary: The Boston metro modelled as a multigraph, so a route with fewer line changes wins over one that is technically shorter.
category: Systems
stack: [Java, Graph algorithms]
repo: https://github.com/NithishK5/BOSTON-METRO-SYSTEM
year: 2023
---

## Situation

A university project to model the Boston metro network and find routes through it. The
naive version of this is easy, which is exactly why the interesting part is elsewhere.

## Task

Model the network so that route results are actually useful to a passenger, not just
technically correct.

## Action

I modelled it as a multigraph. Stations are nodes, but each line is its own set of edges, so
two stations connected by two different lines are two distinct connections rather than one.

That is what lets the search understand interchanges. Changing line is a real cost to a
passenger, so a path that stays on one line is preferable to a shorter one that makes three
changes.

Route finding is breadth first search over that structure.

## Result

It returns routes that a passenger would actually choose, preferring fewer changes over raw
hop count.

The lesson was that most of the value was in how I represented the problem, not in the
algorithm. BFS is BFS. Getting the graph structure right is what made the answers good.
