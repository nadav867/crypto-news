import { Injectable } from "@nestjs/common";

@Injectable()
export class ModerationService {
  private readonly offensiveWords = [
  ];

  async isOffensive(text: string): Promise<boolean> {
    try {
      const textLower = text.toLowerCase();

      for (const word of this.offensiveWords) {
        if (textLower.includes(word.toLowerCase())) {
          return true;
        }
      }

      const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
      if (capsRatio > 0.5 && text.length > 20) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("Moderation error:", error);
      return false;
    }
  }
}
