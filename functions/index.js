import express from "express";
import fetch from "node-fetch";
import admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(express.json());

// 🔹 Создание платежа
app.post("/createPayment", async (req, res) => {
  try {
    const { uid } = req.body;
    const idempotenceKey = Math.random().toString(36).substring(2);
    const paymentData = {
      amount: { value: "1.00", currency: "RUB" },
      confirmation: {
        type: "redirect",
        return_url: "https://yliaalei.github.io/plan-3-1309/"
      },
      capture: true,
      description: `Оплата подписки пользователем ${uid}`
    };

    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        "Authorization": "Basic " + Buffer.from(
          `${process.env.YOOKASSA_SHOPID}:${process.env.YOOKASSA_SECRET}`
        ).toString("base64")
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

// 🔹 Вебхук от ЮKassa
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

export const api = app;
