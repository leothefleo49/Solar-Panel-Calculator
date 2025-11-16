# Google Solar API Setup Guide

This guide walks you through setting up Google Cloud API keys to enable real-world roof analysis and solar potential calculations in the Solar Panel Calculator app.

## 🌟 What You Get with Solar API

- **Real Roof Analysis**: Actual roof dimensions, pitch, and orientation from satellite imagery
- **Sun Exposure Data**: Precise sunshine hours and solar irradiance for any address
- **Panel Configuration**: Google's recommended panel layouts optimized for your roof
- **Financial Projections**: Cost estimates, savings, and payback periods based on real data
- **AI-Powered Insights**: All Solar API data is sent to your AI assistant for intelligent recommendations

## 🔑 API Key Options

You have **three flexible options** for managing API keys:

### Option 1: Unified Google Cloud API Key (Recommended)
Use a single API key for all Google services:
- ✅ Solar API
- ✅ Maps Geocoding API  
- ✅ Gemini AI (optional)

**Pros**: Simple management, one bill, easy to set up  
**Cons**: All services share the same quota and billing

### Option 2: Separate API Keys
Use individual keys for each service:
- Solar API key
- Maps API key
- Gemini AI key (optional)

**Pros**: Independent quota management, can use different billing accounts  
**Cons**: More keys to manage

### Option 3: No Google APIs
The app works fully without any Google APIs:
- ✅ All calculator features work
- ✅ AI chat works with any provider (OpenAI, Claude, Grok)
- ❌ Address-based roof analysis unavailable
- ❌ Real-world solar data unavailable

---

## 📋 Setup Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter a project name (e.g., "Solar Calculator")
4. Click **Create**

### Step 2: Enable Required APIs

1. In the Cloud Console, go to **APIs & Services** → **Library**
2. Search for and enable these APIs:
   - **Solar API** (required)
   - **Maps JavaScript API** or **Geocoding API** (required)
   - **Gemini API** (optional, for AI features)

### Step 3: Create API Keys

#### For Unified Key (Recommended):
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the generated key
4. (Optional but recommended) Click **Restrict Key**:
   - Under "API restrictions", select "Restrict key"
   - Choose: Solar API, Geocoding API, Generative Language API
   - Click **Save**

#### For Separate Keys:
Create multiple API keys and restrict each to specific APIs:
1. **Solar Key**: Restrict to Solar API only
2. **Maps Key**: Restrict to Geocoding API only  
3. **Gemini Key**: Restrict to Generative Language API only

### Step 4: Set Up Billing (Required)

⚠️ **Google Cloud APIs require a billing account**, but Solar API has a generous free tier:

1. In Cloud Console, go to **Billing**
2. Click **Link a billing account** or create a new one
3. Add payment information

**Free Tier Limits (as of 2025):**
- Solar API: 750 requests/month free, then $0.02/request
- Geocoding API: $200 credit/month (≈40,000 requests)
- Gemini: Various tiers, many with free allowances

💡 For typical usage (analyzing a few properties per month), you'll likely stay within free limits.

### Step 5: Add Keys to the App

1. Open the Solar Panel Calculator app
2. Go to **Dashboard** → **Google Solar API** tab
3. Choose your key mode:
   - **Unified Key**: Paste your single API key
   - **Separate Keys**: Paste each key into its respective field
4. Click the 👁️ **Show** button if you want to view your keys
5. Keys are saved locally and persist between sessions

### Step 6: Analyze a Property

1. In the "Property Address" field, enter any address:
   ```
   1600 Amphitheatre Parkway, Mountain View, CA
   ```
2. Click **Analyze**
3. Wait 5-10 seconds for analysis
4. View results and AI recommendations in the chat assistant

---

## 🔒 Security & Privacy

- **Local Storage**: All API keys are stored only on your device (localStorage/secure storage)
- **No Transmission**: Keys are never sent to our servers (we don't have servers!)
- **Clear Anytime**: Use the "Clear" button to remove keys from storage
- **Show/Hide**: Toggle password visibility with the 👁️ button

---

## 💰 Cost Estimate Examples

Based on Google Cloud pricing (as of Nov 2025):

| Usage Pattern | Est. Monthly Cost |
|--------------|-------------------|
| Analyze 10 properties/month | **$0.00** (within free tier) |
| Analyze 100 properties/month | **~$2.00** |
| Analyze 1000 properties/month | **~$20.00** |

*Geocoding is usually free with $200/month credit*  
*Gemini AI has separate pricing, varies by model*

---

## ❓ Troubleshooting

### "API key is required" error
- **Cause**: No API key configured
- **Fix**: Add a unified or Solar+Maps key in the Google Solar API tab

### "Failed to geocode address" error
- **Cause**: Invalid address or Maps API not enabled
- **Fix**: 
  1. Check address spelling
  2. Verify Maps/Geocoding API is enabled in Cloud Console
  3. Ensure API key has Geocoding API access

### "Failed to fetch solar potential" error
- **Cause**: Solar API not enabled or address has no data
- **Fix**:
  1. Verify Solar API is enabled in Cloud Console
  2. Try a different address (some areas don't have coverage)
  3. Check billing is set up correctly

### "OVER_QUERY_LIMIT" error
- **Cause**: Exceeded free tier quota
- **Fix**: 
  1. Check usage in Cloud Console → APIs & Services → Dashboard
  2. Wait until quota resets (monthly)
  3. Increase quota limits in Cloud Console

### Solar data available in my area?
Google Solar API covers:
- ✅ Most of the United States
- ✅ Many European countries
- ✅ Growing coverage worldwide

Check coverage by entering your address. If no data is available, the API will return an error.

---

## 🆘 Support

- **App Issues**: [GitHub Issues](https://github.com/leothefleo49/Solar-Panel-Calculator/issues)
- **Google Cloud Setup**: [Google Cloud Support](https://cloud.google.com/support)
- **Solar API Docs**: [Solar API Reference](https://developers.google.com/maps/documentation/solar)

---

## 📚 Additional Resources

- [Google Solar API Documentation](https://developers.google.com/maps/documentation/solar)
- [Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google Cloud Pricing Calculator](https://cloud.google.com/products/calculator)

---

**Pro Tip**: Start with a unified key to simplify setup. You can always switch to separate keys later if you need independent quota management! 🚀
