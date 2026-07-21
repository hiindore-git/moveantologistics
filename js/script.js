// ============================================================
// Movento Logistics — site behaviour
// ============================================================

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Scroll-reveal for service cards etc.
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('in'));
}

// ============================================================
// Quote form — client-side validation + submission
//
// This form posts to FormSubmit.co, a free form-to-email
// relay that requires no backend server. On first deploy:
//   1. Replace YOUR_EMAIL_HERE below with the inbox that
//      should receive quote requests.
//   2. Submit the form once from the live site — FormSubmit
//      sends a one-time confirmation link to that inbox.
//      Click it to activate delivery. Every submission after
//      that arrives by email automatically.
// No FormSubmit account or signup is required.
// If you'd rather use your own backend, replace the fetch()
// call below with a request to your own API endpoint.
// ============================================================
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/hiindore@gmail.com';

const form = document.getElementById('quoteForm');
const statusBox = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

function setStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = 'form-status show ' + type;
}

function validateForm(data) {
  let valid = true;
  const requiredFields = ['fullName', 'email', 'origin', 'destination', 'service'];

  form.querySelectorAll('.field').forEach(f => f.classList.remove('has-error'));

  requiredFields.forEach(name => {
    const value = (data.get(name) || '').trim();
    const input = form.querySelector(`[name="${name}"]`);
    if (!value) {
      valid = false;
      input.closest('.field').classList.add('has-error');
    }
  });

  const email = (data.get('email') || '').trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailPattern.test(email)) {
    valid = false;
    form.querySelector('[name="email"]').closest('.field').classList.add('has-error');
  }

  return valid;
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusBox.className = 'form-status';

    const data = new FormData(form);

    // Honeypot check — bots tend to fill every field
    if ((data.get('companyWebsite') || '').trim() !== '') {
      return;
    }

    if (!validateForm(data)) {
      setStatus('Please fill in the required fields highlighted below.', 'err');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const payload = {
      _subject: `New freight quote request — ${data.get('fullName')}`,
      name: data.get('fullName'),
      company: data.get('companyName'),
      email: data.get('email'),
      phone: data.get('phone'),
      origin: data.get('origin'),
      destination: data.get('destination'),
      service: data.get('service'),
      preferred_pickup_date: data.get('pickupDate'),
      shipment_details: data.get('details'),
      _template: 'table'
    };

    try {
      if (FORM_ENDPOINT.includes('YOUR_EMAIL_HERE')) {
        // Endpoint not configured yet — simulate success locally so the
        // form remains testable before deployment/email setup.
        await new Promise(res => setTimeout(res, 700));
        console.info('Quote request (demo mode, not sent):', payload);
        setStatus('Demo mode: form validated successfully. Add a destination email in js/script.js to send real submissions.', 'ok');
        form.reset();
      } else {
        const response = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Request failed');
        setStatus('Thanks! Your quote request has been sent. A Movento coordinator will follow up within one business day.', 'ok');
        form.reset();
      }
    } catch (err) {
      setStatus('Something went wrong sending your request. Please email quotes@moventologistics.com directly.', 'err');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Request My Quote';
    }
  });
}
