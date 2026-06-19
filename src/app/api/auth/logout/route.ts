import { jsonSuccess } from '@/lib/api-response';

export async function POST() {
  // Client handles token removal from localStorage
  // This endpoint exists for API consistency and future server-side session management
  return jsonSuccess({ loggedOut: true });
}