# track.srlines.net - Smart Courier Redirector

This service automatically detects Pakistani courier companies based on tracking ID patterns and redirects customers to the correct tracking URL.

## Supported Couriers & Patterns

| Courier | Pattern Examples |
|---------|------------------|
| Trax | Starts with 20xxxx |
| PostEx | Starts with 22xxxx |
| Leopards (LCS) | Starts with KIxxxxx |
| TCS | Contains TCS or 10+ digits |
| Call Courier | Starts with CALL or CL |
| M&P | Starts with MP or 8+ digits |

## How to Add New Couriers

Edit `tracking.js` and add to the `COURIER_RULES` array:

```javascript
{
    name: "New Courier",
    patterns: [/^PATTERN/i, /^ANOTHER/i],
    url: (id) => `https://courier.com/track/${id}`,
    fallbackUrl: "https://courier.com/track"
}
