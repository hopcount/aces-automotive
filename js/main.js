// Aces Automotive — shared front-end behaviour

document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  // Contact / booking forms -> POST to the Azure Function at /api/contact
  var forms = document.querySelectorAll('form[data-aces-form]');
  forms.forEach(function (form) {
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot spam check
      var hp = form.querySelector('input[name="website"]');
      if (hp && hp.value) {
        return; // silently drop obvious bots
      }

      if (status) {
        status.textContent = 'Sending…';
        status.className = 'form-status';
      }

      var data = new FormData(form);

      fetch('/api/contact', {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      })
        .then(function (res) { return res.json().catch(function () { return { ok: res.ok }; }); })
        .then(function (json) {
          if (json && json.ok) {
            form.reset();
            if (status) {
              status.textContent = 'Thanks — we\'ve received your message and will be in touch shortly.';
              status.className = 'form-status ok';
            }
          } else {
            throw new Error((json && json.error) || 'Something went wrong');
          }
        })
        .catch(function (err) {
          if (status) {
            status.textContent = 'Sorry, we could not send that just now. Please call us on 0404 236 881 instead.';
            status.className = 'form-status err';
          }
          console.error('Form submit failed:', err);
        });
    });
  });
});
