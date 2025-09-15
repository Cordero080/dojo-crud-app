document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".restore-link").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const id = a.dataset.id;
      document.getElementById(`restore-${id}`)?.submit();
    });
  });

  document.querySelectorAll(".hard-link").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const id = a.dataset.id;
      // Show custom overlay
      const overlay = document.getElementById("hard-delete-overlay");
      overlay.style.display = "flex";
      // Store the id for later
      overlay.dataset.formId = id;
    });
  });

  // Overlay button logic
  const overlay = document.getElementById("hard-delete-overlay");
  if (overlay) {
    const confirmBtn = document.getElementById("confirm-hard-delete-btn");
    const cancelBtn = document.getElementById("cancel-hard-delete-btn");
    confirmBtn?.addEventListener("click", () => {
      const id = overlay.dataset.formId;
      document.getElementById(`hard-${id}`)?.submit();
      overlay.style.display = "none";
      overlay.dataset.formId = "";
    });
    cancelBtn?.addEventListener("click", () => {
      overlay.style.display = "none";
      overlay.dataset.formId = "";
    });
  }
});
