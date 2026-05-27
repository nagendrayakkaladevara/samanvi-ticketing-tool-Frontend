export const applicationAccessRoutes = {
  list: '/application-access',
  create: '/application-access/create',
  view: (userId: string) => `/application-access/${userId}`,
  edit: (userId: string) => `/application-access/${userId}/edit`,
} as const
