/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets the dev server (HMR websocket, Server Actions/RSC fetches) fully
  // trust requests coming from the phone over LAN — without this, the page
  // loads over http://<pc-lan-ip>:3000 but hot reload and anything doing
  // a cross-origin fetch back to the dev server gets silently blocked.
  // This IP can change (DHCP lease renewal, router reboot) — check with
  // `ipconfig` if the phone stops getting live updates.
  allowedDevOrigins: ["192.168.0.100"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
    ],
    // Image with src "/../../image.png" is using quality "100" which is not configured in images.qualities. This config will be required starting in Next.js 16
    qualities: [25, 50, 75, 100],
  },

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "shubukanindia.org",
          },
        ],
        destination: "https://www.shubukanindia.org/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
