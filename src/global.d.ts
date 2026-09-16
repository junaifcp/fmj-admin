interface Window {
  clarity?: (...args: unknown[]) => void;
  Clerk?: {
    session?: {
      getToken: () => Promise<string>;
    };
  };
}
