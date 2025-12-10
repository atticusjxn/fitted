# Shopify App Store Submission Guide

Complete step-by-step guide to submit Fitted to the Shopify App Store.

## Prerequisites Checklist

Before you begin, ensure you have:

- [x] Merchant admin interface (✅ Created)
- [x] Production API deployed (✅ Fly.io)
- [x] Checkout extension working (✅ Tested)
- [ ] App hosted on public URL
- [ ] Privacy Policy URL
- [ ] Support documentation
- [ ] App screenshots and assets

---

## Step 1: Prepare Your App Assets

### 1.1 Create App Icon
- **Size**: 512x512 pixels
- **Format**: PNG with transparent background
- **Requirements**: Clear, recognizable at small sizes
- **Location**: Save as `fitted-app-icon.png`

### 1.2 Create App Screenshots
You need **3-8 screenshots** showing your app in action:

**Required Screenshots:**
1. **Merchant Dashboard** - Overview tab with stats
2. **Leads Management** - Table showing installation requests
3. **Settings Page** - Extension configuration
4. **Checkout Experience** - Customer view (thank you page)
5. **Mobile View** - Responsive design (optional)

**Specifications:**
- Size: 1600x1200 pixels
- Format: PNG or JPG
- Show actual app interface (not mockups)

**How to capture:**
```bash
# Open merchant admin
open "apps/merchant-admin/dashboard.html?shop=demo-store.myshopify.com"

# Use browser developer tools to set viewport to 1600x1200
# Take screenshots of each tab
```

### 1.3 Create Demo Video (Optional but Recommended)
- Length: 30-60 seconds
- Show: Customer journey from checkout to installer selection
- Format: MP4, MOV, or YouTube link

---

## Step 2: Set Up Production URLs

### 2.1 Deploy Merchant Admin to Vercel

```bash
# Add merchant admin to Vercel deployment
cd /Users/atticus/Documents/fitted

# Create vercel.json if it doesn't exist
cat > landingpage/vercel.json <<EOF
{
  "rewrites": [
    { "source": "/merchant/:path*", "destination": "/../apps/merchant-admin/:path*" }
  ]
}
EOF

# Deploy
cd landingpage
vercel --prod

# Your merchant admin will be at:
# https://tryfitted.com/merchant/dashboard.html
```

**Alternative: Copy files to landing page**
```bash
mkdir -p landingpage/merchant
cp apps/merchant-admin/dashboard.html landingpage/merchant/
git add landingpage/merchant/
git commit -m "Add merchant admin to landing page"
git push  # Auto-deploys to Vercel
```

### 2.2 Create Privacy Policy

**Required for Level 2 Customer Data Access**

Create `landingpage/privacy.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Fitted</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        h1 { font-size: 28px; margin-bottom: 20px; }
        h2 { font-size: 20px; margin-top: 30px; margin-bottom: 15px; }
        p { margin-bottom: 15px; }
    </style>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p><strong>Last Updated:</strong> [Current Date]</p>

    <h2>1. Information We Collect</h2>
    <p>Fitted collects the following information to facilitate installation services:</p>
    <ul>
        <li><strong>Customer Information:</strong> Name, email address, phone number, shipping address (including postcode)</li>
        <li><strong>Order Information:</strong> Product details, order ID for installation requests</li>
        <li><strong>Merchant Information:</strong> Shop domain, store settings</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <p>We use collected information solely for:</p>
    <ul>
        <li>Matching customers with qualified installers based on location</li>
        <li>Facilitating communication between customers and installers</li>
        <li>Providing installation scheduling services</li>
        <li>Improving our service quality</li>
    </ul>

    <h2>3. Information Sharing</h2>
    <p>We share customer contact information only with:</p>
    <ul>
        <li>Selected installers who will perform the installation service</li>
        <li>Merchant stores to track installation requests</li>
    </ul>
    <p>We do not sell, rent, or share customer data with third parties for marketing purposes.</p>

    <h2>4. Data Storage and Security</h2>
    <p>Your data is stored securely using Supabase (PostgreSQL) with encryption at rest and in transit. We retain customer data only as long as necessary to facilitate installation services.</p>

    <h2>5. Your Rights</h2>
    <p>You have the right to:</p>
    <ul>
        <li>Access your personal information</li>
        <li>Request deletion of your data</li>
        <li>Opt-out of communications</li>
    </ul>

    <h2>6. Contact Us</h2>
    <p>For privacy concerns or data requests, contact us at:</p>
    <p>Email: privacy@tryfitted.com<br>
    Website: https://tryfitted.com</p>

    <h2>7. GDPR and CCPA Compliance</h2>
    <p>Fitted is committed to compliance with GDPR and CCPA. We process personal data lawfully, fairly, and transparently.</p>
</body>
</html>
```

