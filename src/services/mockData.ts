export const mockNFTResponse = {
  success: true,
  data: {
    owner: "محمد أحمد",
    visible_nfts: 24,
    prices: {
      floor_price: { TON: 64.7, USD: 199.9, STAR: 13326 },
      avg_price: { TON: 69.1, USD: 213.5, STAR: 14233 }
    },
    nfts: [
      {
        count: 1,
        name: "Moon Pendant",
        model: "Eclipse🖤",
        floor_price: 15.07,
        avg_price: 15.07,
        details: {
          links: ["https://t.me/addstickers/MoonPendant"]
        }
      },
      {
        count: 2,
        name: "Stellar Rocket",
        model: "Flower Power",
        floor_price: 2.0,
        avg_price: 3.0,
        details: {
          links: ["https://t.me/addstickers/StellarRocket"]
        }
      },
      {
        count: 1,
        name: "Galaxy Star",
        model: "Cosmic Dream",
        floor_price: 8.5,
        avg_price: 9.2,
        details: {
          links: ["https://t.me/addstickers/GalaxyStar"]
        }
      }
    ]
  },
  stats: {
    items: 3,
    total_gifts: 4,
    enriched: 3
  }
};

export const mockErrorResponses = {
  userNotFound: {
    success: false,
    message: "User not found"
  },
  noGifts: {
    success: false,
    message: "User has no open NFT gifts"
  },
  rateLimit: {
    success: false,
    message: "Please wait 30 seconds"
  },
  floodWait: {
    success: false,
    message: "Flood wait: Too many requests. Please try again later."
  },
  serverError: {
    success: false,
    message: "Internal server error"
  }
};