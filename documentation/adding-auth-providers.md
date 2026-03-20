# Adding the HTWG OIDC Provider

**Supabase Auth only supports a fixed set of built-in OAuth providers** (Google, GitHub, etc.). Custom OIDC providers like the HTWG IdP are not supported. To add one, you need a second auth handler running alongside Supabase — **NextAuth** was successfully used for this.

## How NextAuth was integrated

NextAuth was replacing supabase for the test since supabase does not support custom providers. Since the support or the HTWG provider
was rejected we had to undo these changes. For an integration of the HTWG IDP the usage of custom providers with supabase or to run a second auth handler in parallel has to be investigated. 

### Provider config

Two providers were configured. The `htwg-oidc-test` provider is the one that was actually tested and verified working — use it as your template.

**Auto-discovery (untested — may need to fall back to manual config):**
Config enpoint of the HTWG-RZ OIDC Live/Production Environment: https://idp.htwg-konstanz.de/idp/profile/oidc/configuration

```ts
{
  id: "htwg-oidc",
  name: "HTWG OIDC",
  type: "oauth",
  wellKnown: "https://idp.htwg-konstanz.de/idp/profile/oidc/configuration",
  clientId: process.env.HTWG_OIDC_CLIENT_ID,
  clientSecret: process.env.HTWG_OIDC_CLIENT_SECRET,
  authorization: { params: { scope: "openid email profile" } },
  idToken: true,
  checks: ["pkce", "state"],
  profile(profile) {
    return { id: profile.sub, name: profile.name, email: profile.email }
  },
}
```

**Manual endpoint config (tested and working):**
Config enpoint of the HTWG-RZ OIDC Test Environment: https://idp-test.htwg-konstanz.de/idp/profile/oidc/configuration

```ts
{
  id: "htwg-oidc-test",
  name: "HTWG OIDC Test",
  type: "oauth",
  clientId: process.env.HTWG_TEST_OIDC_CLIENT_ID,
  clientSecret: process.env.HTWG_TEST_OIDC_CLIENT_SECRET,
  authorization: {
    url: "https://idp-test.htwg-konstanz.de/idp/profile/oidc/authorize",
    params: {
      scope: "openid email profile",
      claims: {
        id_token: {
          email: { essential: true },
          preferred_username: { essential: true },
          given_name: { essential: false },
          family_name: { essential: false },
        },
      },
    },
  },
  issuer: "https://idp-test.htwg-konstanz.de",
  token: "https://idp-test.htwg-konstanz.de/idp/profile/oidc/token",
  jwks_endpoint: "https://idp-test.htwg-konstanz.de/idp/profile/oidc/keyset",
  userinfo: "https://idp-test.htwg-konstanz.de/idp/profile/oidc/userinfo",
  idToken: true,
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      given_name: profile.given_name,
      family_name: profile.family_name,
      preferred_username: profile.preferred_username,
    }
  },
}
```

### Key fields

| Field | When required |
|---|---|
| `wellKnown` | IdP supports auto-discovery |
| `authorization.url` + `token` + `userinfo` + `jwks_endpoint` | Manual config (no discovery URL) |
| `idToken: true` | Provider issues ID tokens (standard OIDC) |
| `checks: ["pkce", "state"]` | Recommended for security |
| `profile()` | Maps IdP claims → `{ id, name, email }` |

### Callbacks

The `signIn` callback enforced the email domain allowlist. The `jwt` callback looked up the app-level user by `oidc_sub` or email and stored `userId` / `consentPending` in the token. The `session` callback forwarded those to the client session.

New users were **not** created on sign-in — DB record creation was deferred to the consent step.

## Adding a new provider

1. Add the provider object to the `providers` array in the NextAuth route (see config above as template)
2. Add env vars for `clientId` / `clientSecret`
3. Update the email domain allowlist in the `signIn` callback:
   ```ts
   const allowedEmailDomains = ["htwg-konstanz.de"]
   ```
4. Add a sign-in button in [app/login/page.jsx](code-with-heart-app/app/login/page.jsx):
   ```jsx
   <Button onClick={() => signIn("your-provider-id", { callbackUrl: "/login" })}>
     Sign in with Your Provider
   </Button>
   ```