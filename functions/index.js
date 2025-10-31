const functions = require("firebase-functions");
const express = require("express");
const fetch = require("node-fetch");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(express.json());

// 🔹 Твои маршруты API

// Создание платежа
app.post("/createPayment", async (req, res) => {
  try {
    const { uid } = req.body;
    const idempotenceKey = Math.random().toString(36).substring(2);

    const paymentData = {
      amount: { value: "450.00", currency: "RUB" },
      confirmation: {
        type: "redirect",
        return_url: "https://yliaalei.github.io/plan-3-1309/"
      },
      capture: true,
      description: `Оплата подписки пользователем ${uid}`
    };

    const SHOPID = functions.config().yookassa.shopid;
    const SECRET = functions.config().yookassa.secret;

    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        "Authorization": "Basic " + Buffer.from(`${SHOPID}:${SECRET}`).toString("base64")
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка при создании платежа" });
  }
});

// Вебхук ЮKassa
app.post("/yookassa/webhook", async (req, res) => {
  const event = req.body;
  if (event.event === "payment.succeeded") {
    const uid = event.object.description.split(" ")[2];
    await db.collection("payments").doc(uid).set({
      paid: true,
      time: Date.now()
    });
  }
  res.sendStatus(200);
});

// 🔹 Экспорт функции для Firebase
exports.api = functions.https.onRequest(app);
