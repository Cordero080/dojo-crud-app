// Scramble effect for nav links on hover (only real letters)
// Place in /public/js/nav-scramble.js

document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav a");

  navLinks.forEach((link) => {
    const original = link.textContent;
    let scrambleInterval = null;

    function scrambleText() {
      const chars = original.split("");
      let scrambled = chars.map((c) => {
        if (/[a-zA-Z]/.test(c)) {
          // Pick a random letter from the original text
          return chars[Math.floor(Math.random() * chars.length)];
        }
        return c;
      });
      link.textContent = scrambled.join("");
    }

    link.addEventListener("mouseenter", () => {
      let count = 0;
      scrambleInterval = setInterval(() => {
        scrambleText();
        count++;
        if (count > 12) {
          clearInterval(scrambleInterval);
          link.textContent = original;
        }
      }, 35);
    });
    link.addEventListener("mouseleave", () => {
      clearInterval(scrambleInterval);
      link.textContent = original;
    });
  });
});
