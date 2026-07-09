# NSBE UTSA — Opportunity Hub

A career hub for NSBE UTSA members: internships, scholarships, fellowships and
externships in one place; a shared no-login application tracker; a Wall of
Success featuring past members; and a directory of alumni/recruiter/faculty
connections.

Open `index.html` in a browser to run it locally, or host it the same way the
old tracker was hosted (e.g. GitHub Pages) — it's still a static site.

## What's new vs. the old tracker

| Tab | What it does | Who updates it |
|---|---|---|
| **Opportunities** | Same board as before, now with Internships + Scholarships + Fellowships + Externships, filterable by category | e-board, by editing `data/opportunities.csv` |
| **My Tracker** | Shared kanban board — any member types their name and logs an application, no login | Members, live, through the app |
| **Wall of Success** | Cards for past members and what they landed | e-board, by editing `data/alumni_success.csv` |
| **Network** | Directory of alumni, recruiters, faculty and corporate partners | e-board, by editing `data/partners.csv` |

A stats strip at the top ("Chapter Pulse") shows open opportunities, new this
week, applications logged, and offers landed — pulled live from the tracker.

## 1. Set up the shared tracker (5 minutes, free)

The Opportunities/Alumni/Network tabs work immediately — they just read CSV
files. The **Tracker** tab is different: it needs somewhere to write shared
data, since anyone should be able to add an entry without logging in. Until
you set this up, it runs in **demo mode** (a yellow banner appears, and
entries only save in that one member's browser).

To make it shared for real:

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)** and create a free project (e.g. `nsbe-utsa-tracker`).
2. Click the **`</>`** (web app) icon to register a web app. You can skip Firebase Hosting.
3. Firebase shows you a config object that looks like:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "nsbe-utsa-tracker.firebaseapp.com",
     projectId: "nsbe-utsa-tracker",
     storageBucket: "nsbe-utsa-tracker.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
   Copy those six values into `firebase-config.js` in this project.
4. In the left sidebar: **Build → Firestore Database → Create database**.
   Start in **test mode**. This gives open read/write access — see the
   security note below.
5. Save, commit, push. The banner disappears and the tracker is now shared
   and updates in real time for everyone who opens the site.

**Security note:** "Test mode" Firestore rules mean anyone who has the link
to your site can read and write tracker data — there's no login, by design,
per your chapter's preference. That's fine for an internal tool shared inside
the chapter. Just don't post the live link somewhere fully public (like a
public Instagram bio) without expecting the occasional joke entry. If you
outgrow this later, Firestore supports light rules (e.g. requiring a shared
chapter passphrase) without adding full user accounts — ask if you want that
added.

## 2. Updating the Opportunities board

Same workflow as before: edit `data/opportunities.csv`. Each row now has a
`category` column — use `Internship`, `Scholarship`, `Fellowship`, or
`Externship`. Before publishing new data, copy the current
`data/opportunities.csv` into `data/prev_opportunities.csv` first (that's how
the "New This Week" badge knows what's actually new).

Five example scholarship/fellowship/externship rows are seeded in already
(NSBE National Scholarships, GEM Fellowship, UNCF STEM Scholars, Google BOLD,
JPMorgan externships) — real programs, but deadlines are marked "varies" since
cycles shift year to year. Verify current dates before members rely on them,
and add more as your officers find them.

## 3. Adding to the Wall of Success

Edit `data/alumni_success.csv`. One row per alum:

```
id,name,grad_year,major,company,role,quote,linkedin,photo_url
priya-2023,Priya Nkemelu,2023,Computer Engineering,Cisco,Software Engineer II,"NSBE's mock interviews got me ready.",https://linkedin.com/in/...,
```

`photo_url` is optional — leave it blank and a card just shows the alum's
initials. The placeholder "example-entry" row is filtered out automatically
once you add real ones, so it's safe to leave in the file as a template.

## 4. Adding to the Network directory

Edit `data/partners.csv`. `connection_type` should be one of `Alumni`,
`Recruiter`, `Faculty Partner`, or `Corporate Partner` — those are the filter
options in the app. Only add people who've agreed to be listed as a point of
contact.

## Notes

- The tracker deliberately has no delete confirmation and no per-person
  ownership, matching "no login, shared, everyone can use it." If your
  chapter grows and this becomes a problem (e.g. people deleting others'
  entries), that's the point where light identity (a shared passphrase, or
  real accounts) would help — happy to add it later.
- Everything is still plain HTML/CSS/JS — no build step, no framework, so
  future e-board members can edit it the same way they edited the old one.
