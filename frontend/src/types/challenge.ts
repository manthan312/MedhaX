export interface IncomingChallenge {
  id: string;
  challenger: {
    id: string;
    username: string;
  };
  settings: {
    questions: number;
    language: string;
  };
  createdAt: string;
}
