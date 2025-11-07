import { Injectable } from "@nestjs/common";

@Injectable()
export class ModerationService {
  private readonly offensiveWords = [
    // Add common offensive words here if needed
    // Keeping it minimal for now - can be expanded
  ];

  async isOffensive(text: string): Promise<boolean> {
    try {
      const textLower = text.toLowerCase();

      // Check against offensive words list
      for (const word of this.offensiveWords) {
        if (textLower.includes(word.toLowerCase())) {
          return true;
        }
      }

      // Simple heuristic: check for excessive caps (potential spam)
      const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
      if (capsRatio > 0.5 && text.length > 20) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("Moderation error:", error);
      // Fail open - allow the request if moderation fails
      return false;
    }
  }
}
