// Campaign Website JavaScript - Denise Dye for School Board

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // The standalone pages under forms/ load this script but have no nav header, so every
    // nav interaction is guarded. Without the guard the null dereference here throws and
    // aborts the rest of this handler, taking form validation down with it.
    if (navToggle && navMenu) {
        // Toggle mobile menu
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });

        // Close mobile menu when clicking a nav link
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target) || navToggle.contains(event.target);
            if (!isClickInsideNav && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    }

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 140; // Account for fixed header
                const elementPosition = target.offsetTop;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Active Navigation Highlighting
    const sections = document.querySelectorAll('section[id]');

    function highlightNavigation() {
        let current = '';
        const scrollPos = window.scrollY + 200; // Offset for header

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    // Update active nav on scroll
    window.addEventListener('scroll', highlightNavigation);
    highlightNavigation(); // Run on load

    // Header Background on Scroll
    const header = document.getElementById('header');

    function updateHeaderBackground() {
        if (!header) return; // No header on the standalone forms/ pages.
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', updateHeaderBackground);

    // Newsletter Form Handling
    const newsletterForms = document.querySelectorAll('.newsletter-form');

    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;

            if (email) {
                // Here you would typically send to your email service
                // For now, we'll just show a success message
                showNotification('Thank you! We\'ll keep you updated on our campaign.', 'success');
                this.reset();
            }
        });
    });

    // Contact Forms Validation
    const contactForms = document.querySelectorAll('form');

    contactForms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea');

        inputs.forEach(input => {
            // Real-time validation feedback
            input.addEventListener('blur', function() {
                validateField(this);
            });

            input.addEventListener('input', function() {
                clearFieldError(this);
            });
        });
    });

    // Field Validation Function
    function validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        let isValid = true;
        let message = '';

        // Clear previous errors
        clearFieldError(field);

        // Required field check
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            message = 'This field is required.';
        }

        // Email validation
        if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'Please enter a valid email address.';
            }
        }

        // Phone validation
        if (type === 'tel' && value) {
            const phoneRegex = /^[\+]?[\s\-\(\)]?[\d\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                message = 'Please enter a valid phone number.';
            }
        }

        if (!isValid) {
            showFieldError(field, message);
        }

        return isValid;
    }

    // Show field error
    function showFieldError(field, message) {
        field.classList.add('error');

        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }

    // Clear field error
    function clearFieldError(field) {
        field.classList.remove('error');
        const errorMessage = field.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    // Notification System
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Close notification">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Position notification
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '10000';
        notification.style.maxWidth = '400px';
        notification.style.padding = '16px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'transform 0.3s ease';

        // Style based on type
        if (type === 'success') {
            notification.style.backgroundColor = '#10b981';
            notification.style.color = 'white';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#ef4444';
            notification.style.color = 'white';
        } else {
            notification.style.backgroundColor = '#3b82f6';
            notification.style.color = 'white';
        }

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Close button functionality
        const closeButton = notification.querySelector('.notification-close');
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.color = 'inherit';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontSize = '20px';
        closeButton.style.float = 'right';
        closeButton.style.marginLeft = '12px';

        closeButton.addEventListener('click', function() {
            hideNotification(notification);
        });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideNotification(notification);
        }, 5000);
    }

    // Hide notification
    function hideNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }

    // Hide Past Events
    // Each dated .event-card carries data-event-date="YYYY-MM-DD". A card stays visible all
    // day on its date and disappears the following day, so the events list prunes itself.
    // Cards without the attribute (recurring or open-ended entries) are never hidden.
    function hidePastEvents() {
        const eventsList = document.querySelector('.events-list');
        if (!eventsList) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        eventsList.querySelectorAll('.event-card[data-event-date]').forEach(card => {
            const parts = card.dataset.eventDate.split('-');
            if (parts.length !== 3) return;

            // Build the date from parts rather than parsing the string directly: the Date
            // constructor treats a bare "YYYY-MM-DD" as UTC midnight, which lands on the
            // previous day in Eastern time and would hide events a day early.
            const eventDay = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            if (isNaN(eventDay.getTime())) return;

            if (eventDay < today) {
                card.hidden = true;
            }
        });

        const emptyMessage = eventsList.querySelector('.events-empty');
        if (emptyMessage && !eventsList.querySelector('.event-card:not([hidden])')) {
            emptyMessage.hidden = false;
        }
    }

    hidePastEvents();

    // Intersection Observer for Animation on Scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    // NOTE: this selector and the start-state CSS in `additionalCSS` below must stay in
    // sync. An element listed only in the CSS starts hidden and is never revealed.
    const animateElements = document.querySelectorAll(
        '.platform-item, .candidate-profile, .endorsement, .involvement-card, .vote-card, .event-card, .join-team-card'
    );

    animateElements.forEach(el => {
        observer.observe(el);
    });

    // Analytics Event Tracking (placeholder for future implementation)
    function trackEvent(action, label = '') {
        // This would integrate with Google Analytics or other analytics service
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': 'Campaign Website',
                'event_label': label
            });
        }

        console.log(`Event tracked: ${action}${label ? ` - ${label}` : ''}`);
    }

    // Track important interactions
    document.querySelectorAll('.btn-primary').forEach(button => {
        button.addEventListener('click', function() {
            trackEvent('CTA Click', this.textContent.trim());
        });
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            trackEvent('Navigation', this.textContent.trim());
        });
    });

    // External Link Tracking
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        link.addEventListener('click', function() {
            trackEvent('External Link', this.href);
        });
    });

    // Performance Monitoring
    function checkPagePerformance() {
        if ('performance' in window) {
            window.addEventListener('load', function() {
                setTimeout(() => {
                    const perf = performance.getEntriesByType('navigation')[0];
                    const loadTime = perf.loadEventEnd - perf.loadEventStart;

                    if (loadTime > 3000) {
                        console.warn('Page load time is over 3 seconds:', loadTime + 'ms');
                    }

                    trackEvent('Page Performance', `Load Time: ${Math.round(loadTime)}ms`);
                }, 0);
            });
        }
    }

    checkPagePerformance();

    // Accessibility Improvements

    // Skip to main content link
    function addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#home';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            border-radius: 0 0 4px 4px;
            z-index: 10001;
            transition: top 0.2s ease;
        `;

        skipLink.addEventListener('focus', function() {
            this.style.top = '0';
        });

        skipLink.addEventListener('blur', function() {
            this.style.top = '-40px';
        });

        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    addSkipLink();

    // Enhanced keyboard navigation
    document.addEventListener('keydown', function(e) {
        // Escape key closes mobile menu
        if (e.key === 'Escape' && navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });

    // Print-friendly adjustments
    window.addEventListener('beforeprint', function() {
        document.body.classList.add('printing');
    });

    window.addEventListener('afterprint', function() {
        document.body.classList.remove('printing');
    });

    console.log('Campaign website loaded successfully!');
});

// Add CSS for animations and error states
const additionalCSS = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }

    .platform-item,
    .candidate-profile,
    .endorsement,
    .involvement-card,
    .vote-card,
    .event-card,
    .join-team-card {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }

    .nav-link.active {
        color: var(--primary) !important;
        background-color: var(--bg) !important;
    }

    .header.scrolled {
        background-color: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
    }

    .error-message {
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 4px;
        display: block;
    }

    input.error,
    textarea.error {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    @media print {
        .printing .nav-menu,
        .printing .nav-toggle,
        .printing .election-banner,
        .printing .btn,
        .printing .newsletter-form {
            display: none !important;
        }

        .printing {
            background: white !important;
        }

        .printing * {
            background: transparent !important;
            color: black !important;
            box-shadow: none !important;
        }
    }
`;

// Mobile-specific enhancements
const mobileCSS = `
    /* Touch feedback for mobile */
    @media (max-width: 768px) {
        .btn:active,
        .nav-link:active,
        .platform-item:active,
        .candidate-card:active {
            transform: scale(0.98);
            transition: transform 0.1s ease;
        }

        /* Better mobile menu styling */
        .nav-menu {
            background-color: white;
            border: 1px solid var(--border);
        }

        /* Mobile-friendly election banner */
        .election-banner {
            font-size: 0.9rem;
            padding: var(--space-3);
        }

        /* Improve mobile form elements.
           Checkboxes and radios are excluded deliberately. A bare "input" selector here
           applies -webkit-appearance: none to them as well, which strips their native
           rendering; combined with the width: auto they get inside .checkbox-item, they
           collapse to 0x0 and vanish entirely on phones. This rule is only meant for text
           inputs - the 16px is what stops iOS zooming on focus. */
        input:not([type="checkbox"]):not([type="radio"]),
        textarea {
            font-size: 16px; /* Prevents zoom on iOS */
            -webkit-appearance: none;
            border-radius: var(--border-radius);
        }
    }
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS + mobileCSS;
document.head.appendChild(style);