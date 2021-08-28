import request from 'request';

export default (req, res) => {
  if (req.query.code)
    return request(
      {
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        form: {
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: req.query.code,
          redirect_uri: process.env.VERCEL_URL,
        },
      },
      (err, response, body) => {
        if (err || !body || !JSON.parse(body) || !JSON.parse(body).refresh_token)
          return res.send(`unable to generate refresh token. <a href="${process.env.VERCEL_URL}">Try Again</a>`);
        return res.send(`Your refresh token is: <pre>${JSON.parse(body).refresh_token}</pre>`);
      }
    );
  else {
    return res.send(
      `<a href="https://accounts.spotify.com/en/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&scope=user-read-currently-playing,user-read-recently-played,user-top-read&redirect_uri=${process.env.VERCEL_URL}">Get Refresh Token</a>`
    );
  }
};
