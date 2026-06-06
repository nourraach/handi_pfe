import { ChatRepository } from "../repositories/chat.repository";
import { CreerConversationDto, EnvoyerMessageDto } from "../dto/chat.dto";
import { canInitiateContact } from "./contact-authorization.service";
import { UserSearchService } from "./user-search.service";
import { logAuthorizationAttempt } from "./audit-logger.service";
import { ErreurApi } from "../utils/erreur-api";

export class ChatService {
  constructor(
    private readonly repo = new ChatRepository(),
    private readonly userSearchService = new UserSearchService()
  ) {}

  async creerConversation(emetteurId: string, emetteurRole: string, dto: CreerConversationDto, requestContext?: {
    requestId?: string;
    httpMethod?: string;
    httpPath?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Get recipient roles to check authorization
    const recipientIds = dto.participants.filter(id => id !== emetteurId);
    
    // Fetch recipient roles from database
    const recipients = await this.repo.obtenirRolesUtilisateurs(recipientIds);
    
    // Check authorization for each recipient
    for (const recipient of recipients) {
      const authResult = canInitiateContact(emetteurId, emetteurRole, recipient.id, recipient.role);
      
      // Log authorization attempt
      await logAuthorizationAttempt({
        requestId: requestContext?.requestId,
        userId: emetteurId,
        userRole: emetteurRole,
        serviceName: "communication-service",
        actionType: "CONTACT_INITIATION",
        resourceType: "MESSAGE",
        resourceId: recipient.id,
        authorizationResult: authResult.allowed ? "ALLOWED" : "DENIED",
        denialReason: authResult.reason,
        httpMethod: requestContext?.httpMethod,
        httpPath: requestContext?.httpPath,
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
        additionalContext: {
          recipientId: recipient.id,
          recipientRole: recipient.role,
        },
      });
      
      // If authorization failed, throw error
      if (!authResult.allowed) {
        throw new ErreurApi(authResult.reason || "Contact non autorisé", 403);
      }
    }
    
    // All authorizations passed - create conversation
    const participantSet = new Set<string>(dto.participants);
    participantSet.add(emetteurId);
    const conv = await this.repo.creerConversation([...participantSet]);
    
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
    userRole: string,
    recherche?: string,
    roleFilter?: "admin" | "entreprise",
  ) {
    // Use UserSearchService which filters enterprises for enterprise users
    return this.userSearchService.rechercherDestinataires(utilisateurId, userRole, recherche, roleFilter);
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
