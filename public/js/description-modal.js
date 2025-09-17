// public/js/description-modal.js
// Handles the futuristic modal popup for the description textarea in new.ejs

document.addEventListener("DOMContentLoaded", function () {
  const descBox = document.getElementById("description");
  const modal = document.querySelector(".desc-modal");
  const modalContent = modal && modal.querySelector(".desc-modal-content");
  const modalTextarea = modalContent && modalContent.querySelector("textarea");
  const saveBtn = modalContent && modalContent.querySelector("button.save-btn");
  const cancelBtn =
    modalContent && modalContent.querySelector("button.cancel-btn");
  // Scramble text effect for all buttons
  function scrambleText(element, original, duration = 600) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=<>?";
    let frame = 0;
    const scramble = () => {
      let scrambled = "";
      for (let i = 0; i < original.length; i++) {
        scrambled += chars[Math.floor(Math.random() * chars.length)];
      }
      element.textContent = scrambled;
      frame++;
      if (frame < 12) {
        setTimeout(scramble, duration / 12);
      } else {
        element.textContent = original;
      }
    };
    scramble();
  }
  document.querySelectorAll("button").forEach((btn) => {
    const original = btn.textContent;
    btn.classList.add("scramble");
    btn.addEventListener("mouseenter", function () {
      scrambleText(btn, original);
    });
  });
  if (
    descBox &&
    modal &&
    modalContent &&
    modalTextarea &&
    saveBtn &&
    cancelBtn
  ) {
    descBox.addEventListener("focus", openModal);
    descBox.addEventListener("click", openModal);
    function openModal() {
      modal.style.display = "flex";
      modalTextarea.value = descBox.value;
      setTimeout(() => modalTextarea.focus(), 100);
    }
    saveBtn.addEventListener("click", function () {
      descBox.value = modalTextarea.value;
      modal.style.display = "none";
    });
    cancelBtn.addEventListener("click", function () {
      modal.style.display = "none";
    });
    modalTextarea.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        modal.style.display = "none";
      }
    });
  }
});
