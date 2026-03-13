import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-c1f79e64/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all workers
app.get("/make-server-c1f79e64/workers", async (c) => {
  try {
    const workers = await kv.get("workers");
    if (!workers) {
      // Initialize default workers
      const defaultWorkers = [
        { id: "1", name: "Hellen", active: true },
        { id: "2", name: "Naomi", active: true },
        { id: "3", name: "Grace", active: true },
        { id: "4", name: "Julius", active: true },
        { id: "5", name: "Martin", active: true },
        { id: "6", name: "Ruth", active: true },
        { id: "7", name: "Rispah", active: true },
        { id: "8", name: "Linet", active: true, isOwner: true },
      ];
      await kv.set("workers", defaultWorkers);
      return c.json(defaultWorkers);
    }
    return c.json(workers);
  } catch (error) {
    console.log("Error fetching workers:", error);
    return c.json({ error: "Failed to fetch workers" }, 500);
  }
});

// Update workers (add, edit, delete workers)
app.put("/make-server-c1f79e64/workers", async (c) => {
  try {
    const workers = await c.req.json();
    await kv.set("workers", workers);
    return c.json({ success: true, workers });
  } catch (error) {
    console.log("Error updating workers:", error);
    return c.json({ error: "Failed to update workers" }, 500);
  }
});

// Add daily production record
app.post("/make-server-c1f79e64/production", async (c) => {
  try {
    const body = await c.req.json();
    const { workerId, workerName, date, frontal, closure, sewing } = body;
    
    const recordId = `production_${workerId}_${date}`;
    const record = {
      workerId,
      workerName,
      date,
      frontal: Number(frontal) || 0,
      closure: Number(closure) || 0,
      sewing: Number(sewing) || 0,
      total: (Number(frontal) || 0) + (Number(closure) || 0) + (Number(sewing) || 0),
      timestamp: new Date().toISOString(),
    };
    
    await kv.set(recordId, record);
    return c.json({ success: true, record });
  } catch (error) {
    console.log("Error adding production record:", error);
    return c.json({ error: "Failed to add production record" }, 500);
  }
});

// Get production records for a date range
app.get("/make-server-c1f79e64/production/:startDate/:endDate", async (c) => {
  try {
    const { startDate, endDate } = c.req.param();
    const allRecords = await kv.getByPrefix("production_");
    
    const filteredRecords = allRecords.filter((record: any) => {
      return record.date >= startDate && record.date <= endDate;
    });
    
    return c.json(filteredRecords);
  } catch (error) {
    console.log("Error fetching production records:", error);
    return c.json({ error: "Failed to fetch production records" }, 500);
  }
});

// Add payment record
app.post("/make-server-c1f79e64/payment", async (c) => {
  try {
    const body = await c.req.json();
    const { workerId, workerName, weekStartDate, weekEndDate, totalWigs, amount, details } = body;
    
    const paymentId = `payment_${Date.now()}_${workerId}`;
    const payment = {
      id: paymentId,
      workerId,
      workerName,
      weekStartDate,
      weekEndDate,
      totalWigs,
      amount: Number(amount),
      details,
      paidDate: new Date().toISOString(),
    };
    
    await kv.set(paymentId, payment);
    return c.json({ success: true, payment });
  } catch (error) {
    console.log("Error recording payment:", error);
    return c.json({ error: "Failed to record payment" }, 500);
  }
});

// Get payments for a specific week
app.get("/make-server-c1f79e64/payments/:startDate/:endDate", async (c) => {
  try {
    const { startDate, endDate } = c.req.param();
    const allPayments = await kv.getByPrefix("payment_");
    
    const filteredPayments = allPayments.filter((payment: any) => {
      const paymentStart = payment.weekStartDate ? payment.weekStartDate.split('T')[0] : '';
      const paymentEnd = payment.weekEndDate ? payment.weekEndDate.split('T')[0] : '';
      return paymentStart === startDate && paymentEnd === endDate;
    });
    
    return c.json(filteredPayments);
  } catch (error) {
    console.error("Error fetching weekly payments:", error);
    return c.json({ error: "Failed to fetch weekly payments" }, 500);
  }
});

// Get all payment history
app.get("/make-server-c1f79e64/payments", async (c) => {
  try {
    const payments = await kv.getByPrefix("payment_");
    // Sort by date descending
    payments.sort((a: any, b: any) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());
    return c.json(payments);
  } catch (error) {
    console.log("Error fetching payment history:", error);
    return c.json({ error: "Failed to fetch payment history" }, 500);
  }
});

// Delete a payment record
app.delete("/make-server-c1f79e64/payment/:paymentId", async (c) => {
  try {
    const { paymentId } = c.req.param();
    await kv.del(paymentId);
    return c.json({ success: true, message: "Payment deleted" });
  } catch (error) {
    console.log("Error deleting payment:", error);
    return c.json({ error: "Failed to delete payment" }, 500);
  }
});

// Get worker history (production + payments)
app.get("/make-server-c1f79e64/worker/:workerId/history", async (c) => {
  try {
    const { workerId } = c.req.param();
    
    const allProduction = await kv.getByPrefix(`production_${workerId}_`);
    const allPayments = await kv.getByPrefix("payment_");
    const workerPayments = allPayments.filter((p: any) => p.workerId === workerId);
    
    return c.json({
      production: allProduction,
      payments: workerPayments,
    });
  } catch (error) {
    console.log("Error fetching worker history:", error);
    return c.json({ error: "Failed to fetch worker history" }, 500);
  }
});

Deno.serve(app.fetch);