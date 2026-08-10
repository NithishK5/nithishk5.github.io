---
title: CalmRoute
summary: Sensory-aware wayfinding for Melbourne CBD. Routes get scored against your own sensory tolerances, so the calmest path is different for different people.
category: Accessibility
stack: [TypeScript, React Native, Expo, Dijkstra, Jest]
repo: https://github.com/NithishK5/calmroute
year: 2026
featured: true
order: 1
cover: ../../assets/covers/calmroute.png
---

## Situation

FIT5120 at Monash is an industry studio unit, so you get a broad problem space and have to
find the actual problem yourself. My team looked at how neurodivergent and sensory
sensitive adults get around Melbourne CBD.

The gap was obvious once we saw it. Every maps app optimises for time or distance. None of
them know anything about sensory load. The accessibility tools that do exist treat
sensitivity as one switch, high or low, when it really is not uniform. Someone can be fine
in a crowd and struggle with noise. Someone else is the other way round.

## Task

I was the only developer on the team, so all of the code was mine. The scoring engine, the
routing, the data layer, every screen. The rest of the team did research, user testing and
the presentation side.

I had one semester to turn a fairly loose brief into something that actually ran on real
Melbourne data, not a clickable mockup.

## Action

I built the whole thing in Expo and React Native with TypeScript.

The core idea is a Sensory Load Index. Every street segment gets a score from 0 to 100,
worked out as a weighted sum across four things: crowd, noise, visual clutter and
unpredictability. The weights come from the user's own tolerance profile and always add up
to one, so the score stays inside 0 to 100 no matter how someone sets their sliders.

Then I fed that score into Dijkstra as the edge weight. That is the part that makes it
personal, because the shortest path is now the calmest path for that specific person rather
than the fastest path for everyone.

Two decisions I spent real time on:

The route cost is score multiplied by distance, not score on its own. I had it as score
alone at first and it produced silly routes, like a 900m detour to dodge a 100m block that
scored five points worse. Multiplying by distance models the thing you actually care about,
which is how intense it is times how long you are in it.

Missing data is 0.5, never 0. If a sensor is quiet it does not mean the street is empty,
and scoring it as empty would route someone straight into what they were trying to avoid.

I also kept `src/domain/` free of React entirely. The scoring and routing are plain
TypeScript functions, values in and values out, so I could write and test both before any UI
existed. That decision is why the tests run in about a second without booting a simulator.

Data comes from City of Melbourne's open pedestrian counting system. I normalise counts per
sensor rather than globally, because sensor 3 at Melbourne Central swings about sixtyfold
between 3am and 5pm. Normalising globally would have made a genuinely busy laneway look
calmer than a quiet moment on Swanston Street.

## Result

All 21 story points delivered across three user stories, with 50 tests passing over the
domain logic.

The test I care about most is the one that proves the personalisation is real: two users
with different profiles, same origin, same destination, same moment, have to get different
routes. It fails the build if that stops being true.

On accessibility, I built it against VoiceOver rather than checking at the end. Sliders
announce a worded value instead of a bare number, scores never depend on colour alone, and
routes carry an off screen text summary, because a coloured line on a map tells a screen
reader nothing.

The app also never reroutes you automatically. That came out of the research. If your main
difficulty is unpredictability, then having your route change under you is its own problem.
It shows you the trade off and you decide.

What it does not do yet: there is no live positioning, so it warns about the worst segment
on your whole route rather than the one coming up next. Noise and clutter are values I
authored per street rather than measured, because Melbourne does not publish that data. The
graph covers 20 intersections, not the full grid. None of those are hard to fix, they are
just more work than a semester allowed.
