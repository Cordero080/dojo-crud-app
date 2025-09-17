// Removes already-learned names from the combobox data-source
// and shows the "Master Yoda" note if nothing remains.
(function () {
  var root = document.querySelector('.combo');
  if (!root) return;

  try {
    var src = JSON.parse(root.dataset.source || "[]");
    var learned = new Set(JSON.parse(root.dataset.learned || "[]"));

    var filtered = src.filter(function (n) {
      return !learned.has(String(n).toLowerCase());
    });

    root.dataset.source = JSON.stringify(filtered);

    if (filtered.length === 0) {
      var note = document.getElementById('combo-empty-note');
      if (note) note.style.display = 'block';
    }
  } catch (e) {
    console.warn('Combobox prefilter failed:', e);
  }
})();
