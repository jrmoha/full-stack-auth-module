/** The only user fields any response contains (architecture §4). */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
