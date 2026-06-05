export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Lobby: { matchId?: string; friendId?: string };
  SearchFriend: undefined;
  Friends: undefined;
  ChallengeSetup: { friendId?: string };
  ShapePlacement: { gameId: string };
  Game: { gameId: string };
  Result: { gameId: string; score?: number };
};
