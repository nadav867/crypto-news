export function parseEmbeddingResponse(response: any): number[] {
  if (Array.isArray(response)) {
    if (Array.isArray(response[0])) {
      return response[0] as number[];
    }
    if (typeof response[0] === "number") {
      return response as number[];
    }
    return response[0] as unknown as number[];
  }
  return response as unknown as number[];
}

