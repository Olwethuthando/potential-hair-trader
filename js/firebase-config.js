/* ==========================================================================
   FIREBASE CONFIGURATION — fill this in before the booking system will work.

   This is the free database that lets the site remember bookings and let
   both the client and Promise see the same live slot availability, even
   though the site itself is hosted on GitHub Pages.

   HOW TO GET THESE VALUES (free, takes about 10 minutes):
   1. Go to https://console.firebase.google.com and sign in with the
      DEVELOPER's own Google account (your account, not the client's).
   2. Click "Add project", name it something like "potential-hair-trader",
      and finish the setup wizard (Google Analytics can be switched off).
   3. In the left menu, open "Build" > "Firestore Database" > "Create
      database". Start it in test mode for now — we will tighten the rules
      below once everything works.
   4. In the left menu, open "Build" > "Authentication" > "Get started",
      enable the "Email/Password" sign-in method, then go to the "Users"
      tab and add one user: email hairtraderpotential@gmail.com + a password you
      choose and give to Promise. That's her login for admin.html (it does
      not have to be a Google login — it's just an email and password).
   5. Back on the Project Overview page, click the "</>" (Web) icon to
      register a web app (any nickname is fine). Firebase will show you a
      block of code containing exactly the six values below — copy each
      one into its matching spot underneath.
   ========================================================================== */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBUyufJj5xfjOU7PekWwOlGbeR92V2Pr-A",
    authDomain: "potential-hair-trader.firebaseapp.com",
    projectId: "potential-hair-trader",
    storageBucket: "potential-hair-trader.firebasestorage.app",
    messagingSenderId: "455063028093",
    appId: "1:455063028093:web:653c983966999b62c64c14"
};