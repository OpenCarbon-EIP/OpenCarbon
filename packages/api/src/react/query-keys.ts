// Fabrique centralisée de clés React Query — évite les chaînes magiques dispersées.
export const queryKeys = {
  me: () => ['auth', 'me'] as const,
  offers: {
    list: () => ['offers', 'list'] as const,
    detail: (id: string) => ['offers', 'detail', id] as const,
  },
} as const;
