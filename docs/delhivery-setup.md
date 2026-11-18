# Automatic shipping with Delhivery - setup

This is optional. Until you set it up, nothing changes - you keep marking
orders packed/shipped/delivered by hand, exactly like today. Once it's set
up, the moment a customer's payment succeeds, the site automatically books
a pickup with Delhivery and gets back a tracking number (a "waybill") -
no manual step needed.

Every shipment is booked **prepaid** (money already collected through
Razorpay) - there's no Cash on Delivery option here, matching how the site
works today.

## What you need from Delhivery

You said you have a Delhivery account but no API access yet. Delhivery's
API isn't self-serve - you get it through your account manager (the person
who signed you up, or Delhivery's support line/email for your account).
Ask them for:

1. **An API token** (sometimes called a "staging token" for testing, and a
   separate "production token" for real shipments). This is a long string
   of letters and numbers.
2. **Your pickup location's exact registered name.** This is whatever name
   your warehouse/pickup address is registered under in Delhivery's system
   - it has to match **exactly** (capitalization and spacing included), or
   every shipment will fail. Ask your account manager to confirm this
   name, or check it under **Settings -> Warehouses** if you have a login
   to Delhivery's own dashboard.
3. If they mention a **"client name"** or **"seller name"** for your
   account specifically (not every account needs one) - note that down
   too.

This is usually a short email or phone call, not a form to fill in. If
Delhivery offers a staging/test account first, ask for that token too - it
lets you try a real booking without affecting your live account.

## Adding it to the server

On the server, in `~/huskandhoney/.env`, add:

```
DELHIVERY_API_TOKEN=<the token Delhivery gave you>
DELHIVERY_PICKUP_LOCATION=<your pickup location's exact registered name>
```

If Delhivery gave you a client/seller name, also add:

```
DELHIVERY_CLIENT_NAME=<that name>
```

If what you were given is a **staging/test** token rather than a live one,
also add:

```
DELHIVERY_ENV=staging
```

(Leave this out, or set it to `production`, once you're using your real
token.)

Then:

```
cd ~/huskandhoney && git pull && docker compose up -d --build
```

## Checking it worked

1. In `/admin/settings`, scroll to **Delhivery (shipping)** and use **Test
   connection** with a pincode you know Delhivery delivers to (your own
   pincode is a good one to try). This doesn't book anything - it just
   checks that your token and account are working.
2. Before your first real order comes in, it's worth checking the box
   dimensions and weight assumptions just above that, under **Shipping
   label (for the courier)** in the same settings page - these are
   estimates (we don't track exact weights for every product), so adjust
   them if your usual packaging is noticeably bigger or smaller.
3. The first time a real order is paid for, open it in `/admin/orders` and
   check the new **Shipping (Delhivery)** section on that order's page -
   it should show a waybill number a few seconds after payment.

## If a shipment fails to book

This can happen - a typo'd pincode, an address Delhivery can't parse, or a
hiccup on their end. When it does:

- The order is **not** affected - it's still marked paid, nothing is lost.
- You get an email at your `OWNER_EMAIL` address saying it failed and why.
- Open the order in `/admin/orders`. The **Shipping (Delhivery)** section
  shows exactly what Delhivery said was wrong. Fix the order's address if
  that's the issue, then press **Retry booking**.

## If Delhivery's reply looks different than expected

Delhivery's exact API responses can vary a little by account, and this was
built without a live account to test against. If a booking fails with an
error that looks like raw, garbled text instead of a plain sentence (for
example starting with `{` or mentioning "couldn't read"), that's a sign
Delhivery's reply came back in a slightly different shape than expected -
send that exact error message along when you ask for help, since it has
the clue needed to fix it quickly.
