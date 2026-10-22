# 📱 Mobile Screen 19: Ratings & Customer Reviews

## 📍 File & Route Specification
- **File Path**: `mobile/app/(vendor)/reviews.tsx`
- **Route URL**: `/(vendor)/reviews`
- **Access Level**: Authenticated Merchant

---

## 🎯 Purpose & Business Logic
Store quality and customer feedback monitoring hub. Displays overall store rating (`4.96 ⭐`), verified review breakdown, dimension ratings (Product Quality, Packaging, Order Accuracy, Delivery Speed), customer review cards, professional merchant replies, and public privacy moderation.

---

## 🎨 Visual Design & UI System
- **Rating Summary Hero Card**: Dynamic average rating (`4.96 ⭐`), 128 verified reviews count, and 4 dimension progress bars (Product Quality `4.9`, Packaging `5.0`, Accuracy `4.9`, Delivery `4.8`).
- **Review Cards**: Verified customer name (`Ananya R.`), star rating (5/5), order date, purchased product badge (`Plum Niacinamide Serum`), review text, and published merchant reply box.
- **Reply Modal**: Interactive merchant response composer with public privacy guard.

---

## ⚡ Key Features & Data Flow
- **Dynamic Loading**: Dynamically fetches review data via `reviewsApi.getStoreReviews()`; renders skeleton loaders during initial fetch.
- **Contact Info Guard**: Enforces regex moderation preventing transmission of phone numbers, emails, URLs, or UPI IDs in public replies.
- **Filter Pills**: Filter reviews by rating (5 Star, 4 Star, 3 Star, 2 Star, 1 Star).

---

## ♿ Edge & Lifecycle States
- **No Reviews Yet**: Renders clean empty state `"No verified customer reviews for this date range."`
- **Prohibited Contact Info**: Blocks reply and displays `"For customer safety, contact details cannot be published in public replies."`
