import { MongoClient, ObjectId } from 'mongodb'

const uri = process.env.MONGODB_URI!
const dbName = process.env.MONGODB_DB_NAME ?? 'fraud-triage'
if (!uri) throw new Error('MONGODB_URI not set')

const now = Date.now()
const daysAgo = (n: number) => new Date(now - n * 86_400_000)
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2))

// ── Analysts ─────────────────────────────────────────────────────────────────

const analysts = [
  { name: 'Sarah Chen',      team: 'Fraud Analysis',  role: 'Senior Analyst' },
  { name: 'Marcus Williams', team: 'Fraud Analysis',  role: 'Analyst' },
  { name: 'Priya Patel',     team: 'Risk Operations', role: 'Team Lead' },
]

// ── Reference data ───────────────────────────────────────────────────────────

const merchants = [
  { name: 'Amazon',            category: 'online_retail' },
  { name: 'Apple Store',       category: 'electronics' },
  { name: 'Shell Gas',         category: 'gas_station' },
  { name: 'Whole Foods',       category: 'grocery' },
  { name: 'Delta Airlines',    category: 'travel' },
  { name: 'Marriott Hotels',   category: 'travel' },
  { name: 'Best Buy',          category: 'electronics' },
  { name: 'Chipotle',          category: 'restaurant' },
  { name: 'eBay',              category: 'online_retail' },
  { name: 'Uber',              category: 'rideshare' },
  { name: 'Target',            category: 'retail' },
  { name: 'Walmart',           category: 'retail' },
  { name: 'Steam',             category: 'gaming' },
  { name: 'Shopify Merchant',  category: 'online_retail' },
  { name: 'Airbnb',            category: 'travel' },
]

const allAnomalies = [
  'unusual_location', 'high_amount', 'velocity_spike',
  'card_not_present', 'new_merchant', 'off_hours_transaction',
  'multiple_declines', 'rapid_cross_border',
]

// ── High-risk transactions (indices 0-24, will get fraud cases) ───────────────

