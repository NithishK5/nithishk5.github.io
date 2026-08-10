---
title: Passkey
summary: Passwordless authentication with WebAuthn, built as a containerised Express service to understand the flow properly rather than through a library.
category: Security
stack: [TypeScript, Express, WebAuthn, Docker]
repo: https://github.com/NithishK5/passkeys-express
year: 2024
featured: true
order: 5
---

## Situation

Passwords are the weakest part of most systems I had built. They get reused, they get
phished, and if you store them you are now responsible for a database worth stealing.
Passkeys remove that whole category of problem, and I wanted to understand how rather than
just drop in a library.

## Task

Implement the Web Authentication API properly, both the registration and the authentication
ceremonies, and get it running in a way someone else could actually start up and try.

## Action

I built it as an Express service in TypeScript.

The registration ceremony generates a challenge, sends it to the browser, and verifies the
attestation that comes back before storing the public key. The authentication ceremony
issues a fresh challenge and checks the signature against the stored key. The private key
never leaves the user's device at any point, which is the whole reason the approach works.

Getting the challenge verification right was the fiddly part. It is the piece that stops
replay attacks and it is easy to get almost right in a way that looks like it works.

I containerised the whole thing with Docker so the full flow runs with one command, since
WebAuthn needs a specific origin setup and I did not want that to be the reason someone
gave up on it.

## Result

Working passwordless registration and login, no password stored anywhere in the system.

What stuck with me is that the security comes from the design rather than from being
careful. There is no shared secret to steal, so a database breach does not hand anyone an
account. That is a much better position than hashing passwords well.
