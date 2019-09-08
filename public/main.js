// Initialize Firebase App
var config = {
  apiKey: "AIzaSyAorlPflc7AxMf4bjm2BNbzvA7gUevCI9Y",
  authDomain: "mirobot-testing.firebaseapp.com",
  databaseURL: "https://mirobot-testing.firebaseio.com",
  projectId: "mirobot-testing",
  storageBucket: "mirobot-testing.appspot.com",
  messagingSenderId: "1038810970399",
  appId: "1:1038810970399:web:1da88875d3d6b5d42e582a"
};
firebase.initializeApp(config);
//

// Define database as firestore
database = firebase.firestore()

// Define what happens when the submit button is clicked
function submitButtonClick() {
  field = document.getElementById("field1");
  sendText(field.value)
  field.value = null;
}

// Send text textContent to the firestore "texts" collection under a pseudorandom ID
function sendText(textContent) {
  // Add a new message entry to the Firebase database.
  return database.collection("texts").doc(generatePushID()).set({
    text: textContent,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(function(error) {
    console.error('Error writing new message to Firebase Database', error);
  });
}

/**
 * Fancy ID generator that creates 20-character string identifiers with the following properties:
 *
 * 1. They're based on timestamp so that they sort *after* any existing ids.
 * 2. They contain 72-bits of random data after the timestamp so that IDs won't collide with other clients' IDs.
 * 3. They sort *lexicographically* (so the timestamp is converted to characters that will sort properly).
 * 4. They're monotonically increasing.  Even if you generate more than one in the same timestamp, the
 *    latter ones will sort after the former ones.  We do this by using the previous random bits
 *    but "incrementing" them by 1 (only in the case of a timestamp collision).
 */
generatePushID = (function() {
    // Modeled after base64 web-safe chars, but ordered by ASCII.
    var PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
  
    // Timestamp of last push, used to prevent local collisions if you push twice in one ms.
    var lastPushTime = 0;
  
    // We generate 72-bits of randomness which get turned into 12 characters and appended to the
    // timestamp to prevent collisions with other clients.  We store the last characters we
    // generated because in the event of a collision, we'll use those same characters except
    // "incremented" by one.
    var lastRandChars = [];
  
    return function() {
      var now = new Date().getTime();
      var duplicateTime = (now === lastPushTime);
      lastPushTime = now;
  
      var timeStampChars = new Array(8);
      for (var i = 7; i >= 0; i--) {
        timeStampChars[i] = PUSH_CHARS.charAt(now % 64);
        // NOTE: Can't use << here because javascript will convert to int and lose the upper bits.
        now = Math.floor(now / 64);
      }
      if (now !== 0) throw new Error('We should have converted the entire timestamp.');
  
      var id = timeStampChars.join('');
  
      if (!duplicateTime) {
        for (i = 0; i < 12; i++) {
          lastRandChars[i] = Math.floor(Math.random() * 64);
        }
      } else {
        // If the timestamp hasn't changed since last push, use the same random number, except incremented by 1.
        for (i = 11; i >= 0 && lastRandChars[i] === 63; i--) {
          lastRandChars[i] = 0;
        }
        lastRandChars[i]++;
      }
      for (i = 0; i < 12; i++) {
        id += PUSH_CHARS.charAt(lastRandChars[i]);
      }
      if(id.length != 20) throw new Error('Length should be 20.');
  
      return id;
    };
  })();

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

ui.start('#firebaseui-auth-container', {
  signInOptions: [{
    provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
    signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
    // Allow the user the ability to complete sign-in cross device,
    // including the mobile apps specified in the ActionCodeSettings
    // object below.
    forceSameDevice: false,
    // Used to define the optional firebase.auth.ActionCodeSettings if
    // additional state needs to be passed along request and whether to open
    // the link in a mobile app if it is installed.
    emailLinkSignIn: function() {
      return {
        // Additional state showPromo=1234 can be retrieved from URL on
        // sign-in completion in signInSuccess callback by checking
        // window.location.href.
        url: 'https://www.example.com/completeSignIn?showPromo=1234',
        // Custom FDL domain.
        dynamicLinkDomain: 'example.page.link',
        // Always true for email link sign-in.
        handleCodeInApp: true,
        // Whether to handle link in iOS app if installed.
        iOS: {
          bundleId: 'com.example.ios'
        },
        // Whether to handle link in Android app if opened in an Android
        // device.
        android: {
          packageName: 'com.example.android',
          installApp: true,
          minimumVersion: '12'
        }
      };
    }
  },
    // List of OAuth providers supported.
    firebase.auth.GoogleAuthProvider.PROVIDER_ID
  ],
  // Other config options...
});