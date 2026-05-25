import { Request, Response } from "express";
import { ChatService } from "../services/chat.service";
import { reponseErreur, reponseSucces } from "../utils/reponse";
import { verifierJwt } from "../utils/securite";

export class ChatController {
  constructor(private readonly chatService = new ChatService()) {}

  creerConversation = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur) return reponseErreur(res, 401, "Authentification requise");
      const conv = await this.chatService.creerConversation(req.utilisateur.id_utilisateur, req.utilisateur.role, req.body);
      return reponseSucces(res, 201, "Conversation créée", conv);
    } catch (error: any) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  listerConversations = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur) return reponseErreur(res, 401, "Authentification requise");
      const convs = await this.chatService.listerConversations(req.utilisateur.id_utilisateur);
      return reponseSucces(res, 200, "Conversations récupérées", convs);
    } catch (error: any) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  rechercherDestinataires = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur) return reponseErreur(res, 401, "Authentification requise");
      const q = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
      const role = Array.isArray(req.query.role) ? req.query.role[0] : req.query.role;
      const roleFilter = role === "admin" || role === "entreprise" ? role : undefined;
      const destinataires = await this.chatService.rechercherDestinataires(
        req.utilisateur.id_utilisateur,
        q ? String(q) : undefined,
        roleFilter,
      );
      return reponseSucces(res, 200, "Destinataires recuperes", destinataires);
    } catch (error: any) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  listerMessages = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur) return reponseErreur(res, 401, "Authentification requise");
      const convId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const msgs = await this.chatService.listerMessages(convId, req.utilisateur.id_utilisateur);
      return reponseSucces(res, 200, "Messages récupérés", msgs);
    } catch (error: any) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  envoyerMessage = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur) return reponseErreur(res, 401, "Authentification requise");
      const convId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const msg = await this.chatService.envoyerMessage(convId, req.utilisateur.id_utilisateur, req.utilisateur.role, req.body);
      return reponseSucces(res, 201, "Message envoyé", msg);
    } catch (error: any) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // SSE pour recevoir les messages en temps quasi réel
  streamConversation = async (req: Request, res: Response) => {
    try {
      // Auth via query token pour EventSource
      const token = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;
      if (!token) return res.status(401).end();
      const payload = verifierJwt(String(token));
      const convId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const autorise = await this.chatService.utilisateurDansConversation(convId, payload.id_utilisateur);
      if (!autorise) return res.status(403).end();

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      let since = new Date(0);

      const tick = async () => {
        const msgs = await this.chatService.listerMessagesDepuis(convId, since);
        if (msgs.length > 0) {
          since = new Date(msgs[msgs.length - 1].created_at);
          res.write(`data: ${JSON.stringify(msgs)}\n\n`);
        }
      };

      const interval = setInterval(() => tick().catch(() => {}), 2000);
      req.on("close", () => clearInterval(interval));
      // premier envoi
      await tick();
    } catch (error: any) {
      res.status(500).end();
    }
  };
}
