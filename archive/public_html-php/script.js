// =========================================================
// HEA Link — Glassmorphism & PHP Backend Bridge
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    const tabLink = document.getElementById('tabLink');
    const tabQR = document.getElementById('tabQR');
    const shortenerForm = document.getElementById('shortenerForm');
    const urlInput = document.getElementById('urlInput');
    const customInput = document.getElementById('customInput');
    const shortenBtn = document.getElementById('shortenBtn');
    const shortUrlDisplay = document.getElementById('shortUrlDisplay');
    const resultCard = document.getElementById('resultCard');
    const copyBtn = document.getElementById('copyBtn');
    const copyIcon = document.getElementById('copyIcon');
    const copyText = document.getElementById('copyText');
    const viewQrBtn = document.getElementById('viewQrBtn');
    const qrPreviewContainer = document.getElementById('qrPreviewContainer');
    const qrImage = document.getElementById('qrImage');
    const downloadQrBtn = document.getElementById('downloadQrBtn');
    const toast = document.getElementById('toast');

    // CSRF & Base URL from meta
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';
    const baseMeta = document.querySelector('meta[name="base-url"]');
    const baseUrl = baseMeta ? baseMeta.getAttribute('content') : window.location.origin;

    // 1. Mobile Menu Toggle
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });

        navMenu.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
            });
        });
    }

    // 2. Toast Notification Helper
    function showToast(message, isError = false) {
        if (!toast) return;
        toast.textContent = message;
        toast.style.borderColor = isError ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.4)';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3600);
    }

    // 3. Tab Switching (Short Link vs QR Code)
    if (tabLink && tabQR) {
        tabLink.addEventListener('click', () => {
            tabLink.classList.add('active');
            tabQR.classList.remove('active');
            qrPreviewContainer.style.display = 'none';
        });

        tabQR.addEventListener('click', () => {
            tabQR.classList.add('active');
            tabLink.classList.remove('active');
            showQrCode();
        });
    }

    // 4. Real AJAX Shortening with PHP API
    if (shortenerForm) {
        shortenerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const rawUrl = urlInput.value.trim();
            const customVal = customInput ? customInput.value.trim() : '';

            if (!rawUrl) {
                showToast('⚠️ Please enter a destination URL.', true);
                urlInput.focus();
                return;
            }

            // Disable button during network request
            shortenBtn.disabled = true;
            const originalText = shortenBtn.textContent;
            shortenBtn.textContent = 'Saving...';

            try {
                const response = await fetch('api/shorten.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({
                        url: rawUrl,
                        custom: customVal || null,
                        csrf_token: csrfToken
                    })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Failed to shorten URL');
                }

                // Update UI with real short link
                const fullShortUrl = data.short_url;
                shortUrlDisplay.textContent = fullShortUrl;
                resultCard.style.display = 'flex';

                // Update QR Code
                updateQrCode(fullShortUrl);

                showToast(`✨ Link created: /${data.code}`);

                if (tabQR.classList.contains('active')) {
                    showQrCode();
                }
            } catch (err) {
                showToast(`❌ ${err.message}`, true);
            } finally {
                shortenBtn.disabled = false;
                shortenBtn.textContent = originalText;
            }
        });
    }

    // 5. Copy to Clipboard
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const textToCopy = shortUrlDisplay.textContent.trim();
            if (!textToCopy) return;

            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(textToCopy);
                } else {
                    const temp = document.createElement('input');
                    temp.value = textToCopy;
                    document.body.appendChild(temp);
                    temp.select();
                    document.execCommand('copy');
                    document.body.removeChild(temp);
                }

                copyIcon.textContent = '✅';
                copyText.textContent = 'Copied!';
                showToast(`📋 Copied: ${textToCopy}`);

                setTimeout(() => {
                    copyIcon.textContent = '📋';
                    copyText.textContent = 'Copy';
                }, 2200);
            } catch (e) {
                showToast('❌ Copy failed. Please copy manually.', true);
            }
        });
    }

    // 6. QR Code Helpers
    function updateQrCode(fullUrl) {
        const encoded = encodeURIComponent(fullUrl);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encoded}&color=2563eb&bgcolor=ffffff&margin=6`;
        const highResQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encoded}&color=2563eb&bgcolor=ffffff&margin=6`;

        qrImage.src = qrUrl;
        downloadQrBtn.href = highResQrUrl;
    }

    function showQrCode() {
        if (qrPreviewContainer.style.display === 'none' || qrPreviewContainer.style.display === '') {
            qrPreviewContainer.style.display = 'block';
            qrPreviewContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            qrPreviewContainer.style.display = 'none';
        }
    }

    if (viewQrBtn) {
        viewQrBtn.addEventListener('click', showQrCode);
    }
});
