// Yard sign request form - validation and submission.
//
// Lives in its own file rather than inline: production nginx sends
// `script-src 'self' static.getclicky.com` with no 'unsafe-inline', so an inline <script>
// is silently blocked and the form loses all validation. Keep this external.
//
// main.js already handles per-field blur validation (required, email format, phone format)
// for every input on the page, so this file only guards the submit and the rules main.js
// cannot know about.

(function () {
    const form = document.getElementById('yard-sign-form');
    if (!form) return;

    const THANK_YOU_URL = '/thank-you-yardsign.html';

    const REQUIRED_TEXT_FIELDS = [
        'first-name', 'last-name', 'email', 'mobile-phone',
        'street-address', 'city', 'zip'
    ];

    function clearGroupError(fieldset) {
        const existing = fieldset.querySelector('.group-error');
        if (existing) existing.remove();
    }

    function showGroupError(fieldset, message) {
        clearGroupError(fieldset);
        const div = document.createElement('div');
        div.className = 'group-error';
        div.textContent = message;
        fieldset.appendChild(div);
    }


    function showFieldError(input, message) {
        input.classList.add('error');
        const existing = input.parentNode.querySelector('.error-message');
        if (existing) existing.remove();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
    }

    function validate() {
        let firstInvalid = null;

        // Re-evaluate from scratch so messages resolved since the last attempt go away.
        // main.js also clears a field's error as you type, but don't rely on that: a field
        // fixed without an input event (autofill, programmatic) would keep a stale message.
        form.querySelectorAll('.group-error, .error-message').forEach(el => el.remove());
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

        REQUIRED_TEXT_FIELDS.forEach(id => {
            const input = document.getElementById(id);
            const value = input.value.trim();
            let message = '';

            if (!value) {
                message = 'This field is required.';
            } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                message = 'Please enter a valid email address.';
            } else if (input.type === 'tel' && !/^[\+]?[\s\-\(\)]?[\d\s\-\(\)]{10,}$/.test(value)) {
                message = 'Please enter a valid phone number.';
            } else if (id === 'zip' && !/^\d{5}(-\d{4})?$/.test(value)) {
                message = 'Please enter a 5-digit ZIP code.';
            }

            if (message) {
                showFieldError(input, message);
                if (!firstInvalid) firstInvalid = input;
            }
        });

        return firstInvalid;
    }

    function showNotWiredNotice() {
        document.querySelector('.form-card').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: var(--secondary); margin-bottom: 20px;">Sign requests aren't open just yet</h2>
                <p style="font-size: 18px; margin-bottom: 30px;">
                    We're still setting this up and the form isn't accepting requests yet.
                    Please check back shortly &mdash; or reach out directly and we'll get a
                    sign to you.
                </p>
                <p style="margin-bottom: 30px;">
                    <a href="mailto:denisedye4noblesville@gmail.com">denisedye4noblesville@gmail.com</a>
                    &nbsp;&middot;&nbsp;
                    <a href="tel:+13172234130">(317) 223-4130</a>
                </p>
                <a href="../index.html" class="btn btn-primary">Return to Campaign Home</a>
            </div>
        `;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    form.addEventListener('submit', function (e) {
        const firstInvalid = validate();

        if (firstInvalid) {
            e.preventDefault();
            firstInvalid.focus();
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const action = form.getAttribute('action');

        if (!action) {
            e.preventDefault();
            showNotWiredNotice();
            return;
        }

        // Post in the background rather than letting the browser navigate to the endpoint.
        // A Google Apps Script /exec URL answers a native form POST with its own Google-
        // hosted page, which would dump the visitor onto a raw script.google.com screen.
        //
        // mode 'no-cors' is required: Apps Script web apps cannot set CORS response headers.
        // The trade-off is an opaque response - we cannot read the status, so "request sent"
        // is treated as success and only a network-level failure surfaces an error.
        e.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        const originalLabel = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        // urlencoded is a CORS-safelisted content type, so the request stays preflight-free.
        const body = new URLSearchParams(new FormData(form));

        fetch(action, { method: 'POST', mode: 'no-cors', body: body })
            .then(function () {
                window.location.href = THANK_YOU_URL;
            })
            .catch(function () {
                submitButton.disabled = false;
                submitButton.textContent = originalLabel;
                showGroupError(
                    form.querySelector('.form-actions'),
                    "Sorry - we couldn't send that just now. Please try again, or email denisedye4noblesville@gmail.com."
                );
            });
    });
})();
