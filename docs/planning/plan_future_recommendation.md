# Future Recommendations

## Deferred Features (Re-add When User Base Grows)

### Rating System (Thumbs Up/Down)
- **Why deferred**: No value with few users. Gallery "popular" sorting is meaningless without scale.
- **What to re-add**:
  - `storyboard_gallery_ratings` table (fileId, userId, rating: "up"|"down", createdAt)
  - `thumbsUp` / `thumbsDown` counters on `storyboard_files`
  - One-vote-per-user enforcement via `by_file_user` index
  - Toggle/switch vote UI in gallery detail modal
  - Sort gallery by "popular" (thumbsUp count)
- **When**: 100+ active users browsing the gallery

### Credit Donation System
- **Why deferred**: Complex credit transfer logic, edge cases (self-donation, abuse, org permissions), no revenue impact (credits move between users, platform earns nothing).
- **What to re-add**:
  - `storyboard_gallery_donations` table (fileId, fromCompanyId, fromUserId, toCompanyId, amount, createdAt)
  - `totalDonations` counter on `storyboard_files`
  - `donation_in` / `donation_out` ledger entry types in `credits_ledger`
  - Donate credits UI in gallery detail modal (1-100 credits input)
  - Top creators leaderboard sorted by donations
  - Rules: only personal users can donate (not orgs), validate balance before transfer
- **When**: Monetization strategy is clear and community is active

### Donation Org Restriction (if re-added)
- Only personal user accounts can donate credits
- Orgs cannot donate because files may be owned by the host, members need permission
- Validate: if `fromCompanyId` starts with `org_`, block the donation

---

## Current Priority (Implement Now)

### Share/Unshare System
- Allow paid users and org members to share and unshare generated files
- Free users: auto-share on generation, cannot unshare (cost of free tier)
- Free user in org: org is the main account, can share files with same companyId
- No schema change needed — `isShared` already exists

### Tag Context Menu for Generated Files
- Right-click context menu on generated file cards
- Structured categories stored as `category:subcategory` in existing `tags` array:
  - **media**: thumbnail, magazine, banner
  - **character**: human-female, human-male, creatures, robot, animal
  - **prop**: car, object, fashion, weapon, furniture
  - **environment**: place, interior, structure
- No schema change needed — uses existing `tags` field
