import request from 'request';

let baseURL = `${process.env.VERCEL_ENV == 'development' ? 'http://' : 'https://'}${process.env.VERCEL_URL}`;
let redirectURL = `${baseURL}/init`;

export default (req, res) => {
  if (req.query.code)
    return request(
      {
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        form: {
          client_id: process.env.SPOTIFY_CLIENT_ID,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: req.query.code,
          redirect_uri: redirectURL,
        },
      },
      (err, _, body) => {
        if (err || !body || !JSON.parse(body) || !JSON.parse(body).refresh_token)
          return res.send(
            `<p>Unable to generate refresh token.</p><pre>${body}</pre> <br/> <a href="${redirectURL}">Try Again</a>`
          );
        return res.send(`
		<p style="color: green;"><b>Refesh token generated successfully</b></p>
		<p>Your refresh token is:</p>
		<pre>${JSON.parse(body).refresh_token}</pre>
		<p>Now you have to add this refresh token to your vercel project environment variables</p>
		<ol>
			<li>Open <a href="https://vercel.com/dashboard">Vercel Dashboard</a></li>
			<li>Select your project</li>
			<li>From the top navigation, go to settings</li>
			<li>On the side abr select <b>Environment Variables</b></li>
			<li>Scroll down and find the <b>SPOTIFY_REFRESH_TOKEN</b> variables, by clicking on the right dots, edit this variable and change it to the code above</li>
			<li>Then from the nav menu go to the <b>Deployment</b> secrion</li>
			<li>Redeploy the latest deploy process by clicking on the right dots of the deploy process</li>
			<li>Wait until the end of the deployment process</li>
		</ol>
		<p>Then open <a href="${baseURL}">Homepage</a> and see your Spotify Status </p>
		`);
      }
    );
  else {
    return res.send(
      `<p>Your redirect url is: <pre>${redirectURL}</pre></p>
      <p>Please add the redirect url above to your spotify app settings on <b>Redirect URIs</b> sections.</p>
	  <ol>
	  	<li>Open <a href="https://developer.spotify.com/dashboard">Spotify Developer Dashboard</a></li>
	  	<li>Select your app</li>
		<li>Click on Edit Settings button</li>
		<li>Add the redirect URL above to the <b>Redirect URIs</b> section</li>
	  </ol>
	  <p>Then try to generate refresh token using the link bellow</p>
	  <a href="https://accounts.spotify.com/en/authorize?response_type=code&client_id=${process.env.SPOTIFY_CLIENT_ID}&scope=user-read-currently-playing,user-read-recently-played,user-top-read&redirect_uri=${redirectURL}">Get Refresh Token</a>`
    );
  }
};
