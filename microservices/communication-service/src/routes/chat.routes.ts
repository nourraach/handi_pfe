import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { ChatController } from "../controllers/chat.controller";

const router = Router();
const controller = new ChatController();

router.use(authMiddleware);

router.post("/conversations", controller.creerConversation);
router.get("/conversations", controller.listerConversations);
router.get("/destinataires", controller.rechercherDestinataires);
router.get("/conversations/:id/messages", controller.listerMessages);
router.post("/conversations/:id/messages", controller.envoyerMessage);
// SSE stream
router.get("/conversations/:id/stream", controller.streamConversation);

export default router;
