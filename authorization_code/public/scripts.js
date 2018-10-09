const app2 = {};
const SPOTIFY_BASE_URI = 'https://api.spotify.com/v1';
const SPOTIFY_CLIENT_ID =
  'cee2065452ae4173b95382f62e19e404';
const SPOTIFY_CLIENT_SECRET =
  'c0888a6b784e493c948a185d691a090e';
const BASE_64_ENCODED_CLIENT_CREDENTIALS = btoa(
  `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
);

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new Error(
      `HTTP Error ${response.statusText}`
    );
    error.status = response.statusText;
    error.response = response;
    console.log('Error communicating with Spotify:');
    console.log(error);
    throw error;
  }
}

function parseJson(response) {
  return response.json();
}

const SpotifyClient = {
  getApiToken() {
    return fetch('https://accounts.spotify.com/api/token', {
      method: 'post',
      body: 'grant_type=client_credentials',
      headers: {
        Authorization: `Basic ${BASE_64_ENCODED_CLIENT_CREDENTIALS}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
      .then(checkStatus)
      .then(parseJson)
      .then(json => json.access_token)
      .then(token => (this.token = token));
  }
};

app2.getArists = (artist) => $.ajax({
	url: 'https://api.spotify.com/v1/search',
	method: 'GET',
	dataType: 'json',
  headers: {
    Authorization: `Basic ${BASE_64_ENCODED_CLIENT_CREDENTIALS}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
	data: {
		type: 'artist',
		q: artist
	}

});

app2.getAristsAlbums = (id) => $.ajax({
	url: `https://api.spotify.com/v1/artists/${id}/albums`,
	method: 'GET',
	dataType: 'json',
  headers: {
    Authorization: `Basic ${BASE_64_ENCODED_CLIENT_CREDENTIALS}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
	data: {
		album_type: 'album',
	}
});

app2.getAlbumTracks = (id) => $.ajax({
	url: `https://api.spotify.com/v1/albums/${id}/tracks`,
	method: 'GET',
  headers: {
    Authorization: `Basic ${BASE_64_ENCODED_CLIENT_CREDENTIALS}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
	dataType: 'json'
});

app2.getAlbums = function(artists) {
	let albums = artists.map(artist => app2.getAristsAlbums(artist.id));
	$.when(...albums)
		.then((...albums) => {
			let albumIds = albums
				.map(a => a[0].items)
				.reduce((prev,curr) => [...prev,...curr] ,[])
				.map(album => app2.getAlbumTracks(album.id));

			app2.getTracks(albumIds);
		});
};

app2.getTracks = function(tracks) {
	$.when(...tracks)
		.then((...tracks) => {
			tracks = tracks
				.map(getDataObject)
				.reduce((prev,curr) => [...prev,...curr],[]);
			const randomPlayList = getRandomTracks(50,tracks);
			app2.createPlayList(randomPlayList);
		})
};

app2.createPlayList = function(songs) {
	const baseUrl = 'https://embed.spotify.com/?theme=white&uri=spotify:trackset:My Playlist:';
	songs = songs.map(song => song.id).join(',');
	$('.loader').removeClass('show');
	$('.playlist').append(`<iframe src="${baseUrl + songs}" height="400"></iframe>`);
}

app2.init = function() {
	$('form').on('submit', function(e) {
		e.preventDefault();
		let artists = $('input[type=search]').val();
		$('.loader').addClass('show');
		artists = artists
			.split(',')
			.map(app2.getArists);

		$.when(...artists)
			.then((...artists) => {
				artists = artists.map(a => a[0].artists.items[0]);
				console.log(artists);
				app2.getAlbums(artists);
			});
	});

}

const getDataObject = arr => arr[0].items;

function getRandomTracks(num, tracks) {
	const randomResults = [];
	for(let i = 0; i < num; i++) {
		randomResults.push(tracks[ Math.floor(Math.random() * tracks.length) ])
	}
	return randomResults;
}

$(app2.init);
