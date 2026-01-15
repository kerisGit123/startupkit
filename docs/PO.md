# Purchase Order (PO) System - Implementation Plan (APPROVED)

## 1. Currency Storage Strategy ✅

### **APPROVED APPROACH: Cents Storage with UI Conversion**

#### **Storage Layer (Database)**
- **Format**: Cents (integers)
- **Example**: $0.12 is stored as `12`, $29.00 is stored as `2900`
- **All monetary fields**: `amount`, `subtotal`, `total`, `tax`, `discount`, `unitPrice`

#### **UI Layer (User Interface)**
- **Input**: User enters `0.12` (dollars with decimals)
- **Conversion**: System converts to `12` cents before saving
- **Display**: System shows `0.12` (converts from cents to dollars)
- **Formula**: 
  - Save: `Math.round(userInput * 100)` → Store as cents
  - Display: `storedValue / 100` → Show as dollars

#### **Benefits**
1. ✅ **User-friendly**: Users work with familiar dollar amounts
2. ✅ **Consistent**: Matches Stripe/Invoice storage pattern
3. ✅ **Precise**: No floating-point errors
4. ✅ **Simple**: Automatic conversion in UI layer only

#### **Implementation Notes**
- **Migration**: Only needed if existing PO data is stored in dollars (multiply by 100 to convert to cents)
- **If already in cents**: No migration needed, system already working correctly
- **UI forms**: Handle conversion transparently (user enters dollars, system stores cents)
- **API**: Always works with cents internally
- **PDF generation**: Displays in dollars (divide by 100)
- **No conversion needed**: The "conversion" is just UI display logic, not data transformation

---

## 2. Database Schema Updates

### A. Purchase Orders Table - Add Fields

```typescript
purchase_orders: defineTable({
  // ... existing fields ...
  // Existing monetary fields (already in cents):
  // subtotal: v.number(),
  // tax: v.optional(v.number()),
  // taxRate: v.optional(v.number()),
  // discount: v.optional(v.number()), // ✅ Already exists
  // total: v.number(),
  
  notes: v.optional(v.string()), // ✅ Already exists
  
  // NEW: Audit Trail Fields
  createdByClerkUserId: v.string(), // Clerk user ID of creator
  lastEditedByClerkUserId: v.optional(v.string()), // Clerk user ID of last editor
  lastEditedAt: v.optional(v.number()), // Timestamp of last edit
  
  // NEW: Conversion Tracking
  convertedToInvoiceId: v.optional(v.id("invoices")), // Track if converted to invoice
  convertedAt: v.optional(v.number()), // When it was converted
  convertedByClerkUserId: v.optional(v.string()), // Clerk user ID who converted it
})
```

**Note**: Discount field already exists in schema. All monetary values stored in cents.

### B. Invoices Table - Add PO Reference

```typescript
invoices: defineTable({
  // ... existing fields ...
  // Existing monetary fields (already in cents):
  // amount: v.number(),
  // subtotal: v.number(),
  // tax: v.optional(v.number()),
  // taxRate: v.optional(v.number()),
  // discount: v.optional(v.number()), // ✅ Already exists
  // total: v.number(),
  
  // NEW: Source Tracking
  purchaseOrderId: v.optional(v.id("purchase_orders")), // Reference to source PO
  purchaseOrderNo: v.optional(v.string()), // Store PO number for easy reference
  sourceType: v.union( // Track invoice source
    v.literal("stripe_subscription"),
    v.literal("stripe_payment"),
    v.literal("purchase_order"),
    v.literal("manual")
  ),
})
```

**Note**: Discount field already exists in schema. All monetary values stored in cents.

---

## 3. Purchase Order Workflow ✅

### Current Flow
```
Create PO → View PO → Download PDF
```

### **APPROVED Enhanced Flow (Direct Edit)**
```
Create PO → Edit PO (anytime) → Convert to Invoice (with preview) → Invoice Created
                ↓
           Download PDF
```

**Key Principles:**
- ✅ **No approval process** - Direct edit at any time
- ✅ **Audit trail** - Track who created and who last edited
- ✅ **Flexible conversion** - Can convert at any status
- ✅ **Preview before convert** - Show what invoice will look like

