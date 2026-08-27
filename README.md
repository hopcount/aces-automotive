# Aces Automotive — rebuilt site

This is a rebuild of acesautomotive.com.au, sourced from a Wayback Machine
snapshot (2026-04-13) after the original site and its backups were lost.
It's a plain static HTML/CSS/JS site (no WordPress/database needed), with a
small PHP script to handle the contact/booking form.

## What's real vs. placeholder

Real content pulled from the archive:
- All page copy (home, about, contact, and the 5 service pages)
- Logo (`images/ace-automotive.png`), favicon, the "who we are" workshop
  photo, and the review-star icon

Placeholder (gray box) images, to be swapped for real photos later:
- Service page hero images (roadworthy, car service, panel beating, auto
  electrical, LPG conversion, mechanic)
- The "workshop" photo on the About page

To swap a placeholder for a real photo, replace the `<div class="placeholder-img">…</div>`
block in the relevant page with an `<img>` tag pointing at a file you add
under `images/`.

## Structure

```
index.html                     Home
about/index.html               About Us
contact/index.html             Contact Us
roadworthy-certificate-dandenong/index.html
car-service-dandenong/index.html
panel-beater-dandenong/index.html
auto-electrician-dandenong/index.html
lpg-conversion-dandenong/index.html
mechanic-dandenong/index.html
css/style.css                  All styling
js/main.js                     Nav toggle + form submission
images/                        Real logo/photo assets recovered from archive
php/contact-handler.php        Server-side form handler (emails submissions)
build.py                       Regenerates all HTML from this file — edit
                                content here, not the HTML directly, if you
                                want changes to survive a rebuild
```

Pages use root-relative links (`/css/style.css`, `/about/`, etc.), so the
site needs to be served by a web server — it won't render correctly if you
just double-click the HTML files. For local preview:

```
cd aces  # this folder
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Deploying with the contact form

`php/contact-handler.php` is a plain PHP script (no dependencies) that
emails form submissions to aces_autos@yahoo.com.au using PHP's built-in
`mail()`. It'll work as-is on most standard PHP hosting (cPanel, etc).

If your host's `mail()` doesn't reliably deliver (common on cheap shared
hosting or if you're not hosting on PHP at all — e.g. Netlify/Vercel),
swap it for:
- An SMTP-based sender (PHPMailer configured with your host's SMTP
  credentials), or
- A transactional email API/serverless function (SendGrid, Postmark,
  Mailgun, a Netlify/Vercel function, etc.) — keep the same request
  shape (`POST` with `name`, `phone`, `email`, `service`, `message`
  fields) and `js/main.js` won't need to change.

## Regenerating the site

Editing the raw HTML files works, but changes will be overwritten if
`build.py` is re-run. If you're going to keep iterating, it's easier to
edit the content in `build.py` (it's just Python string templates) and
re-run:

```
python3 build.py
```
