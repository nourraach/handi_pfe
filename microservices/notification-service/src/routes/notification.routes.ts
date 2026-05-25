import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const notificationController = new NotificationController();

router.use(authMiddleware);

router.get("/", notificationController.obtenirMesNotifications);
router.put("/marquer-lu", notificationController.marquerCommeLu);
router.put("/marquer-non-lu", notificationController.marquerCommeNonLu);
router.put("/marquer-tout-lu", notificationController.marquerToutCommeLu);
router.get("/non-lues/count", notificationController.compterNotificationsNonLues);

export default router;