### Status Transitions (Simplified)
1. **draft** → Can edit freely, can delete, can convert
2. **issued** → Can still edit (audit trail tracks changes), can convert
3. **approved** → Can still edit (audit trail tracks changes), can convert
4. **received** → Locked after conversion to invoice (read-only)
5. **cancelled** → Read-only, cannot convert

**Note:** Status is more for workflow tracking than permission control. Editing is always allowed until conversion.

---

## 4. PO to Invoice Conversion ✅

### **APPROVED Conversion Process**

#### Step 1: Pre-Conversion (User Initiates)
1. User clicks "Convert to Invoice" on PO
2. System opens **Conversion Preview Modal**
3. User can:
   - ✅ **Remove items** (partial conversion)
   - ✅ **Adjust tax manually** (override calculated tax)
   - ✅ **Edit quantities** or prices
   - ✅ **Add notes** to invoice
   - ✅ **Preview** what invoice will look like

#### Step 2: Validation
- PO must not already be converted (`convertedToInvoiceId` is null)
- At least one item must be selected
- All selected items must have valid data
- User must confirm conversion

#### Step 3: Data Copying (Full Copy, Not Reference)
```typescript
PO Field              → Invoice Field (COPIED)
─────────────────────────────────────────────
poNo                  → purchaseOrderNo (stored)
                      → notes (appended: "Converted from PO-XXXXX")
vendorName            → billingDetails.name
vendorEmail           → billingDetails.email
vendorAddress         → billingDetails.address
items[] (selected)    → items[] (FULL COPY with all details)
subtotal              → subtotal (recalculated from selected items)
tax                   → tax (user can override)
taxRate               → taxRate (user can override)
discount              → discount (copied, user can override)
total                 → total (recalculated)
notes                 → notes (appended to existing)
currency              → currency (copied)

**All monetary values in cents** - No conversion needed during copy.
```

**Why Copy Instead of Reference?**
- Invoice becomes independent document
- Can be edited without affecting original PO
- Maintains data integrity if PO is later modified
- Clearer for accounting and auditing

#### Step 4: Invoice Generation
- Generate new invoice number using unified invoice numbering system
- Set `sourceType` = "purchase_order"
- Set `purchaseOrderId` = PO._id (link back to source)
- Set `purchaseOrderNo` = PO.poNo (for display/reference)
- Set `invoiceType` = "payment"
- Set `transactionType` = "one_time"
- Set `status` = "draft" (admin can review before issuing)
- Set `companyId` = PO.companyId
- Set `userId` = current user (converter)

#### Step 5: Update PO (Mark as Converted)
- Set `convertedToInvoiceId` = new invoice._id
- Set `convertedAt` = current timestamp
- Set `convertedByClerkUserId` = current user's Clerk ID
- Update `status` to "received" (locked for editing)
- Add note: "Converted to Invoice [invoice number] on [date]"

#### Step 6: Partial Conversion Handling
**If user removed some items during conversion:**
- Original PO remains unchanged (all items preserved)
- Only selected items copied to invoice
- PO notes updated to indicate partial conversion
- Consider: Option to create new PO with remaining items (future feature)

### Conversion Preview Modal UI
```
┌─────────────────────────────────────────┐
│ Convert PO-260001 to Invoice            │
├─────────────────────────────────────────┤
│ Select items to convert:                │
│ ☑ Item 1: Widget A - $10.00            │
│ ☑ Item 2: Widget B - $20.00            │
│ ☐ Item 3: Widget C - $5.00 (excluded)  │
│                                         │
│ Subtotal: $30.00                        │
│ Tax (6%): $1.80 [Edit] ← Manual override│
│ Total: $31.80                           │
│                                         │
│ Additional Notes:                       │
│ [Text area for notes]                   │
│                                         │
│ [Cancel] [Preview Invoice] [Convert]    │
└─────────────────────────────────────────┘
```

---

## 5. UI/UX Implementation ✅

### A. Invoices & POs Page (`/admin/invoices-and-pos`)

#### Purchase Orders Tab - Enhanced Actions Column
```
Actions:
├─ 👁️ View (existing)
├─ 📥 Download PDF (existing)
├─ ✏️ Edit PO (NEW - always available until converted)
└─ 🔄 Convert to Invoice (NEW - disabled if already converted)
```

**Conversion Status Indicator:**
- Show badge if PO is converted: `✓ Converted to INV-12345`
- Disable "Convert" button if already converted
- Show who converted and when (hover tooltip)

