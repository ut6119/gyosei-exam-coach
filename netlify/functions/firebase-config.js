exports.handler = async function handler() {
  const apiKey = String(process.env.FIREBASE_API_KEY || "").trim();
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      },
      body: JSON.stringify({
        error: "FIREBASE_API_KEY is not configured"
      })
    };
  }

  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    },
    body: JSON.stringify({
      apiKey,
      appId: "1:351411116532:web:b964a920add3e32f9841a1",
      authDomain: "receipt-app-35ec3.firebaseapp.com",
      projectId: "receipt-app-35ec3",
      storageBucket: "receipt-app-35ec3.firebasestorage.app",
      messagingSenderId: "351411116532",
      measurementId: "G-VY4BG6ZWPB"
    })
  };
};
