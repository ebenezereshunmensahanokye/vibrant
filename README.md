# PACE SETTERS DATABASE

## Supabase setup

The site uses Supabase to save submitted organization reports. Public visitors can submit records, but row-level security only allows the two administrator emails in `script.js` to read them.

1. Create a Supabase project at https://supabase.com and open its SQL Editor.
2. Run the contents of `supabase-schema.sql`.
3. In Supabase project settings, copy the Project URL and anon/public key. Do not use the `service_role` key in browser code.
4. Replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` in `script.js` with those public project values.
5. In Supabase Authentication URL Configuration, add `https://ebenezereshunmensahanokye.github.io/vibrant/` to the allowed redirect URLs.
6. Publish the updated site. The form will save records to Supabase, while the saved-record view and CSV export require an admin magic-link sign-in.

The admin accounts are `ebenezereshunmensahanokye@gmail.com` and `frankdebrahdarko@gmail.com`. Update both `script.js` and the database read policy if the authorized accounts change.
