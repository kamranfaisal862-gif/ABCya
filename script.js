(function () {
  "use strict";

  var WORDS = {
    A: ["Apple", "🍎"], B: ["Butterfly", "🦋"], C: ["Cat", "🐱"], D: ["Dinosaur", "🦕"],
    E: ["Elephant", "🐘"], F: ["Fish", "🐟"], G: ["Giraffe", "🦒"], H: ["House", "🏠"],
    I: ["Ice cream", "🍦"], J: ["Jellyfish", "🪼"], K: ["Kite", "🪁"], L: ["Lion", "🦁"],
    M: ["Moon", "🌙"], N: ["Nest", "🪺"], O: ["Octopus", "🐙"], P: ["Pizza", "🍕"],
    Q: ["Queen", "👸"], R: ["Rainbow", "🌈"], S: ["Sun", "☀️"], T: ["Turtle", "🐢"],
    U: ["Umbrella", "☂️"], V: ["Volcano", "🌋"], W: ["Whale", "🐳"], X: ["Xylophone", "🎶"],
    Y: ["Yo-yo", "🪀"], Z: ["Zebra", "🦓"]
  };
  var COLORS = ["#ffcf3f", "#ff8fb1", "#59b8ff", "#5fd98a", "#b9a6ff", "#ffb066"];
  var CHEERS = ["Hooray! 🎉", "You're brilliant! ⭐", "Let's play! 🎈", "High five! ✋", "Great job! 🌈", "Wow, nice! 🚀", "Keep going! 💪"];

  var bigLetter = document.getElementById("bigLetter");
  var wordEl = document.getElementById("word");
  var emojiEl = document.getElementById("wordEmoji");
  var wordCard = document.querySelector(".word-card");
  var lettersEl = document.getElementById("letters");
  var speakBtn = document.getElementById("speak");
  var starCount = document.getElementById("starCount");
  var starsEl = document.getElementById("stars");
  var mascot = document.getElementById("mascot");
  var bubble = document.getElementById("bubble");

  var current = "A";
  var stars = 0;
  var cheerIndex = 0;

  function restartAnim(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function select(letter, btn) {
    current = letter;
    var w = WORDS[letter];
    bigLetter.textContent = letter;
    bigLetter.style.background = COLORS[letter.charCodeAt(0) % COLORS.length];
    emojiEl.textContent = w[1];
    wordEl.textContent = letter + " is for " + w[0];
    restartAnim(bigLetter, "pop");
    restartAnim(wordCard, "pop");

    var pressed = lettersEl.querySelector('[aria-pressed="true"]');
    if (pressed) pressed.setAttribute("aria-pressed", "false");
    if (btn) btn.setAttribute("aria-pressed", "true");

    stars += 1;
    starCount.textContent = String(stars);
    starsEl.textContent = "⭐".repeat(Math.min(stars, 10));
  }

  function speak(text) {
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      u.pitch = 1.2;
      window.speechSynthesis.speak(u);
    } catch (e) { /* speech is a nice-to-have */ }
  }

  Object.keys(WORDS).forEach(function (letter) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "letter";
    b.textContent = letter;
    b.style.background = COLORS[letter.charCodeAt(0) % COLORS.length];
    b.setAttribute("aria-pressed", letter === "A" ? "true" : "false");
    b.setAttribute("aria-label", "Letter " + letter + ", " + WORDS[letter][0]);
    b.addEventListener("click", function () {
      select(letter, b);
      speak(letter + " is for " + WORDS[letter][0]);
    });
    lettersEl.appendChild(b);
  });

  speakBtn.addEventListener("click", function () {
    speak(current + " is for " + WORDS[current][0]);
  });

  mascot.addEventListener("click", function () {
    cheerIndex = (cheerIndex + 1) % CHEERS.length;
    bubble.textContent = CHEERS[cheerIndex];
  });

  bigLetter.style.background = COLORS["A".charCodeAt(0) % COLORS.length];

  // Grown-up sign-up form -> /api/signup (Vercel function + MongoDB)
  var form = document.getElementById("signupForm");
  var msg = document.getElementById("suMsg");
  var btn = document.getElementById("suBtn");

  function say(text, kind) {
    msg.textContent = text;
    msg.className = "form-msg " + (kind || "");
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        website: form.elements.website.value
      };
      if (!data.name) { say("Please enter your name.", "err"); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) { say("Please enter a valid email address.", "err"); return; }

      btn.disabled = true;
      say("Sending…", "");
      fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; });
        })
        .then(function (res) {
          if (res.status === 200 && res.body.ok) {
            say(res.body.already ? "You're already on the list. Thank you! 🌟" : "You're in! Thank you for joining 🎉", "ok");
            form.reset();
          } else {
            say(res.body.error || "Sign-ups aren't available here. Please try again later.", "err");
          }
        })
        .catch(function () {
          say("We couldn't reach the server. Please try again.", "err");
        })
        .then(function () { btn.disabled = false; });
    });
  }
})();
