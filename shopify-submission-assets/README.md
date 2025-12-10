# Shopify App Store Submission Assets

All assets ready for Shopify App Store submission.

## 📁 Contents

### Icon (`icon/`)
- **fitted-app-icon.png** (512x512px)
  - Resized from your existing logo
  - Ready to upload to Shopify Partner Dashboard

### Screenshots (`screenshots/`)
All screenshots are 1600x1200px (except mobile which is 375x812px full page):

1. **1-dashboard-overview.png** (44KB)
   - Caption: "Real-time dashboard showing installation request stats and recent leads"
   - Shows: Overview tab with stats cards and recent leads table

2. **2-leads-management.png** (35KB)
   - Caption: "Manage all installation requests with customer details and status tracking"
   - Shows: Complete leads table with customer information

3. **3-settings-page.png** (70KB)
   - Caption: "Configure search radius, max installers, and notification preferences"
   - Shows: Settings interface with all configuration options

4. **4-support-docs.png** (77KB)
   - Caption: "Built-in support documentation and getting started guide"
   - Shows: Support tab with FAQs and instructions

5. **5-landing-page.png** (380KB)
   - Caption: "Beautiful landing page connecting customers with installers"
   - Shows: Main landing page with hero section

6. **6-mobile-dashboard.png** (37KB)
   - Caption: "Fully responsive design for mobile and tablet devices"
   - Shows: Mobile view of dashboard (375x812px)

## 📤 How to Upload to Shopify

### 1. Upload App Icon

1. Go to: https://partners.shopify.com/organizations
2. Navigate to: Apps → Fitted → Distribution → App listing
3. Scroll to "App icon"
4. Click "Upload app icon"
5. Select: `icon/fitted-app-icon.png`

### 2. Upload Screenshots

1. In the same App listing page, scroll to "Screenshots"
2. Click "Add screenshot"
3. Upload screenshots in order (1-6)
4. Add the captions provided above
5. You need at least 3 screenshots (we have 6, which is great!)

**Recommended selection if you want to use 3-5:**
- ✅ 1-dashboard-overview.png (must have)
- ✅ 2-leads-management.png (must have)
- ✅ 3-settings-page.png (must have)
- ⭐ 5-landing-page.png (nice to have - shows customer-facing side)
- ⭐ 6-mobile-dashboard.png (nice to have - shows responsive design)

## 🎬 Optional: Create Demo Video

If you want to create a demo video (recommended but not required):

1. Use QuickTime Screen Recording or Loom
2. Show this flow (30-60 seconds):
   - Open merchant dashboard
   - Show stats and recent leads
   - Navigate to Leads tab
   - Show Settings configuration
   - Optional: Show checkout extension in action

3. Upload to YouTube (unlisted) or Vimeo
4. Add URL to App listing

## ✅ Quick Checklist

Before submitting, ensure you have:

- [x] App icon (512x512px) - ✅ Ready
- [x] 3-8 screenshots (1600x1200px) - ✅ 6 ready
- [ ] Demo video (optional)
- [x] App description - ✅ See SHOPIFY_APP_STORE_SUBMISSION.md
- [x] Privacy policy URL - ✅ https://tryfitted.com/privacy.html
- [x] Support URL - ✅ https://tryfitted.com/support.html
- [x] App URL - ✅ https://tryfitted.com/merchant/dashboard.html

## 📝 Screenshot Captions (Copy/Paste Ready)

When uploading screenshots, use these captions:

```
Screenshot 1: Real-time dashboard showing installation request stats and recent leads

Screenshot 2: Manage all installation requests with customer details and status tracking

Screenshot 3: Configure search radius, max installers, and notification preferences

Screenshot 4: Built-in support documentation and getting started guide

Screenshot 5: Beautiful landing page connecting customers with installers

Screenshot 6: Fully responsive design for mobile and tablet devices
```

## 🔄 Regenerate Screenshots

If you need to regenerate screenshots:

```bash
# Start local server
cd /Users/atticus/Documents/fitted
python3 -m http.server 8000

# In another terminal, run the script
node scripts/capture-screenshots.js
```

The script will:
1. Check if the local server is running
2. Navigate to each page
3. Capture screenshots at 1600x1200px (and 375x812px for mobile)
4. Save them to this folder

## 📊 File Sizes

All screenshots are optimized and under Shopify's size limits:

- Icon: 28KB (512x512px)
- Screenshot 1: 44KB (1600x1200px)
- Screenshot 2: 35KB (1600x1200px)
- Screenshot 3: 70KB (1600x1200px)
- Screenshot 4: 77KB (1600x1200px)
- Screenshot 5: 380KB (1600x1200px)
- Screenshot 6: 37KB (375x812px full)

Total: ~671KB for all assets

## 🎨 Need to Update Assets?

### Update Icon:
```bash
sips -z 512 512 landingpage/assets/images/fittedlogoblack.png --out shopify-submission-assets/icon/fitted-app-icon.png
```

### Update Screenshots:
```bash
# Start server
python3 -m http.server 8000

# Run capture script
node scripts/capture-screenshots.js
```

---

**You're ready to submit!** 🚀

See `SHOPIFY_APP_STORE_SUBMISSION.md` for detailed submission instructions.