const highRiskTemplates = [
  { merchant: 'Amazon',           category: 'online_retail',  country: 'NG', amount: 2840.00, riskScore: 97, anomalyReasons: ['unusual_location','card_not_present','velocity_spike'], cardPresent: false },
  { merchant: 'Apple Store',      category: 'electronics',    country: 'CN', amount: 1999.00, riskScore: 94, anomalyReasons: ['unusual_location','high_amount','rapid_cross_border'], cardPresent: false },
  { merchant: 'Best Buy',         category: 'electronics',    country: 'US', amount: 3420.50, riskScore: 91, anomalyReasons: ['high_amount','velocity_spike','multiple_declines'],   cardPresent: true },
  { merchant: 'eBay',             category: 'online_retail',  country: 'MX', amount: 760.00,  riskScore: 89, anomalyReasons: ['unusual_location','card_not_present','new_merchant'],  cardPresent: false },
  { merchant: 'Delta Airlines',   category: 'travel',         country: 'NG', amount: 4100.00, riskScore: 93, anomalyReasons: ['unusual_location','high_amount','rapid_cross_border'], cardPresent: false },
  { merchant: 'Shopify Merchant', category: 'online_retail',  country: 'CN', amount: 1450.00, riskScore: 88, anomalyReasons: ['card_not_present','new_merchant','velocity_spike'],    cardPresent: false },
  { merchant: 'Marriott Hotels',  category: 'travel',         country: 'DE', amount: 3200.00, riskScore: 85, anomalyReasons: ['unusual_location','high_amount'],                      cardPresent: false },
  { merchant: 'Amazon',           category: 'online_retail',  country: 'US', amount: 1820.00, riskScore: 83, anomalyReasons: ['velocity_spike','card_not_present'],                   cardPresent: false },
  { merchant: 'Shell Gas',        category: 'gas_station',    country: 'MX', amount: 980.00,  riskScore: 82, anomalyReasons: ['unusual_location','multiple_declines'],                cardPresent: true },
  { merchant: 'Uber',             category: 'rideshare',      country: 'NG', amount: 640.00,  riskScore: 87, anomalyReasons: ['unusual_location','off_hours_transaction'],            cardPresent: false },
  { merchant: 'Apple Store',      category: 'electronics',    country: 'US', amount: 5200.00, riskScore: 96, anomalyReasons: ['high_amount','velocity_spike','multiple_declines'],    cardPresent: true },
  { merchant: 'eBay',             category: 'online_retail',  country: 'UK', amount: 910.00,  riskScore: 78, anomalyReasons: ['card_not_present','new_merchant'],                    cardPresent: false },
  { merchant: 'Airbnb',           category: 'travel',         country: 'MX', amount: 2600.00, riskScore: 80, anomalyReasons: ['unusual_location','high_amount','rapid_cross_border'], cardPresent: false },
  { merchant: 'Best Buy',         category: 'electronics',    country: 'US', amount: 890.00,  riskScore: 76, anomalyReasons: ['velocity_spike','off_hours_transaction'],              cardPresent: false },
  { merchant: 'Shopify Merchant', category: 'online_retail',  country: 'CN', amount: 3100.00, riskScore: 92, anomalyReasons: ['unusual_location','high_amount','card_not_present'],  cardPresent: false },
  { merchant: 'Delta Airlines',   category: 'travel',         country: 'UK', amount: 1780.00, riskScore: 74, anomalyReasons: ['card_not_present','rapid_cross_border'],               cardPresent: false },
  { merchant: 'Walmart',          category: 'retail',         country: 'US', amount: 4500.00, riskScore: 90, anomalyReasons: ['high_amount','velocity_spike','multiple_declines'],    cardPresent: true },
  { merchant: 'Amazon',           category: 'online_retail',  country: 'DE', amount: 1240.00, riskScore: 77, anomalyReasons: ['unusual_location','card_not_present'],                cardPresent: false },
  { merchant: 'Airbnb',           category: 'travel',         country: 'NG', amount: 2200.00, riskScore: 95, anomalyReasons: ['unusual_location','high_amount','rapid_cross_border'], cardPresent: false },
  { merchant: 'Steam',            category: 'gaming',         country: 'US', amount: 1100.00, riskScore: 72, anomalyReasons: ['velocity_spike','card_not_present'],                   cardPresent: false },
  { merchant: 'Marriott Hotels',  category: 'travel',         country: 'CN', amount: 5800.00, riskScore: 98, anomalyReasons: ['unusual_location','high_amount','rapid_cross_border','multiple_declines'], cardPresent: false },
  { merchant: 'eBay',             category: 'online_retail',  country: 'US', amount: 670.00,  riskScore: 71, anomalyReasons: ['new_merchant','off_hours_transaction'],               cardPresent: false },
  { merchant: 'Shell Gas',        category: 'gas_station',    country: 'US', amount: 340.00,  riskScore: 73, anomalyReasons: ['multiple_declines','velocity_spike'],                 cardPresent: true },
  { merchant: 'Apple Store',      category: 'electronics',    country: 'CA', amount: 1600.00, riskScore: 75, anomalyReasons: ['high_amount','card_not_present'],                     cardPresent: false },
  { merchant: 'Amazon',           category: 'online_retail',  country: 'MX', amount: 920.00,  riskScore: 79, anomalyReasons: ['unusual_location','card_not_present','new_merchant'], cardPresent: false },
]

// ── Fraud case definitions (parallel to highRiskTemplates) ────────────────────

