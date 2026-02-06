// Hamburger menu toggle
document.addEventListener("DOMContentLoaded", function () {
  var hamburger = document.getElementById("hamburger-btn");
  var navLinks = document.getElementById("nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", function (e) {
      e.preventDefault();
      navLinks.classList.toggle("open");
      hamburger.classList.toggle("open");
      hamburger.setAttribute(
        "aria-expanded",
        navLinks.classList.contains("open"),
      );
    });
  }
});
