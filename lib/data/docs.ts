export const documentationSections = [
    {
      id: 'getting-started',
      title: 'GETTING STARTED',
      content: [
        {
          subtitle: 'What is x402?',
          text: 'x402 is an open payment protocol that lets you monetize APIs with micropayments. Accept USDC payments for API access without building payment infrastructure. Your users pay per request, you get paid instantly.',
          code: null
        },
        {
          subtitle: 'Why use x402?',
          text: ' 0% platform fees - Keep 100% of your earnings (competitors charge 3-10%). No subscription management. No payment processor integration. No user accounts to manage. Just connect your API and start earning. Users pay only for what they use, with instant stablecoin settlements.',
          code: `Comparison:
  x402:          0% fee → You keep $100 from $100
  g402:          3% fee → You keep $97 from $100
  Others:     5-10% fee → You keep $90-95 from $100
  
  More transparent. More profitable. More fair.`
        },
        {
          subtitle: 'Quick start',
          text: '1) Connect your wallet \n 2) Register your API URL \n 3) Set your price (e.g., 0.05 USDC per call) \n 4) Get your gateway URL \n 5) Share it and start earning. That\'s it - no code changes needed.',
          code: null
        },
        {
          subtitle: 'Supported networks',
          text: 'Base (Recommended for low fees) \n • Celo \n • Solana \n • Ethereum \n • Optimism \n • Arbitrum \n • Polygon. We accept USDC on all networks. Users can pay from any supported chain using cross-chain swaps.',
          code: null
        }
      ]
    },
    {
      id: 'api-integration',
      title: 'MONETIZE YOUR API',
      content: [
        {
          subtitle: 'How to get started',
          text: 'Connect your wallet on the dashboard, click "Create API", enter your API URL and set your price. We generate a gateway URL for you. Share that URL with users - all payments are handled automatically.',
          code: `Example:
  Your API: https://api.yoursite.com/weather
  Your Price: 0.05 USDC per call
  
  We give you: https://gateway.x402.io/you/weather-api
  Share this URL with your users!`
        },
        {
          subtitle: 'How users pay',
          text: 'Users visit your gateway URL. For GET requests in a browser, they see a payment page. For API calls (POST/PUT/DELETE), they get a 402 response with payment instructions. After paying, they can access your API.',
          code: `// User makes request
  GET https://gateway.x402.io/you/weather-api/current
  
  // Without payment → User sees payment page
  // After payment → Request forwarded to your API
  // Your API response → Returned to user`
        },
        {
          subtitle: 'Your revenue - 100% yours!',
          text: 'You keep 100% of every payment. No platform fees. No hidden charges. We charge 0% compared to competitors who take 3-10%. Payments settle instantly in USDC directly to your wallet.',
          code: `You set: 0.05 USDC per call
  You earn: 0.05 USDC per call (100%) 
  Platform: 0.00 USDC per call (0%)
  
  No fees. No middleman. All yours!`
        },
        {
          subtitle: 'Cross-chain payments',
          text: 'Users can pay from any blockchain. If they have ETH on Optimism but your API accepts USDC on Base, we handle the swap automatically. You just get paid in USDC.',
          code: null
        }
      ]
    },
    {
      id: 'client-usage',
      title: 'USING PAID APIs',
      content: [
        {
          subtitle: 'Discover APIs',
          text: 'Browse the marketplace to find APIs. Filter by category, price, or functionality. Each API shows pricing, documentation, and a test interface. Try before you buy!',
          code: null
        },
        {
          subtitle: 'Pay and access',
          text: 'Connect your wallet (MetaMask, Coinbase Wallet, etc). When you access a paid API, you\'ll see the payment page showing the price. Click pay, approve in your wallet, and instantly access the API.',
          code: `Example:
  1. Visit: https://gateway.x402.io/bob/weather-api
  2. See: "0.05 USDC per call"
  3. Click: "Connect Wallet & Pay"
  4. Access granted!`
        },
        {
          subtitle: 'Pay from any chain',
          text: 'Have ETH on Ethereum but API wants USDC on Base? No problem. We automatically swap your tokens across chains. You pay in whatever you have, API gets what they want.',
          code: null
        },
        {
          subtitle: 'For developers (programmatic access)',
          text: 'Use x402 client libraries to integrate paid APIs into your app. Libraries handle payments automatically so your users never leave your application.',
          code: `import { x402Fetch } from "@x402/client";
  
  // Automatically handles payment
  const data = await x402Fetch(
    "https://gateway.x402.io/bob/weather-api/current",
    { wallet: userWallet }
  );`
        }
      ]
    },
    {
      id: 'platform-features',
      title: 'FEATURES & BENEFITS',
      content: [
        {
          subtitle: 'Dashboard & analytics',
          text: 'Track your revenue, API usage, and performance in real-time. See which endpoints are most popular, who your top users are, and how much you\'re earning. Export data for accounting.',
          code: null
        },
        {
          subtitle: 'Marketplace discovery',
          text: 'List your API in the x402 Bazaar where thousands of developers discover new APIs. Add descriptions, tags, and pricing to attract users. Test interfaces help users try before they buy.',
          code: null
        },
        {
          subtitle: 'Flexible pricing',
          text: 'Set different prices for different endpoints. Charge 0.01 USDC for simple queries, 0.50 USDC for complex operations. Update pricing anytime without code changes.',
          code: `Example pricing:
  GET /weather/current → 0.01 USDC
  GET /weather/forecast → 0.05 USDC  
  POST /weather/alerts → 0.10 USDC`
        },
        {
          subtitle: 'Multi-chain support',
          text: 'Accept payments on Base for low fees, or offer Ethereum for users who prefer it. We support 6+ blockchains. Users can pay from any chain via automatic cross-chain swaps.',
          code: null
        },
        {
          subtitle: 'No infrastructure needed',
          text: 'We handle payment processing, security, cross-chain swaps, and gateway infrastructure. You just focus on building great APIs. We handle everything else.',
          code: null
        }
      ]
    },
    {
      id: 'faq',
      title: 'FREQUENTLY ASKED QUESTIONS',
      content: [
        {
          subtitle: 'Do I need to modify my API code?',
          text: 'No! Your API stays exactly as it is. You just register your API URL with us, and we provide a gateway URL that handles payments. No code changes required.',
          code: null
        },
        {
          subtitle: 'What if a user refuses to pay?',
          text: 'They can\'t access your API without paying. The gateway blocks all unpaid requests. Your API only receives paid, verified requests.',
          code: null
        },
        {
          subtitle: 'How do I get paid?',
          text: 'Instantly! Every payment settles in USDC to your wallet immediately. No waiting for payouts, no minimum balance. You get paid as you earn.',
          code: null
        },
        {
          subtitle: 'What about API keys and rate limiting?',
          text: 'Payment becomes your authentication. Each paid request is rate-limited by cost. Spam attacks are too expensive to sustain. You can also add custom headers if needed.',
          code: null
        },
        {
          subtitle: 'Can I use this for free/public endpoints?',
          text: 'Yes! Set the price to 0.00 USDC for free endpoints. The gateway still works, providing analytics and discovery without charging users.',
          code: null
        },
        {
          subtitle: 'What about refunds?',
          text: 'All payments are final. Make sure to test your API thoroughly before listing. We provide a test interface for users to try endpoints before paying.',
          code: null
        }
      ]
    }
  ];