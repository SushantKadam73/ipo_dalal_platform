# IPO Data Structure Analysis: Mainboard vs SME

## Executive Summary
This document provides a detailed comparison of JSON structures between mainboard IPOs (ALLTIME, JSW) and SME IPOs (AMCL, CONNPLEX, SAWALIYA), identifying common fields, unique fields, data type differences, and nested structures requiring normalization.

## 1. Common Fields Across Both Categories

### Top-Level Fields
- `companyName` (string): Present in all IPOs
- `metaInfo` (object): Empty object in all samples
- `bidDetails` (array): Contains bidding information
- `issueInfo` (object): Contains issue-specific information
- `activeCat` (object): Active category information
- `demandGraph` (object): Demand graph data
- `demandDataNSE` (array): NSE demand data
- `demandDataBSE` (array): BSE demand data
- `demandGraphALL` (object): Combined demand graph

## 2. Fields Unique to Mainboard IPOs

### In bidDetails Array Objects
**Mainboard Structure:**
- `noOfSharesOffered` (string): Number of shares offered
- `noOfsharesBid` (string): Number of shares bid (note lowercase 's' in shares)
- `noOfTime` (string): Subscription times

**Categories Unique to Mainboard:**
- Category 3: "Retail Individual Investors(RIIs)" with subcategories:
  - 3(a): "Cut Off"
  - 3(b): "Price bids"
- Category 4: "Employees" (ALLTIME only) with subcategories:
  - 4(a): "Cut Off"
  - 4(b): "Price Bids"

### In issueInfo.dataList
**Mainboard-specific fields:**
- "Discount" field (present in both ALLTIME and JSW)
- "Maximum Subscription Amount for Eligible Employee" (ALLTIME only)
- "Bidding Centers" link
- "Remark" about bid modification window
- Separate "Security Parameters (Pre Anchor)" and "Security Parameters (Post Anchor)"

## 3. Fields Unique to SME IPOs

### In bidDetails Array Objects
**SME Structure:**
- `noOfshareBid` (string): Number of shares bid (note: no space in "Of")
- `noofapplication` (string): Number of applications

**Categories Unique to SME:**
- Category 3: "Individual Investors (IND category bidding for 2 Lots)"
- Subcategory 2.1(b) and 2.2(b): "Individuals(IND category bidding for more than 2 Lots)" instead of "Individuals(Other than RIIs)"

### In issueInfo
**SME-specific structure:**
- Has `heading` field with company name (not present in mainboard)
- Single "Security Parameters" field (not split into Pre/Post Anchor)

### In demandGraphALL
**SAWALIYA specific:**
- Error handling: `{"msg": "error while fetching data"}`

## 4. Data Type Differences for Similar Fields

### Critical Naming Differences in bidDetails:

| Field | Mainboard | SME |
|-------|-----------|-----|
| Shares Offered | `noOfSharesOffered` | Not present in first-level |
| Shares Bid | `noOfsharesBid` (lowercase 's') | `noOfshareBid` (no space) |
| Subscription Times | `noOfTime` | Not present |
| Applications | Not present | `noofapplication` |

### In activeCat.dataList:
- Mainboard: Uses `noOfSharesBid` (capital 'S')
- SME: Uses `noOfSharesBid` (same structure in activeCat)
- Both use `noOfTotalMeant` with same structure

### Numeric Data Representation:
- **Mainboard**: Often uses scientific notation (e.g., "1.0546297E7", "7.690121990832886E-4")
- **SME**: Uses standard numeric strings (e.g., "704800", "0.31")

## 5. Nested Object Structures Requiring Normalization

### 5.1 bidDetails Array
**Normalization Requirements:**
- Standardize field names (`noOfsharesBid` vs `noOfshareBid`)
- Handle missing fields (mainboard lacks `noofapplication`, SME lacks `noOfTime`)
- Normalize category nomenclature differences

### 5.2 issueInfo.dataList Array
**Structure:** Array of objects with `title` and `value` pairs
**Normalization Requirements:**
- Convert to key-value dictionary for easier access
- Handle HTML entities in values (e.g., `\u003Ca href=...`)
- Standardize URL formats and escape sequences

### 5.3 demandGraph Object
**Common Fields:**
- `plotData`: Object with price points as keys
- `graphData`: Array of objects with `type` and `value`
- `totalBidAtCutOff`: String (may be "-" for SME)

**Normalization Requirements:**
- Parse comma-separated numbers in `plotData` values
- Convert string numbers to appropriate numeric types
- Handle "-" values in SME data

### 5.4 demandDataNSE/BSE Arrays
**Structure:** Array of objects with:
- `symbol`, `company`, `timestamp`, `price`, `cumQty`

**Normalization Requirements:**
- Parse comma-separated cumQty values
- Standardize timestamp formats (note case differences in BSE timestamps)
- Handle "Cut-Off" as special price value

## 6. Recommended Schema Normalization Strategy

### 6.1 Unified BidDetails Schema
```json
{
  "srNo": "string",
  "category": "string",
  "noOfSharesOffered": "number",
  "noOfSharesBid": "number",
  "noOfApplications": "number",
  "subscriptionTimes": "number"
}
```

### 6.2 Normalized IssueInfo
Convert dataList array to dictionary:
```json
{
  "symbol": "string",
  "companyName": "string",
  "issuePeriod": {
    "start": "date",
    "end": "date"
  },
  "priceRange": {
    "min": "number",
    "max": "number"
  },
  "lotSize": "number",
  "faceValue": "number",
  // ... other fields as key-value pairs
}
```

### 6.3 Unified Category Mapping
Create a mapping table for category standardization:
- Map "Retail Individual Investors(RIIs)" ↔ "Individual Investors (IND category bidding for 2 Lots)"
- Map "Individuals(Other than RIIs)" ↔ "Individuals(IND category bidding for more than 2 Lots)"

## 7. Data Quality Issues Identified

1. **Inconsistent Field Naming**: Multiple variations of the same field (e.g., noOfsharesBid vs noOfshareBid)
2. **Mixed Data Types**: Numbers stored as strings with various formats
3. **HTML Entities**: Values contain unescaped HTML entities
4. **Empty Objects**: `metaInfo` is consistently empty across all samples
5. **Null Values**: Some `srNo` fields are null for total rows
6. **Error Handling**: Inconsistent error representation (e.g., SAWALIYA's demandGraphALL)

## 8. Implementation Recommendations

1. **Create adapter classes** for mainboard and SME data that normalize to a common interface
2. **Implement parsers** for:
   - Comma-separated numbers
   - Scientific notation
   - Date ranges
   - Price ranges
3. **Build validation layer** to handle:
   - Missing fields
   - Null values
   - Error states
4. **Establish data pipeline** that:
   - Validates incoming data
   - Normalizes field names
   - Converts data types
   - Handles special cases (e.g., Employee category in mainboard)

## Conclusion

The analysis reveals significant structural differences between mainboard and SME IPO data, particularly in field naming conventions, category structures, and data representation. A robust normalization strategy is essential for building a unified platform that can handle both types of IPOs seamlessly.
