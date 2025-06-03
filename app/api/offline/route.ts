export async function POST(request: Request) {
  const { userId } = await request.json();
  // Update your database to set user offline
  return new Response("OK");
}
