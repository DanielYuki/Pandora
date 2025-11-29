export interface AgentRequest {
  id: string;
  input: string;
}

export interface AgentResponse {
  success: boolean;
  answer?: string;
  errorMessage?: string;
}

export interface IAIAgent {
  infer(request: AgentRequest): Promise<AgentResponse>;
}
