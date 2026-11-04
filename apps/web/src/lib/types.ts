/** The `user` object from the API (architecture §4). Shared by server and client code; types only. */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
