# Potential Hair Trader — Website

Home, Services, About, Booking, and a private dashboard for Promise.

## What still needs doing before bookings work (about 20 minutes)

The site itself works the moment it is on GitHub Pages. Bookings need two free
services connected, because GitHub Pages can only host files:

### A. Firebase (stores bookings + live slot availability)

Follow the numbered steps at the top of `js/firebase-config.js`. Sign in to Firebase
with the **developer's own Google account** (the project belongs to you), then paste the
six keys into that file. Promise's dashboard login is created separately under
Authentication > Users (email: hairtraderpotential@gmail.com, plus a password you set).
Then, in Authentication > Settings > User actions, **untick "Enable create (sign-up)"**
so nobody else can make an account.

### B. Security rules (do this straight after A — important)

Firestore Database > Rules > replace everything with the rules below > Publish.
They keep client details private (only Promise can read them) while letting
visitors see which slots are taken.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner() {
      return request.auth != null
          && request.auth.token.email == 'hairtraderpotential@gmail.com';
    }
    // Client details: anyone can submit a request, only Promise can read/manage
    match /bookings/{id} {
      allow create: if true;
      allow read, update, delete: if isOwner();
    }
    // Public availability (date, time, status only — no personal info)
    match /slots/{id} {
      allow read: if true;
      allow create: if request.resource.data.status == 'pending' || isOwner();
      allow update, delete: if isOwner();   // this is what stops double-booking
    }
    // Promise's private time-off records
    match /blocks/{id} {
      allow read, write: if isOwner();
    }
  }
}
```

### C. EmailJS (sends the confirmation emails)

Follow the steps at the top of `js/email-config.js` (free, 200 emails/month).
Once connected:
- the client gets their booking confirmation (rules, deposit and banking details) the moment they book;
- they get a second "Booking Confirmed" email when Promise taps Accept;
- Promise gets an email each time a new request arrives.

If EmailJS isn't connected yet, nothing breaks: the client still sees the full
confirmation on screen (with copy / print / WhatsApp-proof buttons), and Promise
can send the confirmation from the dashboard with the **WhatsApp client** button.

## Publishing on GitHub Pages

1. New GitHub repository, upload the **contents** of this folder (keep `index.html`
   at the top with `css/`, `js/`, `assets/` beside it).
2. Settings > Pages > Source: "Deploy from a branch" > `main` / `(root)` > Save.
3. After a minute the live link appears there. Open `.../admin.html` for Promise's dashboard.
4. After pasting your Firebase / EmailJS keys, re-upload those two files
   (`js/firebase-config.js`, `js/email-config.js`).

The Firebase and EmailJS "public" keys are meant to be visible in the site's code;
the security rules above are what protect the data.

## Testing on your computer vs. online

Unzip the folder and double-click `index.html` — every page, the photos and the
browser icon work straight from the folder. Online booking data and the
dashboard **login** only work from the published GitHub Pages link (Firebase
doesn't allow sign-in from a file on your computer), so test those there.

## Editing things

- `js/services-data.js` — service names and options (updates the whole site).
- `js/config.js` — open days and appointment times.
- `js/confirmation.js` — the booking rules and banking details shown in confirmations.
- `assets/images/` — all photos and the logo.
- Browser-tab icon: `favicon.ico` (top level) plus `assets/images/favicon-*.png`, `icon-*.png` and `apple-touch-icon.png`, all made from the logo. To change the icon, replace those files.
