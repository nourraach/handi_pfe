import { env } from "../config/env";
import twilio from "twilio";

export class SmsService {
  private client = env.twilioSid && env.twilioToken ? twilio(env.twilioSid, env.twilioToken) : null;

  async envoyerCode(destinataire: string, code: string) {
    if (!this.client || !env.smsFrom) {
      // Pas de config, fallback console
      console.log(`[SMS-DEMO] to=${destinataire} code=${code}`);
      return { sid: "demo" };
    }
    return await this.client.messages.create({
      body: `Votre code HandiTalents : ${code}`,
      from: env.smsFrom,
      to: destinataire,
    });
  }
}
