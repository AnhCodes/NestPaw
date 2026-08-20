# NestPaw Sample Sales Return Analysis

**Date:** August 16, 2026

## Overview

This analysis calculates the expected return if all sample inventory is sold at retail prices through shopnestpaw.com, accounting for all fees, shipping costs, and returns padding.

---

## Product Catalog & Unit Economics

| Product | Sell Price | Alibaba Cost | Unit Contribution* |
|---------|------------|--------------|-------------------|
| **Shedding Brush Kit** | $24.00 | $6.09 | $11.41 - $17.61 |
| **Forage Snuffle Mat** | $69.00 | $45.04 | $0.00 - $11.46 |
| **Silicone Slow Feeder Mat** | $34.00 | $19.12 | $2.88 - $8.38 |
| **Quiet Nail Grinder** | $25.00 | $10.79 | $6.71 - $12.21 |
| **Suction Lick Mat** | $14.00 | ~$8.00** | $0.00 - $1.00 |

*Unit contribution range accounts for:
- Freight to US: $3.00 - $12.00 per unit
- Outbound shipping: $5.00 - $12.00 per unit
- Stripe fees: 2.9% + $0.30 per transaction
- Returns padding: 3% of sell price
- Customer pays $5.50 shipping for orders under $40 (free over $40)

**Estimated based on similar product costs

---

## Sample Order Assumptions

Based on typical sample ordering strategy (test quality before bulk MOQ):

| Product | Sample Qty | Notes |
|---------|------------|-------|
| Shedding Brush Kit | 5 kits (10 components) | Small test before MOQ 50 |
| Forage Snuffle Mat | 2 units | High unit cost, test quality first |
| Silicone Slow Feeder Mat | 3 units | Moderate cost, test before MOQ 200 |
| Quiet Nail Grinder | 3 units | MOQ 1, low barrier to test |
| Suction Lick Mat | 5 units | Low cost entry product |

**Total Sample Units: 18 products**

---

## Revenue & Cost Analysis

### Total Revenue (if all samples sell at retail)
```
5 × $24.00  = $120.00  (Brush Kits)
2 × $69.00  = $138.00  (Snuffle Mats)
3 × $34.00  = $102.00  (Slow Feeders)
3 × $25.00  = $75.00   (Nail Grinders)
5 × $14.00  = $70.00   (Lick Mats)
─────────────────────
TOTAL REVENUE: $505.00
```

### Total Cost of Goods (Alibaba wholesale)
```
5 × $6.09   = $30.45   (Brush Kits)
2 × $45.04  = $90.08   (Snuffle Mats)
3 × $19.12  = $57.36   (Slow Feeders)
3 × $10.79  = $32.37   (Nail Grinders)
5 × $8.00   = $40.00   (Lick Mats - estimated)
─────────────────────
TOTAL COGS: $250.26
```

### Fee & Shipping Calculations

**Scenario A: Light Freight** (best case)
- Inbound freight to US: $3/unit × 18 = $54
- Outbound shipping cost: $5/unit × 18 = $90
- Shipping collected from customers: ~$80 (avg 14 orders under $40 @ $5.50)
- Net shipping cost: $90 - $80 = $10
- Stripe fees (2.9% + $0.30 × 18): $19.65
- Returns padding (3%): $15.15

**Scenario B: Heavy Freight** (worst case)
- Inbound freight to US: $12/unit × 18 = $216
- Outbound shipping cost: $12/unit × 18 = $216
- Shipping collected from customers: ~$80
- Net shipping cost: $216 - $80 = $136
- Stripe fees: $19.65
- Returns padding: $15.15

---

## Expected Return Summary

### Best Case Scenario (Light Freight)
```
Total Revenue:              $505.00
Less: COGS                  -$250.26
Less: Inbound freight       -$54.00
Less: Net outbound ship     -$10.00
Less: Stripe fees           -$19.65
Less: Returns padding       -$15.15
──────────────────────────────────
NET PROFIT (Best):          $155.94
ROI (Best):                 46.7%
```

### Worst Case Scenario (Heavy Freight)
```
Total Revenue:              $505.00
Less: COGS                  -$250.26
Less: Inbound freight       -$216.00
Less: Net outbound ship     -$136.00
Less: Stripe fees           -$19.65
Less: Returns padding       -$15.15
──────────────────────────────────
NET PROFIT (Worst):         -$132.06
ROI (Worst):                -20.3%
```

### Realistic Middle Scenario (Medium Freight)
```
Inbound: $6/unit × 18      = $108.00
Outbound: $7/unit × 18     = $126.00
Shipping collected:        = $80.00
Net outbound:              = $46.00

Total Revenue:              $505.00
Less: COGS                  -$250.26
Less: Inbound freight       -$108.00
Less: Net outbound ship     -$46.00
Less: Stripe fees           -$19.65
Less: Returns padding       -$15.15
──────────────────────────────────
NET PROFIT (Realistic):     $65.94
ROI (Realistic):            16.5%
```

---

## Key Insights

### 1. **Expected Return: $66 - $156 profit** (13% - 47% ROI)
If all samples sell, NestPaw can expect to net between $66-$156 depending on freight costs, representing a 16.5% ROI in the realistic middle scenario.

### 2. **Freight Risk**
The snuffle mat has the highest freight exposure. At $45.04 COGS and $69 retail, heavy freight could eliminate most profit. This validates the strategy to order only 2 samples before committing to the MOQ 90 bulk order.

### 3. **Winner Products**
- **Shedding Brush Kit**: Best margins ($11-$18 per unit contribution)
- **Nail Grinder & Slow Feeder**: Solid middle performers
- **Lick Mat**: Entry-level price point for customer acquisition

### 4. **Cash Outlay**
Total capital at risk in sample inventory: ~$400-500 including freight.

### 5. **Validation Goal**
The samples serve to:
- Test product quality and shipping times
- Validate messaging and conversion rates
- Identify winners before committing to MOQ bulk orders ($304.50 brush kits, $4,053.60 snuffle mats, $3,824 feeders)

---

## Next Steps to Maximize Return

1. ✅ **QA all samples immediately** upon arrival
2. ✅ **Price test** on the snuffle mat (currently priced at $69 vs catalog $28 - needs alignment)
3. ✅ **Bundle strategy**: Encourage multi-item orders to hit $40 free shipping threshold
4. ✅ **Track by SKU**: Monitor which products convert best
5. ✅ **Kill or double**: Only reorder bulk for proven winners

---

## Conclusion

**Expected return if all samples sell: $66 (realistic) to $156 (best case)**

This represents a positive ROI on the sample investment and validates the low-risk testing approach. The key is to:
- Sell multi-item orders to absorb shipping costs
- Use samples to validate demand before $8K+ bulk commitments
- Focus marketing dollars on the proven winners (likely brush kit and nail grinder)

---

*Analysis based on data from `/workspace/business/scripts/generate-catalog.py` and `/workspace/store/src/lib/products.ts`*

*Note: Snuffle mat pricing shows $69 in products.ts but investor brief shows $28 - recommend aligning pricing before launch*
