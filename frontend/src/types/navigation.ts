export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  SearchFriend: undefined;
  ChallengeSetup: { friendId?: string };
  ShapePlacement: { gameId: string };
  Game: { gameId: string };
  Result: { gameId: string; score: number };
};
