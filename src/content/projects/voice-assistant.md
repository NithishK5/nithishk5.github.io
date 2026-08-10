---
title: Mia, a voice assistant
summary: A voice controlled assistant in Python that listens for a command, works out what you meant, and does it.
category: Speech
stack: [Python, SpeechRecognition]
repo: https://github.com/NithishK5/VirtualAssistant.ai
year: 2024
featured: true
order: 7
---

## Situation

I wanted to build something I would use rather than another exercise, and the small
repetitive things I do at my desk seemed like a reasonable target. Opening apps, checking
the time, putting music on.

## Task

Build a working voice assistant in Python. Listen, transcribe, work out the intent, run the
right thing.

## Action

The pipeline listens for a wake phrase, transcribes what follows using speech recognition,
and matches it against a set of command handlers. Each handler does one thing, so adding a
new capability is writing a function and registering it rather than editing a parser.

## Result

It works for the commands I built it for.

What I did not expect was where the difficulty actually was. I assumed the hard part would
be recognition accuracy, but transcription was mostly fine. The hard part was intent. People
phrase the same request several different ways, and when the assistant gets it wrong it
needs a sensible way to recover rather than confidently doing something you did not ask
for.

So most of my time went into the failure path rather than the happy path, which is not
where I expected to spend it.
