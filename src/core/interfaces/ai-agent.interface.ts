export interface AgentRequest {
  userId: string;
  userEmail: string;
  userName: string;
  userInput: string;
}

export interface AgentResponse {
  success: boolean;
  answer?: string;
  errorMessage?: string;
}

export interface IAIAgent {
  infer(request: AgentRequest): Promise<AgentResponse>;
}
