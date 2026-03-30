// tracking.js
// Smart Courier Redirector for Pakistani Couriers
// Version: 2.2 (Fixed Trax vs PostEx detection priority)

// ==========================================
// COURIER DATABASE
// ==========================================
// Each entry contains:
// - name: Display name of the courier
// - patterns: Array of regular expressions to match tracking numbers
// - url: Function that takes tracking ID and returns full tracking URL
// - fallbackUrl: URL to use if direct tracking link fails
// ==========================================

const COURIER_RULES = [
    // ========== MAJOR PAKISTANI COURIERS ==========
    {
        name: "Trax",
        patterns: [
            /^20\d{10,}$/,              // 20-prefix with 11+ digits total (e.g., 20223861285076)
            /^\d{7,12}$/,               // 7-12 digit numeric (common format)
            /^TRAX/i,                   // Contains TRAX
            /^TRX/i                     // Contains TRX
        ],
        url: (id) => `https://sonic.pk/tracking?tracking_number=${encodeURIComponent(id)}`,
        fallbackUrl: "https://sonic.pk/tracking",
        description: "7-12 digit numeric or 20-prefix IDs (e.g., 20223861285076)"
    },
    {
        name: "PostEx",
        patterns: [
            /^22\d{6,}$/,               // Starts with 22 + digits (specific PostEx format)
            /^POSTEX/i,                 // Contains POSTEX
            /^PEX\d{6,}$/i              // PEX + digits
            // Removed generic /^\d{10,}$/ pattern to avoid conflicts with Trax
        ],
        url: (id) => `https://postex.pk/tracking?cn=${encodeURIComponent(id)}`,
        fallbackUrl: "https://postex.pk/tracking",
        description: "22-prefix IDs or PEX format"
    },
    {
        name: "Leopard Courier",
        patterns: [
            /^[A-Z]{2}\d{6,}$/i,      // Two letters + 6+ digits (e.g., KI123456, LH123456, IS123456)
            /^LCS\d{6,}$/i,            // LCS + digits
            /^LEOPARD/i,                // Contains LEOPARD
            /^\d{8,12}$/               // Some numeric IDs (8-12 digits)
        ],
        url: (id) => `https://www.leopardscourier.com/tracking?cn_number=${encodeURIComponent(id)}`,
        fallbackUrl: "https://www.leopardscourier.com/tracking",
        description: "Two-letter city code prefix (KI=Karachi, LH=Lahore, IS=Islamabad, etc.) followed by 6+ digits"
    },
    {
        name: "TCS (Tracer Courier Services)",
        patterns: [
            /^\d{10,12}$/,              // 10-12 digit numeric IDs
            /^EX\d{8,12}$/i,            // EX + digits
            /^CN\d{8,12}$/i,            // CN + digits
            /^TCS/i                     // Contains TCS
        ],
        url: (id) => `https://www.tcsexpress.com/track/${encodeURIComponent(id)}`,
        fallbackUrl: "https://www.tcsexpress.com/track/",
        description: "10-12 digit numeric, or EX/CN prefix"
    },
    {
        name: "Call Courier",
        patterns: [
            /^CALL/i,                   // Contains CALL
            /^CL\d{6,}$/i,              // CL + digits
            /^\d{8,12}$/                // 8-12 digit numeric
        ],
        url: (id) => `https://callcourier.com.pk/tracking/${encodeURIComponent(id)}`,
        fallbackUrl: "https://callcourier.com.pk/tracking",
        description: "8-12 digit numeric or CL prefix"
    },
    {
        name: "M&P (Muller & Phipps)",
        patterns: [
            /^MP\d{6,}$/i,              // MP + digits
            /^M&P/i,                    // Contains M&P
            /^\d{7,12}$/                // 7-12 digit numeric
        ],
        url: (id) => `https://mnptracking.com.pk/track/${encodeURIComponent(id)}`,
        fallbackUrl: "https://mnptracking.com.pk",
        description: "MP prefix or 7+ digit numeric"
    },
    {
        name: "BlueEx",
        patterns: [
            /^BE\d{6,}$/i,              // BE + digits
            /^BLUE/i,                   // Contains BLUE
            /^\d{8,12}$/                // 8-12 digit numeric
        ],
        url: (id) => `https://www.blue-ex.com/track/${encodeURIComponent(id)}`,
        fallbackUrl: "https://www.blue-ex.com/track",
        description: "BE prefix or numeric ID"
    },
    {
        name: "Swyft Logistics",
        patterns: [
            /^SWYFT/i,                  // Contains SWYFT
            /^SW/i,                     // SW prefix
            /^\d{6,10}$/                // 6-10 digit numeric
        ],
        url: (id) => `http://parceltracking.swyftlogistics.com/${encodeURIComponent(id)}`,
        fallbackUrl: "http://parceltracking.swyftlogistics.com/",
        description: "Numeric ID or SWYFT prefix"
    },
    {
        name: "Fastex (Daewoo Express)",
        patterns: [
            /^DAEWOO/i,                 // Contains DAEWOO
            /^FASTEX/i,                 // Contains FASTEX
            /^\d{8,12}$/                // 8-12 digit numeric
        ],
        url: (id) => `https://fastex.pk/tracking/${encodeURIComponent(id)}`,
        fallbackUrl: "https://fastex.pk/tracking",
        description: "Numeric ID with Daewoo/Fastex service"
    },

    // ========== GOVERNMENT / POSTAL ==========
    {
        name: "Pakistan Post",
        patterns: [
            /^[A-Z]{2}\d{9}PK$/i,       // Two letters + 9 digits + PK (e.g., RR123456789PK)
            /^PK/i,                      // Contains PK
            /^\d{8,12}$/                // Numeric tracking
        ],
        url: (id) => `https://www.pakpost.gov.pk/tracking/${encodeURIComponent(id)}`,
        fallbackUrl: "https://www.pakpost.gov.pk/tracking",
        description: "Format: Two letters + 9 digits + PK"
    },

    // ========== SPECIALIZED/REGIONAL ==========
    {
        name: "Rider (by ZO)",
        patterns: [
            /^RIDER/i,                  // Contains RIDER
            /^ZORIDER/i,                // ZORIDER prefix
            /^ZRO/i                     // ZRO prefix
        ],
        url: (id) => `https://riderpk.com/tracking/${encodeURIComponent(id)}`,
        fallbackUrl: "https://riderpk.com/tracking",
        description: "E-commerce focused courier"
    },
    {
        name: "Shadow Express",
        patterns: [
            /^SHADOW/i,                 // Contains SHADOW
            /^SHX/i,                    // SHX prefix
            /^\d{8,10}$/                // 8-10 digit numeric
        ],
        url: (id) => `https://shadowexpress.com/track/${encodeURIComponent(id)}`,
        fallbackUrl: "https://shadowexpress.com/track",
        description: "Regional courier service"
    },
    {
        name: "Speedex",
        patterns: [
            /^SPEED/i,                  // Contains SPEED
            /^SPX/i,                    // SPX prefix
            /^\d{8,10}$/                // 8-10 digit numeric
        ],
        url: (id) => `https://speedex.com.pk/tracking/${encodeURIComponent(id)}`,
        fallbackUrl: "https://speedex.com.pk/tracking",
        description: "Express courier service"
    },
    {
        name: "Gerrys",
        patterns: [
            /^GERRY/i,                  // Contains GERRY
            /^GERRYS/i,                 // Contains GERRYS
            /^GDS/i                     // GDS prefix
        ],
        url: (id) => `https://gerrys.com.pk/tracking/${encodeURIComponent(id)}`,
        fallbackUrl: "https://gerrys.com.pk/tracking",
        description: "International and domestic courier"
    },
    {
        name: "OCS (Overseas Courier Service)",
        patterns: [
            /^OCS/i,                    // Contains OCS
            /^OC/i,                     // OC prefix
            /^\d{10,12}$/               // 10-12 digit numeric
        ],
        url: (id) => `https://ocs.com.pk/tracking/${encodeURIComponent(id)}`,
        fallbackUrl: "https://ocs.com.pk/tracking",
        description: "International courier service"
    },
    {
        name: "SkyNet",
        patterns: [
            /^SKY/i,                    // Contains SKY
            /^SKYNET/i,                 // Contains SKYNET
            /^SN/i                      // SN prefix
        ],
        url: (id) => `https://skynet.com.pk/tracking/${encodeURIComponent(id)}`,
        fallbackUrl: "https://skynet.com.pk/tracking",
        description: "Global courier with local presence"
    },

    // ========== E-COMMERCE FOCUSED ==========
    {
        name: "Bykea",
        patterns: [
            /^BYKEA/i,                  // Contains BYKEA
            /^BK/i,                     // BK prefix
            /^\d{8,10}$/                // 8-10 digit numeric
        ],
        url: (id) => `https://bykea.com/track/${encodeURIComponent(id)}`,
        fallbackUrl: "https://bykea.com/track",
        description: "Ride-hailing and delivery service"
    },
    {
        name: "Foodpanda Logistics",
        patterns: [
            /^FP/i,                     // FP prefix
            /^FOODPANDA/i,              // Contains FOODPANDA
            /^FDL/i                     // FDL prefix
        ],
        url: (id) => `https://foodpanda.com/logistics/track/${encodeURIComponent(id)}`,
        fallbackUrl: "https://foodpanda.com/logistics/track",
        description: "Food delivery logistics"
    }
];

