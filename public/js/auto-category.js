//file: public/js/auto-category.js -->

<script>
document.addEventListener('DOMContentLoaded', () => {
  const nameInput = document.getElementById('name');
  const category  = document.getElementById('category');
  if (!nameInput || !category) return;

  function inferCategory(n) {
    const s = (n || '').trim().toLowerCase();
    if (/kiso\s*kumite/.test(s)) return 'Kiso Kumite';
    if (/bunkai/.test(s))       return 'Bunkai';
    if (/\b(bo|sai|tonfa|nunchaku|nunti[- ]?bo|tsuken|kama|knife)\b/.test(s)) return 'Weapon';
    if (/kata/.test(s))         return 'Kata';
    return 'Other';
  }

  function apply() {
    const v = inferCategory(nameInput.value);
    category.value = v; // matches your option values exactly
  }

  nameInput.addEventListener('input', apply);
  nameInput.addEventListener('blur', apply);
  apply(); // set once on load
});
</script>