**Deploy:**
```bash
git add landingpage/privacy.html
git commit -m "Add privacy policy"
git push  # Deploys to https://tryfitted.com/privacy.html
```

### 2.3 Create Support/Documentation Page

Create `landingpage/support.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support - Fitted</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        h1 { font-size: 28px; margin-bottom: 20px; }
        h2 { font-size: 20px; margin-top: 30px; margin-bottom: 15px; }
        .contact-box { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Fitted Support</h1>

    <h2>Getting Started</h2>
    <p>Fitted connects your customers with qualified installers for products that require installation.</p>

    <ol>
        <li><strong>Tag Products:</strong> Add the tag "installation-required" to products that need installation</li>
        <li><strong>Configure Settings:</strong> Set your preferred search radius and number of installers to show</li>
        <li><strong>Monitor Leads:</strong> View installation requests in your dashboard</li>
    </ol>

    <h2>How It Works</h2>
    <ol>
        <li>Customer purchases a product tagged "installation-required"</li>
        <li>On the thank you page, nearby installers are shown based on their postcode</li>
        <li>Customer selects an installer and provides contact details</li>
        <li>Installation request appears in your merchant dashboard</li>
        <li>Selected installer contacts the customer to schedule installation</li>
    </ol>

    <h2>Frequently Asked Questions</h2>

    <h3>How are installers matched to customers?</h3>
    <p>We use a 50km radius search based on the customer's shipping postcode to find qualified installers in their area.</p>

    <h3>How do I add more installers?</h3>
    <p>Installers can sign up at https://tryfitted.com/installer-signup.html. We vet all installers before approving them.</p>

    <h3>Can I disable the extension for certain products?</h3>
    <p>Yes! Simply remove the "installation-required" tag from products you don't want to show installers for.</p>

    <h3>What customer data is collected?</h3>
    <p>We collect name, email, phone, and shipping postcode to match customers with local installers. See our <a href="/privacy.html">Privacy Policy</a> for details.</p>

    <div class="contact-box">
        <h2>Need Help?</h2>
        <p><strong>Email:</strong> support@tryfitted.com</p>
        <p><strong>Website:</strong> <a href="https://tryfitted.com">tryfitted.com</a></p>
        <p><strong>Response Time:</strong> We typically respond within 24 hours</p>
    </div>
</body>
</html>
```

**Deploy:**
```bash
git add landingpage/support.html
git commit -m "Add support documentation"
git push
```

---

## Step 3: Configure App in Shopify Partner Dashboard

### 3.1 Access Your App

**Direct Link:** https://partners.shopify.com/organizations

1. Log in to your Shopify Partner account
2. Click on **Apps** in the left sidebar
3. Find and click on your **Fitted** app

### 3.2 Update App URLs

Click on **Configuration** tab, then scroll to **App URLs**:

**App URL:**
```
https://tryfitted.com/merchant/dashboard.html
```

**Allowed redirection URL(s):**
```
https://tryfitted.com/merchant/dashboard.html
https://fitted-api.fly.dev/api/auth/callback
```

Click **Save**

### 3.3 Set Up App Extensions

Your checkout extension should already be deployed. Verify:

1. Click **Extensions** tab
2. Ensure your checkout UI extension is listed and deployed
3. Note the extension ID for reference

### 3.4 Configure Customer Data Access

1. Go to **Configuration** tab
2. Scroll to **Protected customer data access**
3. Check the box for **Customer and order information**
4. Select: **Shipping address** (Level 2)
5. Save changes

---

## Step 4: Create App Listing

### 4.1 Start App Listing

**Direct Link:** https://partners.shopify.com/organizations

1. In your Partner Dashboard, go to **Apps**
2. Click on your **Fitted** app
3. Click **Distribution** in the left sidebar
4. Click **Create app listing** button

### 4.2 Fill Out Listing Details

#### Basic Information

**App name:**
```
Fitted - Installation Booking
```

**App subtitle** (50 characters max):
```
Connect customers with installers at checkout
```

