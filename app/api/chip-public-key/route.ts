export async function GET() {
  try {
    const response = await fetch(
      "https://gate.chip-in.asia/api/v1/public_key/",
      {
        headers: {
          Authorization: `Bearer ${process.env.CHIP_SECRET_KEY}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.text();

    if (!response.ok) {
      return new Response("Unable to retrieve CHIP public key", {
        status: response.status,
      });
    }

    return new Response(data, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch {
    return new Response("Failed to retrieve CHIP public key", {
      status: 500,
    });
  }
}
