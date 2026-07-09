// ============================================================
// FIREBASE CONFIG — fill this in to make the Tracker tab shared
// across everyone who visits the site. Until you do, the Tracker
// falls back to browser-only storage (DEMO MODE banner shows).
//
// How to get these values (free, ~5 minutes):
// 1. Go to https://console.firebase.google.com and create a project
//    (name it something like "nsbe-utsa-tracker").
// 2. In the project, click the "</>" (web app) icon to register a
//    new web app. Skip Firebase Hosting unless you want it.
// 3. Firebase shows you a config object — copy those values below.
// 4. In the left sidebar, go to Build > Firestore Database > Create
//    database. Start in "test mode" for now (it's fine for an
//    internal chapter tool — see the README for the security note).
// 5. Save this file, push to your repo, done. No further setup.
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Do not edit below this line.
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.FIREBASE_READY = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
