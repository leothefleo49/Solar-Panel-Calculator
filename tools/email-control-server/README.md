Email Control Server
=====================

Purpose
-------
This lightweight Express server accepts inbound email webhooks (from providers like Mailgun, SendGrid, or Postmark) and updates a simple JSON `config.json` that your app can poll as a remote config.

How it works
------------
- The app polls `GET /config` for `{ reportingInterval: 'daily' }` and adjusts the email reporting schedule.
- When the server receives a POST to `/incoming-email` with email JSON (`{ subject, body, from }`), it looks for a line like `interval: daily` and updates the config accordingly.

Setup
-----
1. Install dependencies:

   - In PowerShell (from the `tools/email-control-server` folder):
     `npm install`

2. Configure a control token (optional but recommended):

   - Create a `.env` file with `CONTROL_TOKEN=some-secret`.
   - Configure your inbound email provider to POST to `/incoming-email?token=some-secret` or include header `X-EMAIL-CONTROL-TOKEN: some-secret`.

3. Start the server:

   `npm start`

4. Configure the app:

   - Set `VITE_ERROR_LOG_CONFIG_URL` in your build / environment to the publicly reachable `/config` URL of this server.

Inbound email examples
----------------------
- Subject: `Please change interval`
  Body: `interval: daily`

- Subject: `interval: hourly`
  Body: `I want hourly reports` 

Security
--------
Use the `CONTROL_TOKEN` and ensure the endpoint is behind HTTPS when exposed publicly.

Notes
-----
This is intentionally minimal. You may add validation of the sender, parse HTML email bodies, or integrate with your email provider's signed webhook signature verification for stronger security.
