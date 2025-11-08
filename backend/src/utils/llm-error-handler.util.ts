export function handleLlmError(error: any): string {
  const errorMessage =
    error?.message || error?.response?.data?.error || String(error);
  const statusCode = error?.response?.status || error?.status;

  if (statusCode === 503 || errorMessage?.includes("loading")) {
    return "The AI model is currently loading. Please wait a moment and try again.";
  } else if (statusCode === 429 || errorMessage?.includes("rate limit")) {
    return "Rate limit exceeded. Please wait a moment and try again.";
  } else if (statusCode === 400 && errorMessage?.includes("paused")) {
    return "The AI model is currently paused. Please try again later or contact support.";
  } else if (
    statusCode === 410 ||
    errorMessage?.includes("no longer supported")
  ) {
    return "The API endpoint has changed. Please contact support.";
  } else if (
    errorMessage?.includes("No Inference Provider") ||
    errorMessage?.includes("inference provider")
  ) {
    return "The selected AI model is not available. Please try a different model or contact support.";
  } else if (
    errorMessage?.includes("not supported by any provider") ||
    error?.httpResponse?.body?.error?.code === "model_not_supported"
  ) {
    return "The selected AI model is not supported by your enabled providers. Please enable providers in your Hugging Face account settings or try a different model.";
  } else {
    return "I apologize, but I encountered an error while generating the answer. Please try again.";
  }
}

export function logLlmError(error: any): void {
  console.error("LLM error:", error);
  console.error("LLM error details:", {
    message: error?.message,
    status: error?.status,
    responseStatus: error?.response?.status,
    responseData: error?.response?.data,
    httpRequest: error?.httpRequest,
    httpResponse: error?.httpResponse,
    errorBody: error?.httpResponse?.body,
  });
}

