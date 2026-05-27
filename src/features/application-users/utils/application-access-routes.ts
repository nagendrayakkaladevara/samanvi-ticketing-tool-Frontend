export const applicationAccessRoutes = {
  list: '/application-access',
  create: '/application-access/create',
  edit: (userId: string) => `/application-access/${userId}/edit`,
} as const
