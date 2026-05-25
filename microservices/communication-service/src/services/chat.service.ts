import { ChatRepository } from "../repositories/chat.repository";
import { CreerConversationDto, EnvoyerMessageDto } from "../dto/chat.dto";
import { ErreurApi } from "../utils/erreur-api";

export class ChatService {
  constructor(private readonly repo = new ChatRepository()) {}

  async creerConversation(emetteurId: string, emetteurRole: string, dto: CreerConversationDto) {
    const participantSet = new Set<string>(dto.participants);
    participantSet.add(emetteurId);
    const conv = await this.repo.creerConversation([...participantSet]);
    // ajouter les rôles pour tous : ici, on ne stocke pas le rôle dans la table (ou vide),
    // mais on pourrait l'étendre; pour le MVP on s'en passe.
    if (dto.message_initial) {
      await this.repo.ajouterMessage(conv.id, emetteurId, emetteurRole, dto.message_initial);
    }
    return conv;
  }

  async listerConversations(utilisateurId: string) {
    return this.repo.listerConversationsPourUtilisateur(utilisateurId);
  }

  async rechercherDestinataires(
    utilisateurId: string,
    recherche?: string,
    roleFilter?: "admin" | "entreprise",
  ) {
    return this.repo.rechercherDestinataires(utilisateurId, recherche, roleFilter);
  }

  async listerMessages(conversationId: string, utilisateurId: string) {
    const autorise = await this.repo.utilisateurDansConversation(conversationId, utilisateurId);
    if (!autorise) throw new ErreurApi("Accès non autorisé à cette conversation", 403);
    return this.repo.listerMessages(conversationId, 200, 0);
  }

  async listerMessagesDepuis(conversationId: string, since: Date) {
    return this.repo.listerMessagesDepuis(conversationId, since);
  }

  async utilisateurDansConversation(conversationId: string, utilisateurId: string) {
    return this.repo.utilisateurDansConversation(conversationId, utilisateurId);
  }

  async envoyerMessage(conversationId: string, utilisateurId: string, role: string, dto: EnvoyerMessageDto) {
    const autorise = await this.repo.utilisateurDansConversation(conversationId, utilisateurId);
    if (!autorise) throw new ErreurApi("Accès non autorisé à cette conversation", 403);
    if (!dto.contenu || dto.contenu.trim().length === 0) {
      throw new ErreurApi("Message vide", 400);
    }
    return this.repo.ajouterMessage(conversationId, utilisateurId, role, dto.contenu.trim());
  }
}
