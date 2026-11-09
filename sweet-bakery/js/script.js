'use strict';

document.addEventListener('DOMContentLoaded', () => {
    setFooterYear();
    setupScrollReveal();
    setupMenuFilter();
    setupContactForm();
});

/* ---------- Footer: keep the copyright year current ---------- */
function setFooterYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

/* ---------- Animation: fade sections in as they scroll into view ---------- */
function setupScrollReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    const reducedMotion = typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window) || reducedMotion) {
        items.forEach((item) => item.classList.add('visible'));
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    items.forEach((item) => observer.observe(item));
}

/* ---------- Menu page: filter by category ---------- */
function setupMenuFilter() {
    const buttons = document.querySelectorAll('.filter-btn');
    const sections = document.querySelectorAll('[data-category]');
    if (!buttons.length) return;

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;

            buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
            sections.forEach((section) => {
                section.hidden = !(filter === 'all' || section.dataset.category === filter);
            });
        });
    });
}

/* ---------- Contact page: client-side form validation ---------- */
function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const status = document.getElementById('form-status');
    const enquiry = form.elements['enquiry'];
    const dateGroup = document.getElementById('date-group');
    const dateInput = form.elements['date'];
    const message = form.elements['message'];
    const counter = document.getElementById('message-count');

    // Custom cakes need at least 2 days notice (matches the Menu page)
    dateInput.min = formatDate(addDays(new Date(), 2));

    const validators = {
        name: (value) =>
            value.trim().length < 2 ? 'Please enter your name (at least 2 characters).' : '',

        email: (value) =>
            /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
                ? ''
                : 'Please enter a valid email address, e.g. name@example.com.',

        phone: (value) => {
            const v = value.trim();
            if (v === '') return ''; // optional field
            return /^[0-9+()\s-]{7,15}$/.test(v)
                ? ''
                : 'Phone numbers can only use digits, spaces, + ( ) - and must be 7 to 15 characters.';
        },

        enquiry: (value) => (value ? '' : 'Please choose what your enquiry is about.'),

        date: (value) => {
            if (enquiry.value !== 'custom-cake') return ''; // only needed for custom cakes
            if (!value) return 'Please choose the date you need your cake.';
            if (value < dateInput.min) return 'Custom cakes need at least 2 days notice. Please pick a later date.';
            return '';
        },

        message: (value) =>
            value.trim().length < 10 ? 'Please write a message of at least 10 characters.' : ''
    };

    function validateField(field) {
        const check = validators[field.name];
        if (!check) return true;

        const errorMessage = check(field.value);
        const errorEl = document.getElementById(field.id + '-error');

        errorEl.textContent = errorMessage;
        field.setAttribute('aria-invalid', errorMessage ? 'true' : 'false');
        field.classList.toggle('invalid', Boolean(errorMessage));
        return !errorMessage;
    }

    const fields = Array.from(form.elements).filter((el) => validators[el.name]);

    // Validate when leaving a field, then keep re-checking while the user fixes it
    fields.forEach((field) => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.classList.contains('invalid')) validateField(field);
        });
    });

    // Show the date field only for custom cake enquiries
    enquiry.addEventListener('change', () => {
        const isCake = enquiry.value === 'custom-cake';
        dateGroup.hidden = !isCake;
        dateInput.required = isCake;
        if (!isCake) {
            dateInput.value = '';
            validateField(dateInput);
        }
    });

    // Live character counter on the message box
    message.addEventListener('input', () => {
        counter.textContent = message.value.length + ' / ' + message.maxLength;
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        status.textContent = '';
        status.className = 'form-status';

        const results = fields.map((field) => ({ field, valid: validateField(field) }));
        const firstInvalid = results.find((r) => !r.valid);

        if (firstInvalid) {
            status.textContent = 'Please fix the highlighted fields and try again.';
            status.classList.add('failure');
            firstInvalid.field.focus();
            return;
        }

        // No back-end for this project, so we confirm on screen only
        status.textContent = 'Thank you, ' + form.elements['name'].value.trim() +
            '! Your enquiry has been received and we will be in touch soon.';
        status.classList.add('success');

        form.reset();
        dateGroup.hidden = true;
        counter.textContent = '0 / ' + message.maxLength;
        fields.forEach((field) => {
            field.classList.remove('invalid');
            field.setAttribute('aria-invalid', 'false');
            document.getElementById(field.id + '-error').textContent = '';
        });
    });
}

/* ---------- Date helpers ---------- */
function addDays(date, days) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}
