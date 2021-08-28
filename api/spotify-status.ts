import ejs from 'ejs';
import fs from 'fs';
import { join } from 'path';
import SpotifyWebApi from 'spotify-web-api-node';
import fetch from 'node-fetch';

type TemplateDataType = {
  currentPlaying?: {
    name: string;
    artist: string[];
    cover: string;
  };
  recentPlayed?: {
    name: string;
    artist: string[];
    cover: string;
  }[];
  favArtists: {
    name: string;
    cover: string;
  }[];
};

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.VERCEL_URL,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
});

const imageToBase64 = (images) =>
  fetch(images[images.length - 1].url)
    .then((r) => r.buffer())
    .then((buf) => `data:image/png;base64,` + buf.toString('base64'));

const refreshToken = () =>
  spotifyApi.refreshAccessToken().then((data) => {
    spotifyApi.setAccessToken(data.body.access_token);
  });

const readTemplateFile = () => fs.readFileSync(join(__dirname, 'template', 'dark.svg.ejs'), 'utf-8');

const getInitializeData = () =>
  Promise.all([
    readTemplateFile(),
    spotifyApi.getMyCurrentPlayingTrack(),
    spotifyApi.getMyRecentlyPlayedTracks({ limit: 3 }),
    spotifyApi.getMyTopArtists({ limit: 4 }),
  ]);

const validateCurrentSong = (currentPlaying) =>
  Object.keys(currentPlaying.body).length && currentPlaying.body.currently_playing_type == 'track' && currentPlaying.body.item;

const getAllImages = (currentPlayingSong, recentlyPlayedSongs, favouriteArtists) =>
  Promise.all([
    currentPlayingSong ? imageToBase64(currentPlayingSong['album'].images) : null,
    ...recentlyPlayedSongs.map((recentlyPlayedSong) => imageToBase64(recentlyPlayedSong.track['album'].images)),
    ...favouriteArtists.map((artist) => imageToBase64(artist.images)),
  ]);
module.exports = async (req, res) => {
  await refreshToken();

  getInitializeData().then(async ([template, currentPlaying, recetlyPlayed, favArtists]) => {
    const currentPlayingSong = validateCurrentSong(currentPlaying);
    const recentlyPlayedSongs = recetlyPlayed.body.items;
    const favouriteArtists = favArtists.body.items;

    getAllImages(currentPlayingSong, recentlyPlayedSongs, favouriteArtists).then((covers) => {
      const templateParams: TemplateDataType = {
        currentPlaying: currentPlayingSong && {
          name: currentPlayingSong.name,
          artist: currentPlayingSong['artists'].map((artist) => {
            return artist.name;
          }),
          cover: covers[0],
        },
        recentPlayed: recentlyPlayedSongs.map((recentlyPlayedSong, i) => {
          return {
            name: recentlyPlayedSong.track.name,
            artist: recentlyPlayedSong.track.artists.map((artist) => artist.name),
            cover: covers[i + 1],
          };
        }),
        favArtists: favouriteArtists.map((artist, i) => ({
          name: artist.name,
          cover: covers[i + 4],
        })),
      };

      res.setHeader('content-type', 'image/svg+xml');
      res.send(ejs.render(template, templateParams));
    });
  });
};
