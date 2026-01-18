import NextAuth, { DefaultSession, NextAuthOptions } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "anilist",
      name: "AniList",
      type: "oauth",
      authorization: {
        url: "https://anilist.co/api/v2/oauth/authorize",
        params: { scope: "", response_type: "code" },
      },
      token: {
        url: "https://anilist.co/api/v2/oauth/token",
      },
      userinfo: {
        url: "https://graphql.anilist.co",
        async request({ tokens }) {
          // Fetch user info directly from AniList GraphQL API
          const response = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens.access_token}`,
            },
            body: JSON.stringify({
              query: `
                query {
                  Viewer {
                    id
                    name
                    avatar {
                      large
                    }
                  }
                }
              `,
            }),
          });

          const data = await response.json();
          return data.data.Viewer;
        },
      },
      clientId: process.env.ANILIST_CLIENTID,
      clientSecret: process.env.ANILIST_CLIENT_SECRET,
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name,
          image: profile.avatar?.large,
        };
      },
    },
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.sub = String((profile as { id: number }).id);
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