**App description** (Minimum 300 characters):
```
Fitted seamlessly connects your customers with qualified installers right at checkout. When customers purchase products that require installation, they can instantly book local installers on your thank you page.

Perfect for stores selling:
• Ceiling fans and lighting fixtures
• Air conditioners and appliances
• TV mounts and home theater systems
• Blinds, curtains, and window treatments
• Any product requiring professional installation

Key Features:
✓ Automatic installer matching based on customer location (50km radius)
✓ Pre-qualified, licensed installers in your network
✓ Seamless checkout integration - no redirects needed
✓ Real-time dashboard to track installation requests
✓ Customers get installation sorted at the point of purchase
✓ Increase customer satisfaction and reduce support queries

How It Works:
1. Tag products that need installation with "installation-required"
2. At checkout, customers see nearby installers with ratings and distance
3. Customers select their preferred installer and submit contact details
4. Installer contacts customer to schedule installation
5. Track all requests in your merchant dashboard

Fitted handles the complexity of matching customers with qualified installers, so you can focus on selling. No more fielding "who do I get to install this?" questions - it's all handled automatically.
```

**Categories** (Select 2):
- **Primary:** Checkout
- **Secondary:** Customer support

**Developer name:**
```
Fitted Technologies
```

**Developer website:**
```
https://tryfitted.com
```

#### Contact Information

**Support email:**
```
support@tryfitted.com
```

**Support URL:**
```
https://tryfitted.com/support.html
```

**Privacy policy URL:**
```
https://tryfitted.com/privacy.html
```

### 4.3 Upload Media Assets

#### App Icon
- Click **Upload app icon**
- Upload your 512x512px `fitted-app-icon.png`

#### Screenshots
1. Click **Add screenshot**
2. Upload each screenshot (3-8 images)
3. Add captions for each:
   - "Dashboard showing installation request stats and recent leads"
   - "Manage all installation requests with customer details"
   - "Configure extension settings and search radius"
   - "Customer view: Select installer on thank you page"

#### Demo Video (Optional)
- Upload video or paste YouTube/Vimeo URL
- Recommended: 30-60 second walkthrough

### 4.4 Pricing

Select your pricing model:

**Option 1: Free** (Recommended for launch)
```
Free to install
```

**Option 2: Commission-based**
```
Free to install
(You can add: "Transaction fees may apply" if taking commission later)
```

**Option 3: Monthly subscription**
```
$29/month - Starter (up to 50 requests)
$79/month - Professional (up to 200 requests)
$149/month - Business (unlimited)
```

### 4.5 Key Features (List 3-5)

```
1. Automatic Installer Matching
   Match customers with qualified installers within 50km of their location

2. Seamless Checkout Integration
   No redirects - installers shown directly on thank you page after purchase

3. Real-time Dashboard
   Track all installation requests, customer details, and booking status

4. Simple Product Tagging
   Just tag products with "installation-required" to enable installer booking

5. Vetted Installer Network
   All installers are pre-qualified and rated for quality assurance
```

### 4.6 Languages

Select languages your app supports:
- ✓ English

---

## Step 5: Submit Data Protection Questionnaire

### 5.1 Access Questionnaire

1. In **Distribution** tab of your app
2. Click **Complete data protection questionnaire**
3. Answer all questions honestly

### 5.2 Sample Answers

**Does your app collect or process customer data?**
```
Yes
```

**What customer data does your app collect?**
```
- Customer name
- Email address
- Phone number
- Shipping address (postcode only used for matching)
- Order ID and product details
```

**How is the data used?**
```
Data is used exclusively to match customers with local installers and facilitate installation scheduling. We do not use customer data for marketing or share it with third parties beyond the selected installer.
```

**Where is data stored?**
```
Supabase (PostgreSQL database) with servers in [your region]
Encrypted at rest and in transit using TLS 1.3
```

**How long is data retained?**
```
Customer data is retained for 90 days after installation is completed, then anonymized. Merchants can request deletion at any time.
```

**Is your app GDPR compliant?**
```
Yes - we provide data access, deletion, and portability upon request
```

**Is your app CCPA compliant?**
```
Yes - California residents can opt-out and request data deletion
```

**Do you have a privacy policy?**
```
Yes - https://tryfitted.com/privacy.html
```

---

## Step 6: Test Your App Listing

### 6.1 Preview Your Listing

1. In the **Distribution** tab, click **Preview app listing**
2. Review how your app will appear in the App Store
3. Check all text, images, and links
4. Make any necessary edits

### 6.2 Test Installation Flow

**Important:** Test on a development store before submission

1. Go to https://partners.shopify.com/organizations
2. Create a new **Development store** if you don't have one
3. Install your app on the development store:
   ```
   https://partners.shopify.com/[org-id]/apps/[app-id]/test
   ```
4. Verify:
   - ✓ Merchant admin loads correctly
   - ✓ Settings can be saved
   - ✓ Checkout extension appears on thank you page
   - ✓ Customer can select installer and submit request
   - ✓ Lead appears in merchant dashboard

---

## Step 7: Submit for Review

### 7.1 Final Checklist

Before submitting, ensure:

