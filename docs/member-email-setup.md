# Member email setup — SMTP saved, school inbox delivery confirmed

Created in the owner's Resend account on 23 October 2026. Sender domain: `auth.islandtoinfinity.online`. Region: Tokyo (`ap-northeast-1`). Receiving remains disabled. A domain-scoped sending key has been created and saved in Supabase SMTP. Five native Auth test requests returned HTTP 200; the earlier four emails show Delivered in Resend. The owner confirmed the first email reached the school inbox.

Provider-generated DNS records, relative to `islandtoinfinity.online`:

| Type | Host | Value |
| --- | --- | --- |
| TXT | resend._domainkey.auth | p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC19DyjnEQ9+wXT+cGqKjSMlL6UbH1IEdTZaJAyBQuHmSpNtKPrwtMmgdMl901/Nry4V4hw4SJjaXQj5l/JLsBRhN1GnPzxI5uEXXI/3sKxx4ELabgt0L1Skk/EdJ68ScgN0bPkxY2SeJqlnbgrm7q86ymyjucz55IDUZ5ItpTs1wIDAQAB |
| CNAME | rsend.auth | rsend-apne1.forge.rmta.net |
| CNAME | send.auth | send.forge.rmta.net |

Always recheck the live Resend page before reapplying; records may change if the domain is recreated. Preserve all existing website records and root MX/SPF/DMARC. The optional root `_dmarc` suggestion has NOT been applied. The owner approved this DNS delegation at action time.

All three records were saved in DNSPod on 24 October 2026, around 00:24–00:25 Asia/Shanghai. An authoritative query to library.dnspod.net returned the exact TXT and both CNAME values. The root A record remains 76.76.21.21. Resend displays Verified and Resend Forge Enabled, confirmed in the live dashboard on 24 October 2026. Tracking remains unconfigured.

The owner approved creation and storage in Supabase SMTP. The sending-only credential named `Island to Infinity Auth SMTP` was created, scoped to `auth.islandtoinfinity.online`. Its value was not read by the agent or stored in code/chat. The owner entered the password; the agent completed the ordinary fields and saved them.

Supabase SMTP was verified after a full page reload on 24 October 2026:

| Setting | Saved value |
| --- | --- |
| Custom SMTP | Enabled |
| Sender email | `login@auth.islandtoinfinity.online` |
| Sender name | `Island to Infinity` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Stored; Supabase displays “Stored password is hidden” |

The Magic link or OTP email subject/body were saved with `{{ .Token }}` for code-entry login. Supabase displayed an incident banner during setup; the saved SMTP fields nevertheless persisted after reload. Persistence confirms configuration storage, not successful delivery or credential validity.

The owner approved one school mailbox for this test (address intentionally omitted here). It had no Auth identity before testing. Native Auth `/otp` with `create_user:true` created a test-only, unconfirmed Auth identity and sent the initial confirmation email. No member account or platform permissions were granted. The first email reached the inbox, confirmed by the owner. The earlier four successful test requests returned HTTP 200 and Resend recorded Delivered.

The initial emails used the default “Confirm Your Signup” template. The Confirm sign up template was subsequently saved with `{{ .Token }}` and subject “Your Island to Infinity verification code”, confirmed after reload. The subsequent sends still used the old subject. The owner subsequently confirmed the latest body contains a numeric code, so code content is effective while subject branding remains unresolved. Native code verification subsequently passed on 24 October 2026 using the new owner-supplied code: confirmed identity, immediate global sign-out and rejection of a repeated verification attempt. No token/code was written to the report. One intermediate request returned HTTP 429 with a 12-second cooldown; a retry after that interval succeeded. A later explicitly authorized continuation sent one additional test email using `create_user:false`. Do not equate inbox delivery with a completed login workflow.

Next: complete the remaining Next.js browser onboarding acceptance. Auth settings were completed by the owner and native behavior tests pass. Native code-entry, sign-out and replay-rejection checks are complete. The temporary test page does not log codes/tokens or grant member privileges. Browser automation was denied access to the test-page origin; the temporary page was stopped after native verification completed. Site URL was saved as `https://islandtoinfinity.online`. The independent $0 test project is documented in `member-verification-2026-10-24.md`. Production member login must continue using `shouldCreateUser:false` with explicit admin provisioning. The test-only signup request does not change that application policy. Member release gates remain closed. No actual member invitations have been issued.

On 24 October 2026 the owner confirmed disabling public signup and saving Email OTP expiration as 600 seconds. Native Auth behavior tests then rejected public signup and anonymous signup. A disposable, no-email native Auth probe verified the revised OTP-ready administrative provisioning, code verification and sign-out without granting any membership. Backdating only its test recovery timestamp by eleven minutes made verification fail with `otp_expired`. The disposable Auth identity was removed afterward. No actual members were provisioned.
