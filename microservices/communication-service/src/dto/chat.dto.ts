export interface CreerConversationDto {
  participants: string[]; // liste d'id_utilisateur (inclure l'émetteur si voulu)
  message_initial?: string;
}

export interface EnvoyerMessageDto {
  contenu: string;
}
