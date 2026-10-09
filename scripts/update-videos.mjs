import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const CHANNEL_ID = 'UCDxLn0CMxEHyPqJxJKN0djQ';
const UPLOADS_PLAYLIST_ID = CHANNEL_ID.replace(/^UC/, 'UU');
const API_URL = 'https://www.googleapis.com/youtube/v3';
const VIDEOS_LIMIT = 3;
const UPLOADS_LOOKUP = 25;
const TIME_ZONE = 'America/Sao_Paulo';
const OUTPUT_FILE = 'videos.json';

const fetchJson = async (path, params) => {
  const url = new URL(`${API_URL}/${path}`);
  url.search = new URLSearchParams({...params, key: process.env.YOUTUBE_API_KEY}).toString();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube API ${path} respondeu ${response.status}: ${await response.text()}`);
  }
  return response.json();
};

const fetchRecentUploadIds = async () => {
  const data = await fetchJson('playlistItems', {part: 'contentDetails', playlistId: UPLOADS_PLAYLIST_ID, maxResults: UPLOADS_LOOKUP});
  return data.items.map(item => item.contentDetails.videoId);
};

const fetchVideoDetails = async ids => {
  const data = await fetchJson('videos', {part: 'snippet,liveStreamingDetails', id: ids.join(',')});
  return data.items;
};

export const extractSpeaker = description => {
  const firstLine = (description ?? '').split('\n')[0].trim();
  const separatorIndex = firstLine.lastIndexOf(' - ');
  return separatorIndex === -1 ? '' : firstLine.slice(separatorIndex + 3).trim();
};

export const toLocalDate = isoDateTime => new Intl.DateTimeFormat('en-CA', {timeZone: TIME_ZONE}).format(new Date(isoDateTime));

const pickThumbnail = thumbnails => (thumbnails.maxres ?? thumbnails.medium ?? thumbnails.default).url;

export const selectFinishedLives = (videos, limit = VIDEOS_LIMIT) =>
  videos
    .filter(video => video.liveStreamingDetails?.actualEndTime)
    .sort((a, b) => b.liveStreamingDetails.actualStartTime.localeCompare(a.liveStreamingDetails.actualStartTime))
    .slice(0, limit);

export const toAppVideo = video => ({
  id: video.id,
  videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
  titulo: video.snippet.title.trim(),
  preletor: extractSpeaker(video.snippet.description),
  data: toLocalDate(video.liveStreamingDetails.actualStartTime),
  capa: pickThumbnail(video.snippet.thumbnails),
});

const main = async () => {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error('Variável de ambiente YOUTUBE_API_KEY não definida');
  }

  const ids = await fetchRecentUploadIds();
  const lives = selectFinishedLives(await fetchVideoDetails(ids));

  if (lives.length === 0) {
    throw new Error('Nenhuma transmissão encerrada encontrada; mantendo o arquivo atual');
  }

  const videos = lives.map(toAppVideo);
  await writeFile(OUTPUT_FILE, `${JSON.stringify({videos}, null, 2)}\n`);
  console.log(`${OUTPUT_FILE} atualizado:`, videos.map(video => video.titulo));
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
