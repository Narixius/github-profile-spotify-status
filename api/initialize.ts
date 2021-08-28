import request from 'request';

export default (req, res) => {
  if (req.query.code)
    return request(
      {
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        form: {
          CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
          CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: req.query.code,
          redirect_uri: process.env.VERCEL_URL,
        },
      },
      (err, _, body) => {
        if (err || !body || !JSON.parse(body) || !JSON.parse(body).SPOTIFY_REFRESH_TOKEN)
          return res.send(`unable to generate refresh token. <a href="${process.env.VERCEL_URL}">Try Again</a>`);
        return res.send(`Your refresh token is: <pre>${JSON.parse(body).SPOTIFY_REFRESH_TOKEN}</pre>`);
      }
    );
  else {
    return res.send(
      `<p>Your redirect url is: <pre>${process.env.VERCEL_URL}</pre></p>
	  <a href="https://accounts.spotify.com/en/authorize?response_type=code&CLIENT_ID=${process.env.SPOTIFY_CLIENT_ID}&scope=user-read-currently-playing,user-read-recently-played,user-top-read&redirect_uri=${process.env.VERCEL_URL}">Get Refresh Token</a>`
    );
  }
};
