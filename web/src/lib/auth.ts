import NextAuth, { DefaultSession, NextAuthOptions } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      anilistId?: number;
    } & DefaultSession["user"];
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    anilistId?: number;
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
    async jwt({ token, account, profile }) {
      // Save access token on first login
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        token.anilistId = (profile as { id: number }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.anilistId = token.anilistId;
      }
      session.accessToken = token.accessToken;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
