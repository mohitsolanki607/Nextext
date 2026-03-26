import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Lazy initialize Razorpay
  let razorpay: Razorpay | null = null;
  const getRazorpay = () => {
    if (!razorpay) {
      const keyId = process.env.RAZORPAY_KEY_ID?.trim();
      const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
      
      if (!keyId || !keySecret) {
        const availableKeys = Object.keys(process.env).filter(k => k.includes("RAZORPAY"));
        console.error("Razorpay Keys Missing. Available RAZORPAY env vars:", availableKeys);
        throw new Error("Razorpay API keys are missing. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Settings.");
      }

      console.log(`Razorpay Initialization:`);
      console.log(`- Key ID: ${keyId.substring(0, 8)}... (Length: ${keyId.length})`);
      console.log(`- Key Secret: ${keySecret.substring(0, 4)}... (Length: ${keySecret.length})`);
      console.log(`- Mode: ${keyId.startsWith("rzp_live") ? "LIVE" : "TEST"}`);
      
      razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
    return razorpay;
  };

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Create Razorpay Order
  app.post("/api/razorpay/order", async (req, res) => {
    try {
      const r = getRazorpay();
      const { amount, currency = "INR", receipt } = req.body;
      
      const options = {
        amount: amount * 100, // amount in the smallest currency unit (paise for INR)
        currency,
        receipt,
      };
      const order = await r.orders.create(options);
      res.json(order);
    } catch (error: any) {
      console.error("Razorpay Order Error Details:", JSON.stringify(error, null, 2));
      res.status(500).json({ error: error.description || error.message || "Failed to create order" });
    }
  });

  // Verify Razorpay Payment
  app.post("/api/razorpay/verify", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const secret = process.env.RAZORPAY_KEY_SECRET;

      if (!secret) {
        throw new Error("Razorpay secret not configured");
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature === razorpay_signature) {
        // Payment is verified
        res.json({ status: "success", message: "Payment verified" });
      } else {
        res.status(400).json({ status: "failure", message: "Invalid signature" });
      }
    } catch (error: any) {
      console.error("Razorpay Verification Error:", error);
      res.status(500).json({ error: error.message || "Verification failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
