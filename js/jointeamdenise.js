// Join Team Denise - signup form validation and submission.
//
// This lives in its own file rather than inline in the page on purpose: production nginx
// sends `script-src 'self' static.getclicky.com` with no 'unsafe-inline', so an inline
// <script> is silently blocked and the form loses all validation. Keep this external.
//
// main.js already handles per-field blur validation (required, email format, phone format)
// for every input on the page, so this file only guards whole-group rules and the submit.

(function () {
    const form = document.getElementById('join-team-form');
    if (!form) return;

    const THANK_YOU_URL = '/thank-you.html';

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

    // Clear a group error as soon as the visitor answers that group.
    form.querySelectorAll('input[name="help"], input[name="sms_consent"]').forEach(input => {
        input.addEventListener('change', function () {
            clearGroupError(this.closest('fieldset'));
        });
    });

    function validate() {
        let firstInvalid = null;

        // Re-evaluate from scratch so messages resolved since the last attempt go away.
        form.querySelectorAll('.group-error').forEach(el => el.remove());

        ['first-name', 'last-name', 'email', 'mobile-phone'].forEach(id => {
            const input = document.getElementById(id);
            const value = input.value.trim();
            let message = '';

            if (!value) {
                message = 'This field is required.';
            } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                message = 'Please enter a valid email address.';
            } else if (input.type === 'tel' && !/^[\+]?[\s\-\(\)]?[\d\s\-\(\)]{10,}$/.test(value)) {
                message = 'Please enter a valid phone number.';
            }

            if (message) {
                input.classList.add('error');
                const existing = input.parentNode.querySelector('.error-message');
                if (existing) existing.remove();
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = message;
                input.parentNode.insertBefore(errorDiv, input.nextSibling);
                if (!firstInvalid) firstInvalid = input;
            }
        });

        // At least one way to help.
        const helpGroup = document.getElementById('help-group');
        if (!form.querySelector('input[name="help"]:checked')) {
            showGroupError(helpGroup, 'Please select at least one way you would like to help.');
            if (!firstInvalid) firstInvalid = helpGroup.querySelector('input[name="help"]');
        }

        // A text-messaging answer, either way. Silence is not consent.
        const smsGroup = document.getElementById('sms-group');
        if (!form.querySelector('input[name="sms_consent"]:checked')) {
            showGroupError(smsGroup, 'Please let us know whether we may text you.');
            if (!firstInvalid) firstInvalid = document.getElementById('sms-yes');
        }

        return firstInvalid;
    }

    function showNotWiredNotice() {
        document.querySelector('.form-card').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: var(--secondary); margin-bottom: 20px;">Sign-ups aren't open just yet</h2>
                <p style="font-size: 18px; margin-bottom: 30px;">
                    We're putting the finishing touches on our volunteer system and this
                    form isn't accepting submissions yet. Please check back shortly &mdash;
                    or reach out directly and we'll get you on the list right now.
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

        // No endpoint configured yet - say so rather than appearing to silently fail.
        if (!action) {
            e.preventDefault();
            showNotWiredNotice();
            return;
        }

        // Post in the background instead of letting the browser navigate to the endpoint.
        // A Google Apps Script /exec URL answers a native form POST with its own Google-
        // hosted response page, which would dump the visitor onto a raw script.google.com
        // screen. Submitting here lets us keep them on our own thank-you page.
        //
        // mode 'no-cors' is required: Apps Script web apps cannot set CORS response headers,
        // so a normal cross-origin POST would be rejected. The trade-off is an opaque
        // response - we cannot read the status, so we treat "request sent" as success and
        // only surface an error if the network call itself fails.
        e.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        const originalLabel = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        // URLSearchParams keeps repeated keys (help, availability, skills) as repeats, and
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
