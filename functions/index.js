// api.js
import express from "express";
import fetch from "node-fetch";
import admin from "firebase-admin";
import bodyParser from "body-parser";

// Инициализация Firebase Admin SDK (нужен service account)
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const app = express();
app.use(bodyParser.json());

// Конфигурация YooKassa в env
const YOOKASSA_SHOPID = process.env.YOOKASSA_SHOPID;
const YOOKASSA_SECRET = process.env.YOOKASSA_SECRET;
const BASE_RETURN_URL = process.env.RETURN_URL || "https://yliaalei.github.io/plan-3-1309/"; // вернуться после оплаты

if(!YOOKASSA_SHOPID || !YOOKASSA_SECRET) {
  console.warn("YOOKASSA env vars not set");
}

// POST /createPayment
app.post("/createPayment", async (req, res) => {
  try {
    const { uid } = req.body;
    if(!uid) return res.status(400).json({ error: "uid required" });

    const idempotenceKey = Math.random().toString(36).substring(2);
    const payload = {
      amount: { value: "450.00", currency: "RUB" },
      confirmation: {
        type: "redirect",
        return_url: BASE_RETURN_URL
      },
      capture: true,
      description: `Оплата подписки ${uid}`
    };

    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        "Authorization": "Basic " + Buffer.from(`${YOOKASSA_SHOPID}:${YOOKASSA_SECRET}`).toString("base64")
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка при создании платежа" });
  }
});

// Вебхук YooKassa
app.post("/yookassa/webhook", async (req, res) => {
  try {
    const event = req.body;
    // Стандартная структура: event.event = "payment.succeeded"
    if(event && event.event === "payment.succeeded"){
      const desc = event.object && event.object.description ? event.object.description : "";
      // мы положили uid в описание: "Оплата подписки {uid}"
      const parts = desc.split(" ");
      const uid = parts[parts.length - 1];

      if(uid){
        await db.collection("users").doc(uid).set({
          paid: true,
          paidAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // можно отправить email/уведомление сюда
      }
    }
    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log("API listening on", PORT));
