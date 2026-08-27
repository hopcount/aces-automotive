# Deploying to your Azure Static Web App

This repo is ready to deploy: static pages at the root, and an Azure
Function at `api/` that replaces the old PHP contact-form handler with
Azure Communication Services (ACS) Email.

## 1. Push this repo to GitHub

If you don't already have a GitHub repo for this:

```
# on github.com: create a new EMPTY repo (no README/license), e.g. aces-automotive
cd /path/to/aces
git remote add origin https://github.com/<you>/<repo-name>.git
git push -u origin master
```

(The repo is already git-initialised and committed locally — see the
commit "Rebuild Aces Automotive site...".)

## 2. Connect the repo to your existing Static Web App

In the Azure Portal, open your Static Web App resource:

- Go to **Deployment → Deployment settings** (or **Manage deployment token**
  on older portal layouts).
- If it isn't already linked to a GitHub repo: choose **Source: GitHub**,
  authorize Azure, and pick the repo/branch you just pushed. Azure will:
  - Commit a `.github/workflows/azure-static-web-apps-<name>.yml` file into
    your repo for you
  - Add the `AZURE_STATIC_WEB_APPS_API_TOKEN_<NAME>` secret automatically
  - Trigger the first build/deploy

- When the workflow wizard asks for build details, use:
  - **App location**: `/`
  - **Api location**: `api`
  - **Output location**: *(leave blank — it's plain static HTML, no build step)*

If your Static Web App was already linked to a *different* repo, you can
either push this code into that existing repo instead, or create a new
Static Web App pointed at this new repo (Static Web Apps are free/cheap
enough that most people just spin up a fresh one per project).

Every push to the connected branch will redeploy automatically from then on.

## 3. Set up Azure Communication Services Email

The contact form needs an ACS Email resource:

1. In the Azure Portal, create an **Email Communication Services** resource
   (Create a resource → search "Email Communication Service").
2. Under that resource, add a **Domain** — for a quick start, use the free
   **Azure-managed domain** (no DNS setup, works immediately, sender address
   looks like `DoNotReply@<random>.azurecomm.net`). For a branded sender
   address (`enquiries@acesautomotive.com.au`), add a **custom domain**
   instead and verify it via the DNS TXT/CNAME records Azure gives you.
3. Create (or reuse) a **Communication Services** resource and connect the
   Email domain to it under **Domains**.
4. Copy the **Connection String** from the Communication Services resource's
   **Keys** blade.
5. Note the verified sender address (shown on the Domain's overview page,
   under **MailFrom addresses**).

## 4. Wire the settings into the Static Web App

In the Static Web App resource → **Environment variables** (sometimes still
labelled **Application settings**, under **API** production/preview),
add:

| Name                    | Value                                              |
|--------------------------|-----------------------------------------------------|
| `ACS_CONNECTION_STRING`  | the Communication Services connection string        |
| `ACS_SENDER_ADDRESS`     | the verified sender address, e.g. `DoNotReply@xxxx.azurecomm.net` |
| `CONTACT_TO_ADDRESS`     | `aces_autos@yahoo.com.au` (or wherever enquiries should land) |

Save — the API restarts automatically and the form will start sending real
email. Until these are set, the form will respond with a friendly
"email isn't configured yet" error instead of failing silently.

## 5. Test it

- Visit your Static Web App's `*.azurestaticapps.net` URL — the site
  should look identical to the local preview.
- Submit the contact form — you should get a success message and an email
  should land at `CONTACT_TO_ADDRESS` within a minute or so.
- If it fails, check **Static Web App → Functions → contact → Monitor**
  (or Application Insights, if enabled) for the actual error from the
  function.

## Custom domain (acesautomotive.com.au)

Once you're happy with the deployment, add the domain back under
**Static Web App → Custom domains** and follow Azure's DNS instructions
(a CNAME, or an ALIAS/A record if it's the apex domain) to point
acesautomotive.com.au at the Static Web App again.