const fraudCaseDefs = [
  { summary: 'Multiple high-value electronics orders placed within 20 minutes from Nigerian IP, card-not-present. Prior account had no international activity.',               disposition: 'confirmed_fraud', notes: 'Confirmed account takeover. Customer reported card stolen 2 days prior. Charges reversed.', tags: ['account_takeover','international','velocity'] },
  { summary: 'iPhone purchase from Chinese IP on a card registered in Ohio. Shipping address was a freight-forwarding service frequently associated with fraud.',               disposition: 'confirmed_fraud', notes: 'Shipping address flagged in our internal blocklist. Chargeback filed. Customer confirmed did not make purchase.', tags: ['shipping_flag','international','high_value'] },
  { summary: 'Three large Best Buy transactions in 4 hours, two declined before approval. Card present but cardholder was traveling internationally per airline records.',      disposition: 'confirmed_fraud', notes: 'Card cloned at POS terminal. Merchant notified. Physical card compromised.', tags: ['card_clone','velocity','card_present'] },
  { summary: 'eBay purchase from Mexico on a new seller account created same day. Card-not-present, no prior activity with this merchant.',                                    disposition: 'confirmed_fraud', notes: 'Fraudulent seller account. eBay confirmed no goods shipped. Full refund issued.', tags: ['new_merchant','international','card_not_present'] },
  { summary: 'International flight booking from Nigerian IP, billed to US card. Departure within 48 hours, one-way ticket — common pattern in travel fraud.',                  disposition: 'confirmed_fraud', notes: 'One-way ticket to Lagos. Booking name did not match cardholder. Airline notified, booking cancelled.', tags: ['travel_fraud','international','high_value'] },
  { summary: 'Shopify order from Chinese IP, product category was gift cards. Card-not-present, new merchant relationship, three orders in rapid succession.',                 disposition: 'confirmed_fraud', notes: 'Gift card fraud pattern — resalable goods, no shipping required. Cards drained before dispute filed.', tags: ['gift_card','velocity','international'] },
  { summary: 'Hotel booking in Germany on a US card with no prior European activity. Booked day-of, premium room, card-not-present.',                                          disposition: 'under_investigation', notes: 'Customer not reachable. Contacted Marriott to flag booking. Awaiting customer callback.', tags: ['international','high_value','travel'] },
  { summary: 'Series of Amazon purchases over 72 hours totaling $4,200. Unusual for account with avg monthly spend under $200.',                                               disposition: 'confirmed_fraud', notes: 'Credential stuffing attack — password reused from unrelated breach. Account locked, customer notified.', tags: ['account_takeover','velocity','card_not_present'] },
  { summary: 'Gas station charge in Mexico 6 hours after US card was used in Chicago. Impossible travel window.',                                                              disposition: 'confirmed_fraud', notes: 'Physical card skimmed. Second card issued. Customer reimbursed.', tags: ['impossible_travel','card_clone','international'] },
  { summary: 'Uber charges totaling $640 in Lagos, Nigeria over 3 hours. Account holder confirmed they were home in Seattle.',                                                 disposition: 'confirmed_fraud', notes: 'Account credentials compromised. No Uber activity for this customer in prior 6 months. Refund issued.', tags: ['account_takeover','international','off_hours'] },
  { summary: 'Single Apple Store charge of $5,200 for MacBook Pro max configuration. Card present but three prior declines in same hour at different merchants.',               disposition: 'confirmed_fraud', notes: 'Card testing pattern before large purchase. Terminal compromise suspected at local merchant. Card cancelled.', tags: ['card_testing','velocity','high_value','card_present'] },
  { summary: 'eBay purchase for industrial equipment from UK seller, new merchant for cardholder, card-not-present.',                                                          disposition: 'cleared', notes: 'Confirmed legitimate — customer is a contractor who regularly sources equipment from UK suppliers. New merchant only.', tags: ['new_merchant','international'] },
  { summary: 'Airbnb booking in Cancun, $2,600, billed from Mexican IP. Cardholder has no prior Airbnb history and no Mexico travel on record.',                               disposition: 'confirmed_fraud', notes: 'Cardholder denied booking. Account email changed 1 hour before purchase — account takeover indicator. Refunded.', tags: ['account_takeover','international','travel'] },
  { summary: 'Best Buy online purchase at 3am, card-not-present, high-value item shipped to third-party address.',                                                             disposition: 'under_investigation', notes: 'Shipping address is a known reshipping mule address. Law enforcement referral pending. Item hold placed with merchant.', tags: ['reshipping','off_hours','card_not_present'] },
  { summary: '$3,100 order from Chinese IP for electronics, card-not-present. Same card had two failed charges in prior hour at different online retailers.',                   disposition: 'confirmed_fraud', notes: 'Classic card-testing followed by large purchase. International card-not-present confirmed fraud. Reversed.', tags: ['card_testing','international','velocity','high_value'] },
  { summary: 'Delta booking London to Lagos, card-not-present, booked from UK IP, billing address in Florida.',                                                               disposition: 'cleared', notes: 'Customer confirmed — dual-national frequently traveling this route. Verified with customer directly.', tags: ['international','travel'] },
  { merchant: 'Walmart', summary: 'Four Walmart transactions totaling $4,500 in 2 hours, card present, items consistent with quick-resale inventory (gift cards, electronics).', disposition: 'confirmed_fraud', notes: 'Organized retail crime pattern — multiple associates using cloned cards across stores. Law enforcement notified.', tags: ['organized_fraud','card_present','velocity','high_value'] },
  { summary: 'Amazon order from German IP, card-not-present, shipping to an address with 12 prior fraud reports in our system.',                                               disposition: 'confirmed_fraud', notes: 'Flagged address in fraud database. Order cancelled before shipment. Customer account secured.', tags: ['flagged_address','international','card_not_present'] },
  { summary: 'Airbnb booking in Lagos, Nigeria — $2,200 — from Nigerian IP. Card has never been used internationally.',                                                        disposition: 'confirmed_fraud', notes: 'First international use of card, high-risk country, customer confirmed fraud immediately on SMS alert. Reversed.', tags: ['first_international_use','high_risk_country','travel'] },
  { summary: 'Steam wallet loads totaling $1,100 over 6 hours, card-not-present. Unusual velocity for gaming category on this account.',                                       disposition: 'under_investigation', notes: 'Customer not yet contacted. Steam account activity being reviewed. Hold placed on additional charges.', tags: ['velocity','gaming','card_not_present'] },
  { summary: 'Marriott booking in Shanghai for 7 nights, $5,800, from Chinese IP. Card is a US consumer card with no Asian travel history.',                                   disposition: 'confirmed_fraud', notes: 'Cardholder in US during booking (verified via other same-day US transactions). Account compromised. Full reversal.', tags: ['impossible_travel','international','high_value','account_takeover'] },
  { summary: 'eBay late-night purchase from new seller, off-hours, small amount — possible card testing before larger fraud.',                                                  disposition: 'cleared', notes: 'Customer confirmed purchase — collectibles buyer who shops odd hours. Low amount, no follow-on fraud observed.', tags: ['off_hours','new_merchant'] },
  { summary: 'Multiple gas station decline attempts before successful charge. Card present, but card data may have been skimmed.',                                              disposition: 'under_investigation', notes: 'Skimmer suspected at this terminal. Coordinating with merchant. Two other affected cards reported same terminal.', tags: ['card_clone','velocity','card_present'] },
  { summary: 'Apple Store card-not-present purchase in Canada for $1,600. No prior Canada activity. Shipping to freight forwarder.',                                           disposition: 'confirmed_fraud', notes: 'Freight forwarder address on blocklist. Customer confirmed did not initiate. Charge reversed, card reissued.', tags: ['shipping_flag','international','card_not_present'] },
  { summary: 'Amazon order from Mexican IP, card-not-present, new merchant category (auto parts) unusual for cardholder profile.',                                             disposition: 'under_investigation', notes: 'Cannot reach cardholder. Order on hold with Amazon pending confirmation. 48-hour window before shipment.', tags: ['unusual_category','international','card_not_present'] },
]