- [x] App listing is complete (100% progress bar)
- [x] All URLs are public and accessible
- [x] Privacy policy is published
- [x] Support documentation is available
- [x] Screenshots clearly show app functionality
- [x] App tested on development store
- [x] Data protection questionnaire completed
- [x] Customer data access is properly scoped (Level 2)

### 7.2 Submit App

**Direct Link:** https://partners.shopify.com/organizations → Your App → Distribution

1. Click the **Submit app** button
2. Review the submission checklist
3. Confirm you've read and agree to:
   - Partner Program Agreement
   - App Store Review Guidelines
   - Developer Terms
4. Click **Submit for review**

### 7.3 What Happens Next

**Review Timeline:**
- Initial review: 3-5 business days
- If changes requested: 1-2 days after resubmission
- Total process: Usually 1-2 weeks

**You'll receive emails about:**
1. Submission confirmation
2. App in review
3. Approval or requested changes
4. App published (when approved)

**Common Reasons for Rejection:**
- Missing or broken links (privacy policy, support)
- Poor quality screenshots or descriptions
- App doesn't work as described
- Customer data handling not properly disclosed
- Bugs or errors during testing

---

## Step 8: Post-Approval Steps

### 8.1 After Approval

When your app is approved, you'll get an email. Then:

1. **App Store Link:** Your app will be live at:
   ```
   https://apps.shopify.com/fitted-installation-booking
   ```

2. **Monitor Dashboard:** Check Partner Dashboard daily for:
   - Installation analytics
   - Merchant feedback and reviews
   - Revenue (if charging)

3. **Respond to Reviews:** Shopify allows merchants to review your app
   - Respond professionally to all reviews
   - Address issues quickly

### 8.2 Marketing Your App

**Share your app:**
- Add to your website: https://tryfitted.com
- Social media announcement
- Email your existing merchants
- Partner with installer networks

**Shopify Partner Resources:**
- Marketing assets: https://partners.shopify.com/organizations/resources
- App Store optimization tips
- Partner blog and community

---

## Quick Links Reference

| Resource | URL |
|----------|-----|
| Partner Dashboard | https://partners.shopify.com/organizations |
| App Store Requirements | https://shopify.dev/docs/apps/launch/app-requirements |
| Review Guidelines | https://shopify.dev/docs/apps/launch/review-guidelines |
| App Listing Guide | https://shopify.dev/docs/apps/launch/listing |
| Customer Data Requirements | https://shopify.dev/docs/apps/store/data-protection/customer-data |
| App Store Homepage | https://apps.shopify.com |
| Developer Docs | https://shopify.dev |
| Partner Support | https://partners.shopify.com/current/resources/contact-us |

---

## Troubleshooting

### Issue: "App URL not accessible"
**Solution:** Ensure your merchant admin is deployed and publicly accessible. Test by opening the URL in an incognito window.

### Issue: "Privacy policy required"
**Solution:** Create and deploy privacy.html, then add the URL to your app configuration.

### Issue: "Customer data access not justified"
**Solution:** In the data protection questionnaire, clearly explain why you need shipping address (for installer matching by postcode).

### Issue: "Extension not working in test store"
**Solution:**
```bash
cd /Users/atticus/Documents/fitted
shopify app deploy
# Select your extension and confirm deployment
```

### Issue: "Screenshots don't show app functionality"
**Solution:** Retake screenshots showing actual usage with real data (blur any sensitive info).

---

## Need Help?

**Shopify Partner Support:**
- Help Center: https://partners.shopify.com/current/resources/contact-us
- Community Forums: https://community.shopify.com/c/partners/ct-p/partners
- Developer Discord: https://discord.gg/shopifydevs

**For App-Specific Issues:**
- Email: support@tryfitted.com
- Review this documentation
- Check Shopify dev docs: https://shopify.dev

---

## Summary Commands

```bash
# 1. Deploy merchant admin to landing page
cp apps/merchant-admin/dashboard.html landingpage/merchant/dashboard.html
git add landingpage/
git commit -m "Deploy merchant admin for Shopify submission"
git push  # Auto-deploys to Vercel

# 2. Create and deploy privacy policy
# (Create landingpage/privacy.html as shown above)
git add landingpage/privacy.html landingpage/support.html
git commit -m "Add privacy policy and support docs"
git push

# 3. Test locally
open "landingpage/merchant/dashboard.html?shop=test-store.myshopify.com"

# 4. Deploy extension (if needed)
shopify app deploy

# 5. Submit!
# Go to: https://partners.shopify.com/organizations
# Navigate to: Apps → Fitted → Distribution → Submit app
```

Good luck with your submission! 🚀
