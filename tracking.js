// Courier detection rules
const COURIER_RULES = [
    {
        name: "Trax",
        patterns: [/^20\d{4,}$/, /^TRAX/i, /^TRX/i],
        url: (id) => `https://trax.com.pk/track/${id}`,
        fallbackUrl: "https://trax.com.pk/track"
    },
    {
        name: "PostEx",
        patterns: [/^22\d{4,}$/, /^POSTEX/i, /^PEX/i],
        url: (id) => `https://postex.pk/tracking/${id}`,
        fallbackUrl: "https://postex.pk/tracking"
    },
    {
        name: "Leopards Courier Service (LCS)",
        patterns: [/^KI\d{6,}$/i, /^LCS/i, /^LEOPARDS/i],
        url: (id) => `https://leopards.com.pk/tracking/${id}`,
        fallbackUrl: "https://leopards.com.pk/tracking"
    },
    {
        name: "TCS",
        patterns: [/^TCS/i, /^\d{10,}$/],
        url: (id) => `https://tcscouriers.com/track/${id}`,
        fallbackUrl: "https://tcscouriers.com/track"
    },
    {
        name: "Call Courier",
        patterns: [/^CALL/i, /^CL/i],
        url: (id) => `https://callcourier.com.pk/track/${id}`,
        fallbackUrl: "https://callcourier.com.pk/track"
    },
    {
        name: "M&P (Mail & Parcel)",
        patterns: [/^MP/i, /^M&P/i, /^\d{8,}$/],
        url: (id) => `https://mandp.com/tracking/${id}`,
        fallbackUrl: "https://mandp.com/tracking"
    }
];

// Get tracking ID from URL parameter
function getTrackingId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || urlParams.get('tracking') || urlParams.get('tracking_id');
}

// Detect courier based on tracking ID
function detectCourier(trackingId) {
    for (const courier of COURIER_RULES) {
        for (const pattern of courier.patterns) {
            if (pattern.test(trackingId)) {
                return courier;
            }
        }
    }
    return null; // No match found
}

// Redirect to appropriate tracking URL
function redirectToTracking() {
    const trackingId = getTrackingId();
    const messageElement = document.getElementById('message');
    
    // Case 1: No tracking ID provided
    if (!trackingId) {
        messageElement.innerHTML = '❌ No tracking ID provided.<br>Please check your link and try again.';
        document.querySelector('.spinner').style.display = 'none';
        return;
    }
    
    // Case 2: Detect courier
    const courier = detectCourier(trackingId);
    
    if (courier) {
        const trackingUrl = courier.url(trackingId);
        messageElement.innerHTML = `✅ Detected: <strong>${courier.name}</strong><br>Redirecting to tracking page...`;
        
        // Redirect after 1.5 seconds (for better UX)
        setTimeout(() => {
            window.location.href = trackingUrl;
        }, 1500);
    } 
    // Case 3: Unknown courier - provide helpful message
    else {
        messageElement.innerHTML = `
            ⚠️ Could not automatically detect courier for ID: <strong>${trackingId}</strong><br><br>
            Please select your courier:<br>
            ${COURIER_RULES.map(c => `<button onclick="manualRedirect('${c.name}', '${trackingId}')" style="margin:5px; padding:8px 12px; background:white; border:none; border-radius:5px; cursor:pointer;">${c.name}</button>`).join('')}
        `;
        document.querySelector('.spinner').style.display = 'none';
    }
}

// Manual courier selection (for unknown IDs)
function manualRedirect(courierName, trackingId) {
    const courier = COURIER_RULES.find(c => c.name === courierName);
    if (courier) {
        window.location.href = courier.url(trackingId);
    }
}

// Make manualRedirect available globally
window.manualRedirect = manualRedirect;

// Start the redirect process when page loads
window.addEventListener('DOMContentLoaded', redirectToTracking);
