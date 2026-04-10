import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Email Notification Route
  app.post("/api/notify", (req, res) => {
    const { email, type, taskTitle, objective } = req.body;
    const recipient = email || "Clifford.Siisi.Addison@gmail.com";
    
    console.log("--------------------------------------------------");
    console.log(`[EMAIL NOTIFICATION SYSTEM]`);
    console.log(`RECIPIENT: ${recipient}`);
    console.log(`TYPE: ${type.toUpperCase()}`);
    console.log(`TASK: ${taskTitle}`);
    if (objective) console.log(`OBJECTIVE: ${objective}`);
    console.log(`TIMESTAMP: ${new Date().toISOString()}`);
    console.log("--------------------------------------------------");
    
    // In a real app, you would use a service like Resend or SendGrid here:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({ ... });

    res.json({ 
      success: true, 
      message: `Notification logged for ${recipient}`,
      details: "This is a mock notification. To enable real emails, configure RESEND_API_KEY in the server settings."
    });
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
