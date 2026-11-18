// Standard API response envelope used by all controllers
const ok  = (res, data, status = 200)        => res.status(status).json({ success: true,  data });
const err = (res, message, status = 400)     => res.status(status).json({ success: false, error: message });
const created = (res, data)                  => ok(res, data, 201);

module.exports = { ok, err, created };