// ==========================================
// CORE FUNCTIONS
// ==========================================

// Detect courier based on tracking ID with priority matching
function detectCourier(trackingId) {
    // Clean and normalize the tracking ID
    const cleanId = trackingId.toString().trim().toUpperCase();
    
    console.log(`[Detection] Checking ID: ${cleanId}`);
    
    // First pass: Try to match specific patterns (order matters - more specific first)
    for (const courier of COURIER_RULES) {
        for (const pattern of courier.patterns) {
            if (pattern.test(cleanId)) {
                console.log(`[Detection] Matched ${courier.name} with pattern: ${pattern}`);
                return courier;
            }
        }
    }
    
    // Second pass: Check for numeric-only tracking (fallback to manual selection)
    if (/^\d{7,}$/.test(cleanId)) {
        console.log(`[Detection] Numeric ID detected, showing manual selection`);
        return null;
    }
    
    return null; // No match found
}

// Get all couriers for manual selection
function getAllCouriers() {
    return COURIER_RULES;
}

// Build tracking URL for a courier
function buildTrackingUrl(courier, trackingId) {
    try {
        return courier.url(trackingId);
    } catch (e) {
        console.error(`[Error] Failed to build URL for ${courier.name}:`, e);
        return courier.fallbackUrl;
    }
}