### B. Edit PO Page (`/admin/po/[id]/edit`)

**Features:**
- ✅ **Inline editing** - All fields editable directly
- ✅ **Item management** - Add/remove/reorder line items
- ✅ **Auto-calculation** - Totals update as user types
- ✅ **Currency handling** - User enters dollars (0.12), system stores cents (12)
- ✅ **Convert button** - Prominent "Convert to Invoice" button
- ✅ **Audit trail** - Show who created and who last edited
- ✅ **Auto-save** - Save changes automatically or with Save button

**Form Layout:**
```
┌─────────────────────────────────────────┐
│ Edit Purchase Order: PO-260001          │
│ Created by: John Doe (Jan 15, 2026)     │
│ Last edited by: Jane Smith (Jan 15)     │
├─────────────────────────────────────────┤
│ Vendor: [Input]                         │
│ Email: [Input]                          │
│ Address: [Textarea]                     │
│                                         │
│ Line Items:                             │
│ 1. [Description] [Qty] [$0.12] [Remove]│
│ 2. [Description] [Qty] [$10.00] [Remove]│
│ [+ Add Item]                            │
│                                         │
│ Subtotal: $10.12 (auto-calculated)      │
│ Tax (6%): $0.61 (auto-calculated)       │
│ Total: $10.73                           │
│                                         │
│ Notes: [Textarea]                       │
│                                         │
│ [Save] [Convert to Invoice]             │
└─────────────────────────────────────────┘
```

### C. PO Detail Page (`/admin/po/[id]`)

**Add:**
- "Edit" button (if status allows)
- "Convert to Invoice" button (if not converted)
- Show conversion status (if converted, link to invoice)
- Show internal notes (admin only)

---

## 6. Navigation Menu Update

### Current Structure
```
├─ Dashboard
├─ Users
├─ Invoices & POs (combined page)
└─ Settings
```

### Proposed Addition
```
├─ Dashboard
├─ Users
├─ Invoices (NEW - separate page for invoices only)
├─ Invoices & POs (keep for combined view)
└─ Settings
```

**Rationale:**
- Invoices are frequently accessed
- Separate page allows invoice-specific filters and actions
- Combined page still available for cross-reference

---

## 7. Implementation Considerations ✅

### ✅ RESOLVED: Currency Storage (No Conversion Needed)
**Approach**: Cents storage with UI display formatting
- **User enters**: `0.12` (dollars in UI)
- **System stores**: `12` (cents in database)
- **System displays**: `0.12` (dollars in UI)
- **Migration**: Only if existing data is in dollars (check first!)
- **Key Point**: This is NOT a "conversion" - it's just how we display the data. The database always stores cents.

### ✅ RESOLVED: Invoice Numbering
**Approach**: Unified numbering system
- Use existing `platform_config` invoice numbering
- PO-converted invoices get next sequential number
- Store `purchaseOrderNo` field for reference
- No conflicts with Stripe invoices

### ✅ RESOLVED: Audit Trail
**Approach**: Simple field tracking
- `createdByClerkUserId` - Who created PO
- `lastEditedByClerkUserId` - Who last edited
- `lastEditedAt` - When last edited
- `convertedByClerkUserId` - Who converted to invoice
- No complex edit history array needed (keep it simple)

### ✅ RESOLVED: Partial Conversions
**Approach**: Item selection in preview modal
- User can uncheck items before conversion
- Only selected items copied to invoice
- Original PO remains unchanged
- PO notes updated to indicate partial conversion

### ✅ RESOLVED: Tax Calculation
**Approach**: Manual override during conversion
- Preview modal shows calculated tax
- User can manually edit tax amount
- User can manually edit tax rate
- Final values copied to invoice as-is

---

## 8. Implementation Phases (APPROVED) ✅

### Phase 1: Foundation & Schema Updates (Priority: HIGH)
- [ ] **Schema**: Add `purchaseOrderId`, `purchaseOrderNo`, `sourceType` to invoices table
- [ ] **Schema**: Add audit trail fields to purchase_orders (`createdByClerkUserId`, `lastEditedByClerkUserId`, `lastEditedAt`)
- [ ] **Schema**: Add conversion tracking fields (`convertedToInvoiceId`, `convertedAt`, `convertedByClerkUserId`)
- [ ] **Schema**: Verify `discount` field exists in both invoices and purchase_orders (should already exist)
- [ ] **Data Check**: Verify existing PO data format (cents vs dollars)
- [ ] **Migration**: ONLY if needed - Create script to convert existing PO amounts to cents (multiply by 100)
- [ ] **Navigation**: Add "Invoices" link to navigation menu (separate from combined page)
- [ ] **Deploy**: Push schema changes to Convex

