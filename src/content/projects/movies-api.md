---
title: Movies API
summary: A REST API over a film database, designed so a client can render a full list view from a single request.
category: Systems
stack: [Java, REST]
repo: https://github.com/NithishK5/Movies-API
year: 2023
cover: ../../assets/covers/movies-api.png
---

## Situation

Most of my work up to that point had been things that ran on their own. I had not built
something whose whole job was to be consumed by another application.

## Task

Build a REST API over a film catalogue that a web or mobile client could sit on top of
without fighting it.

## Action

I built the service in Java with endpoints for search, filtering and pagination.

The design decision I thought about most was the response shape. It is easy to build an API
that is clean from the server side and then forces the client into five requests to render
one screen. I shaped the list responses so a client gets everything it needs for a list view
in one call, and only goes back for detail when someone opens an item.

## Result

A working API covering search, filter and pagination.

Designing it for a consumer rather than for myself was the part that changed how I work.
Once you assume someone else is calling it, questions like what happens on an empty result,
or how errors are reported, stop being afterthoughts.
