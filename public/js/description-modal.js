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
  // Scramble text effect for Save and Cancel buttons only, using their own letters and upside-down Unicode
  function toUpsideDown(str) {
    // Basic upside-down mapping for Latin letters
    const map = {
      a: "ɐ",
      b: "q",
      c: "ɔ",
      d: "p",
      e: "ǝ",
      f: "ɟ",
      g: "ƃ",
      h: "ɥ",
      i: "ᴉ",
      j: "ɾ",
      k: "ʞ",
      l: "ʃ",
      m: "ɯ",
      n: "u",
      o: "o",
      p: "d",
      q: "b",
      r: "ɹ",
      s: "s",
      t: "ʇ",
      u: "n",
      v: "ʌ",
      w: "ʍ",
      x: "x",
      y: "ʎ",
      z: "z",
      A: "∀",
      B: "𐐒",
      C: "Ɔ",
      D: "◖",
      E: "Ǝ",
      F: "Ⅎ",
      G: "פ",
      H: "H",
      I: "I",
      J: "ſ",
      K: "ʞ",
      L: "˥",
      M: "W",
      N: "N",
      O: "O",
      P: "Ԁ",
      Q: "Ό",
      R: "ᴚ",
      S: "S",
      T: "⊥",
      U: "∩",
      V: "Λ",
      W: "M",
      X: "X",
      Y: "⅄",
      Z: "Z",
    };
    return str
      .split("")
      .map((c) => map[c] || c)
      .reverse()
      .join("");
  }
  function scrambleOwnLetters(element, original, duration = 600) {
    const chars = original.replace(/[^a-zA-Z]/g, "").split("");
    let frame = 0;
    const scramble = () => {
      let scrambled = chars
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join("");
      scrambled = toUpsideDown(scrambled);
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
  if (saveBtn) {
    const originalSave = saveBtn.textContent;
    saveBtn.addEventListener("mouseenter", function () {
      scrambleOwnLetters(saveBtn, originalSave);
    });
    saveBtn.addEventListener("mouseleave", function () {
      saveBtn.textContent = originalSave;
    });
  }
  if (cancelBtn) {
    const originalCancel = cancelBtn.textContent;
    cancelBtn.addEventListener("mouseenter", function () {
      scrambleOwnLetters(cancelBtn, originalCancel);
    });
    cancelBtn.addEventListener("mouseleave", function () {
      cancelBtn.textContent = originalCancel;
    });
  }
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