### Phase 2: PO Edit Functionality (Priority: HIGH)
- [ ] **Page**: Create PO edit page (`/admin/po/[id]/edit`)
- [ ] **Mutation**: Create `updatePurchaseOrder` mutation with audit trail and discount field
- [ ] **UI**: Currency input handling (user enters dollars, store cents)
- [ ] **UI**: Auto-calculate totals including discount as user edits
- [ ] **UI**: Add/remove line items functionality
- [ ] **UI**: Discount input field (user enters dollars, stored as cents)
- [ ] **UI**: Show audit trail (created by, last edited by)
- [ ] **Button**: Add edit icon/button to PO table
- [ ] **Button**: Add edit button to PO detail page

### Phase 3: Conversion Feature with Preview (Priority: HIGH)
- [ ] **Modal**: Create conversion preview modal component
- [ ] **UI**: Item selection checkboxes (partial conversion)
- [ ] **UI**: Manual tax override inputs
- [ ] **UI**: Manual discount override input (NEW)
- [ ] **UI**: Preview invoice before conversion
- [ ] **Mutation**: Create `convertPOToInvoice` mutation with discount support
  - Copy all selected data to invoice (including discount)
  - Generate new invoice number
  - Update PO with conversion tracking
  - Lock PO after conversion
- [ ] **Button**: Add "Convert to Invoice" button to PO edit page
- [ ] **Button**: Add "Convert to Invoice" button to PO table (conditional)
- [ ] **Status**: Show conversion status badge in PO table

### Phase 4: Testing & Polish (Priority: MEDIUM)
- [ ] Test currency conversion (UI input → storage → display)
- [ ] Test full PO conversion
- [ ] Test partial PO conversion (some items excluded)
- [ ] Test manual tax override
- [ ] Test audit trail tracking
- [ ] Test PDF generation for both PO and converted invoice
- [ ] Verify invoice numbering doesn't conflict
- [ ] Test with different user roles (Clerk user IDs)

### Phase 5: Optional Enhancements (Priority: LOW - Future)
- [ ] Bulk PO operations (convert multiple POs at once)
- [ ] Email notifications on conversion
- [ ] Advanced edit history (track specific field changes)
- [ ] PO templates for common purchases
- [ ] Approval workflow (if needed later)

---

## 9. API Functions Needed ✅

### Mutations

```typescript
// 1. Update existing PO with audit trail
updatePurchaseOrder({
  poId: Id<"purchase_orders">,
  updates: {
    vendorName?: string,
    vendorEmail?: string,
    vendorAddress?: string,
    items?: Array<{
      description: string,
      quantity: number,
      unitPrice: number, // in cents
      total: number, // in cents
    }>,
    subtotal?: number, // in cents
    tax?: number, // in cents
    taxRate?: number,
    discount?: number, // in cents (NEW)
    total?: number, // in cents
    notes?: string,
    status?: "draft" | "issued" | "approved" | "received" | "cancelled",
  },
  clerkUserId: string, // For audit trail
})

**Note**: All monetary values (subtotal, tax, discount, total, unitPrice) are in cents.

// 2. Convert PO to Invoice with preview data
convertPOToInvoice({
  poId: Id<"purchase_orders">,
  selectedItemIndexes: number[], // For partial conversion
  overrides?: {
    tax?: number, // Manual tax override (in cents)
    taxRate?: number, // Manual tax rate override
    discount?: number, // Manual discount override (in cents) (NEW)
    notes?: string, // Additional notes for invoice
  },
  clerkUserId: string, // Who is converting
})
// Returns: { invoiceId, invoiceNo }

**Note**: All monetary overrides are in cents.

// 3. Migrate PO amounts to cents (one-time migration - ONLY IF NEEDED)
migratePOAmountsToCents()
// Only run if existing data is in dollars format
// Multiplies all monetary fields by 100
// Check data first: if subtotal=2 for $2.00, run migration
// If subtotal=200 for $2.00, already in cents, skip migration
```