async function main() {
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db(dbName)

    // Clear existing data
    await Promise.all([
      db.collection('transactions').deleteMany({}),
      db.collection('fraudCases').deleteMany({}),
      db.collection('analysts').deleteMany({}),
    ])

    // Insert analysts
    await db.collection('analysts').insertMany(analysts)
    console.log(`Inserted ${analysts.length} analysts`)

    // Build high-risk transactions
    const highRiskTxIds = highRiskTemplates.map(() => new ObjectId())
    const highRiskTxs = highRiskTemplates.map((t, i) => ({
      _id: highRiskTxIds[i],
      merchant: t.merchant,
      merchantCategory: t.category,
      cardPresent: t.cardPresent,
      country: t.country,
      amount: t.amount,
      timestamp: daysAgo(randInt(0, 30)),
      riskScore: t.riskScore,
      anomalyReasons: t.anomalyReasons,
      status: t.riskScore >= 85 ? 'under_review' : 'pending',
    }))

    // Build medium/low-risk transactions
    const otherTxs = Array.from({ length: 50 }, () => {
      const m = pick(merchants)
      const riskScore = randInt(5, 65)
      const numAnomalies = riskScore > 45 ? randInt(1, 2) : 0
      return {
        merchant: m.name,
        merchantCategory: m.category,
        cardPresent: Math.random() > 0.4,
        country: Math.random() > 0.15 ? 'US' : pick(['CA', 'UK', 'DE']),
        amount: randFloat(8, 400),
        timestamp: daysAgo(randInt(0, 60)),
        riskScore,
        anomalyReasons: numAnomalies > 0 ? allAnomalies.slice(0, numAnomalies) : [],
        status: riskScore > 45 ? 'pending' : 'cleared',
      }
    })

    await db.collection('transactions').insertMany([...highRiskTxs, ...otherTxs])
    console.log(`Inserted ${highRiskTxs.length + otherTxs.length} transactions`)

    // Build fraud cases
    const fraudCases = fraudCaseDefs.map((f, i) => {
      const tx = highRiskTxs[i]
      const searchableText = [
        f.summary,
        f.notes,
        f.tags.join(' '),
        tx.merchant,
        tx.merchantCategory,
        tx.country,
        tx.anomalyReasons.join(' '),
      ].join(' ')

      return {
        transactionId: tx._id,
        caseSummary: f.summary,
        analystNotes: f.notes,
        disposition: f.disposition,
        tags: f.tags,
        createdAt: daysAgo(randInt(0, 25)),
        searchableText,
      }
    })

    await db.collection('fraudCases').insertMany(fraudCases)
    console.log(`Inserted ${fraudCases.length} fraud cases`)

    console.log('\nSeed complete.')
  } finally {
    await client.close()
  }
}

main().catch(console.error)
