export const appRoutes = {
  home: '/',
  /** Görsel mekan listesi */
  venues: '/mekanlar',
  login: '/login',
  register: '/register',
  venue: (id) => `/venues/${id}`,
  venueDetail: '/venues/:id',
  profile: '/profile',
  friends: '/friends',
  friendProfile: '/friends/profile/:id',
  admin: '/admin',
};