### Queries

```typescript
// 1. Get PO with conversion status
getPurchaseOrderById({ 
  poId: Id<"purchase_orders"> 
})
// Returns PO with all fields including conversion tracking

// 2. Get PO with creator/editor details
getPOWithAuditTrail({ 
  poId: Id<"purchase_orders"> 
})
// Returns PO + creator name + last editor name (from Clerk)

// 3. Check if PO can be converted
canConvertPO({ 
  poId: Id<"purchase_orders"> 
})
// Returns: { canConvert: boolean, reason?: string }

// 4. Get invoices created from POs
getInvoicesFromPOs({ 
  companyId?: string,
  limit?: number 
})
// Returns invoices where sourceType === "purchase_order"

// 5. Get conversion preview data
getConversionPreview({
  poId: Id<"purchase_orders">,
  selectedItemIndexes: number[],
})
// Returns calculated totals for preview modal
```

---

## 10. Testing Checklist

- [ ] Create PO with amounts in cents
- [ ] Edit PO and verify changes persist
- [ ] Convert PO to invoice
- [ ] Verify invoice has correct PO reference
- [ ] Verify PO shows conversion status
- [ ] Test PDF generation for both PO and converted invoice
- [ ] Test currency display (cents → dollars)
- [ ] Test with service tax enabled/disabled
- [ ] Test with rounding enabled/disabled
- [ ] Verify invoice numbering doesn't conflict

---

## 11. WidgetCustomizer.tsx Analysis

**File**: `d:\gemini\startupkit\components\widget-designer\WidgetCustomizer.tsx`

### TypeScript Issues Found:

#### Issue 1: `any` types (Lines 10-11)
```typescript
config: any;
onChange: (updates: any) => void;
```
**Recommendation**: Define proper interface
```typescript
interface WidgetConfig {
  theme?: 'light' | 'dark' | 'auto';
  position?: 'left' | 'right';
  roundness?: number;
  companyName?: string;
  companyLogoUrl?: string;
  // ... etc
}

interface WidgetCustomizerProps {
  config: WidgetConfig;
  onChange: (updates: Partial<WidgetConfig>) => void;
}
```

#### Issue 2: Slider value type (Line 41)
```typescript
onValueChange={(value: number[]) => onChange({ roundness: value[0] })}
```
**Status**: ✅ Correct - Slider returns `number[]`

### Overall Assessment:
- **Severity**: Low - Code works but lacks type safety
- **Impact**: No runtime errors, just TypeScript warnings
- **Priority**: Medium - Should fix for better maintainability

---

## 12. Decisions Made ✅

### ✅ Converted POs are locked (read-only)
- After conversion, PO status changes to "received"
- No further edits allowed to maintain data integrity
- Original PO preserved as historical record

### ✅ No "unconverting" feature
- Once converted, it's permanent
- Invoice becomes independent document
- If needed, user can create new PO and cancel invoice manually

### ✅ No approval workflow (direct conversion)
- User can convert at any time
- Preview modal provides safety check
- Keeps workflow simple and fast

### ✅ No email notifications (for now)
- Can be added in Phase 5 if needed
- Focus on core functionality first

### ✅ PO edits after conversion: Not allowed
- PO is locked after conversion
- Invoice can be edited independently
- Maintains clear audit trail

---

## 13. Implementation Checklist

### Before Starting:
- [x] Review and approve this document
- [x] Confirm currency storage approach (cents with UI display formatting)
- [x] Confirm data copying approach (copy, not reference)
- [x] Confirm workflow (direct edit, no approval)
- [x] Confirm discount field needed in both PO and Invoice
- [ ] Check existing PO data format (cents vs dollars)
- [ ] Backup existing PO data before migration (if needed)

### Ready to Implement:
- [ ] Phase 1: Schema updates and migration
- [ ] Phase 2: PO edit functionality
- [ ] Phase 3: Conversion feature with preview
- [ ] Phase 4: Testing and polish

---

**Document Version**: 2.0 (APPROVED)  
**Last Updated**: 2026-01-15  
**Status**: ✅ **APPROVED - Ready for Implementation**  
**Approved By**: User  
**Next Action**: Begin Phase 1 Implementation