// ==========================================
// UI FUNCTIONS
// ==========================================

// Show manual courier selection interface
function showManualSelection(trackingId) {
    const messageElement = document.getElementById('message');
    const spinnerElement = document.querySelector('.spinner');
    
    if (spinnerElement) spinnerElement.style.display = 'none';
    
    const couriersHtml = COURIER_RULES.map(courier => `
        <button onclick="manualRedirect('${courier.name.replace(/'/g, "\\'")}', '${trackingId}')" 
                class="courier-btn"
                style="margin:8px; padding:10px 16px; background:#4a5568; border:none; border-radius:8px; color:white; cursor:pointer; font-size:14px; transition:all 0.2s;">
            ${courier.name}
        </button>
    `).join('');
    
    messageElement.innerHTML = `
        <div style="background:#2d3748; padding:20px; border-radius:12px; max-width:500px; margin:0 auto;">
            <p style="margin:0 0 10px 0;">⚠️ Could not automatically detect courier for:</p>
            <p style="font-size:18px; font-weight:bold; margin:10px 0; word-break:break-all;">${escapeHtml(trackingId)}</p>
            <p style="margin:15px 0 10px 0;">Please select your courier:</p>
            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:5px;">
                ${couriersHtml}
            </div>
        </div>
    `;
}

// Simple escape function to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Show error message
function showError(message) {
    const messageElement = document.getElementById('message');
    const spinnerElement = document.querySelector('.spinner');
    
    if (spinnerElement) spinnerElement.style.display = 'none';
    
    messageElement.innerHTML = `
        <div style="background:#c53030; padding:20px; border-radius:12px; max-width:500px; margin:0 auto;">
            <p style="margin:0;">❌ ${escapeHtml(message)}</p>
            <p style="margin:15px 0 0 0; font-size:14px;">
                Please contact the sender for assistance.
            </p>
        </div>
    `;
}

// Show loading and prepare redirect
function showLoadingAndRedirect(courier, trackingId) {
    const messageElement = document.getElementById('message');
    const spinnerElement = document.querySelector('.spinner');
    
    if (spinnerElement) spinnerElement.style.display = 'block';
    
    if (courier) {
        messageElement.innerHTML = `
            ✅ Detected: <strong>${escapeHtml(courier.name)}</strong><br>
            Tracking ID: ${escapeHtml(trackingId)}<br>
            Redirecting to tracking page...
        `;
        
        const trackingUrl = buildTrackingUrl(courier, trackingId);
        
        // Redirect after short delay for better UX
        setTimeout(() => {
            window.location.href = trackingUrl;
        }, 1500);
    } else {
        // Show manual selection
        showManualSelection(trackingId);
    }
}

// ==========================================
// MAIN EXECUTION
// ==========================================

// Manual redirect function (global for HTML buttons)
window.manualRedirect = function(courierName, trackingId) {
    const courier = COURIER_RULES.find(c => c.name === courierName);
    if (courier) {
        const trackingUrl = buildTrackingUrl(courier, trackingId);
        window.location.href = trackingUrl;
    } else {
        showError(`Courier "${escapeHtml(courierName)}" not found in database.`);
    }
};

// Start the redirect process when page loads
window.addEventListener('DOMContentLoaded', () => {
    const formElement = document.getElementById('tracking-form');
    const inputElement = document.getElementById('tracking-id');
    const messageElement = document.getElementById('message');
    const spinnerElement = document.querySelector('.spinner');

    if (!formElement || !inputElement || !messageElement) {
        console.error('[Tracking] Required form elements are missing.');
        return;
    }

    if (spinnerElement) spinnerElement.style.display = 'none';

    formElement.addEventListener('submit', (event) => {
        event.preventDefault();

        const trackingId = inputElement.value.trim();

        if (!trackingId) {
            showError('Please enter a valid tracking ID.');
            return;
        }

        console.log(`[Tracking] Processing ID: ${trackingId}`);
        const courier = detectCourier(trackingId);
        showLoadingAndRedirect(courier, trackingId);
    });
});

// Export for testing (if in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { COURIER_RULES, detectCourier };
}
