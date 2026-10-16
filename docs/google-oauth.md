# Google sign-in setup

Email/password works without this. Google sign-in turns on automatically once both
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set (the button is hidden otherwise).

## 1. Create a Google Cloud project

1. Go to <https://console.cloud.google.com/> and create a project (e.g. `applytrack`).

## 2. Configure the consent screen

1. **APIs & Services → OAuth consent screen** (may be labelled **Google Auth Platform → Branding**).
2. User type: **External**.
3. App name `Applytrack`, your email as support and developer contact.
4. Scopes: the defaults (`openid`, `email`, `profile`) are enough — Better Auth asks for nothing else.
5. While the app is in **Testing** mode, only accounts listed under **Test users** can sign in. Add your own Google account there.

## 3. Create the OAuth client

1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Web application**.
3. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://<your-app>.vercel.app` (add once deployed)
4. **Authorized redirect URIs** — must match exactly:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-app>.vercel.app/api/auth/callback/google` (add once deployed)
5. Create, then copy the **Client ID** and **Client secret**.

## 4. Add the credentials

Local — in `.env.local`:

```
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
```

Restart `npm run dev`. The **Continue with Google** button appears on `/login`.

Production — add the same two variables in Vercel (see [deploy.md](deploy.md)).

## Troubleshooting

| Error                                | Cause                                                                                                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `redirect_uri_mismatch`              | The redirect URI in Google Cloud doesn't exactly match `<BETTER_AUTH_URL>/api/auth/callback/google` (check `http` vs `https`, trailing slash, port) |
| `access_denied` / "app not verified" | Your Google account isn't in **Test users** while the app is in Testing mode                                                                        |
| Button doesn't appear                | Only one of the two variables is set, or the dev server wasn't restarted                                                                            |

Preview deployments (`*-git-*.vercel.app`) get a different URL per branch, which Google won't accept without adding each one. Test Google sign-in on localhost and production; use email/password on previews.
