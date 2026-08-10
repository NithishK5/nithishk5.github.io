# Moving nithishk.com to this repo

The custom domain is currently attached to the old repository
(`NithishK5/nithishk.github.io`). A domain can only be bound to one GitHub Pages
site at a time, so this repo deliberately ships **without** a `public/CNAME`
file. The first deploy lands at <https://nithishk5.github.io> and the existing
site at nithishk.com keeps running untouched.

## When you are happy with the new site

1. **Old repo** → Settings → Pages → Custom domain → clear the field and save.
2. **This repo** → recreate the CNAME file and push:

   ```bash
   echo "nithishk.com" > public/CNAME
   git add public/CNAME
   git commit -m "chore: attach nithishk.com custom domain"
   git push
   ```

3. **This repo** → Settings → Pages → Custom domain → enter `nithishk.com`, save.
4. Wait for the certificate to be issued, then tick **Enforce HTTPS**.

DNS should already be correct if the domain was working before, but to confirm,
the apex needs four `A` records pointing at:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

and `www` needs a `CNAME` record pointing at `nithishk5.github.io`.

## Note on canonical URLs

`astro.config.mjs` sets `site: 'https://nithishk.com'`, which is the intended
final address. Until the domain moves, canonical tags, the sitemap and the
social preview image will point at nithishk.com rather than at
nithishk5.github.io. This resolves itself the moment step 3 is done, and it
avoids the two addresses competing as duplicate content in the meantime.
