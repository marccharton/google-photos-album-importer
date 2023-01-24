import dotenv from 'dotenv';
import {google} from 'googleapis';
import Photos from 'googlephotos';
import express from 'express';
import open from 'open';
import asyncForEach from 'async-await-foreach';
import fs from "fs";
import path from "path";

let oauth2Client, photos, album;
const app = express();
dotenv.config();
let photosData;

makeItDone("Processing albums to import...", () => photosData = JSON.parse(fs.readFileSync('./photos.json', 'utf8')));

app.get('/', async function (req, res) {
  await open("http://localhost:8000/connect");
  res.send("go conect");
})

app.get('/connect', function(req, res) {
    
  oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  );

  const scopes = [
    Photos.Scopes.READ_AND_APPEND
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  res.redirect(url);
});

app.get("/google/auth/redirect", async function (req, res) {
  
  const {tokens} = await oauth2Client.getToken(req.query.code)
  //oauth2Client.setCredentials(tokens);
  
  console.log(tokens);
  process.env.ACCESS_TOKEN = tokens.access_token 
  
  res.redirect('/photos/menu');
});

app.get('/photos/menu', function (req, res) {
  res.send(`C'est tout bon tu es connecté!! <br/> Tu peux tester avec les fonctionnalités suivantes : 
      <ul> 
        <li><a href="/photos/list" target="_blank">Liste des albums</a> </li> 
        <li><a href="/photos/create" target="_blank">Créer un album </a> </li> 
        <li><a href="/photos/upload/album" target="_blank">Uploader un album </a> </li> 
        <li><a href="/photos/upload/folder" target="_blank">Uploader un dossier </a> </li> 
      </ul>`);
});

app.get('/photos/list', async function(req, res) {
  if (!process.env.ACCESS_TOKEN) {
    res.redirect('/connect');
    return;
  }
  else {
    photos = new Photos(process.env.ACCESS_TOKEN);
  }

  const response = await photos.albums.list(50);
  const albums = response.albums;

  const albumView = albums.map((album) => {
    return `<li>
              <h2>
                <a href="${album.productUrl}">${album.title}</a>
              </h2> 
            </li>`;
  });

  let view = "<h1> Albums Photos </h1>";
  albumView.forEach(album => {
    view += album;
  });
  view = `<ul>${view}<ul>`;
  res.send(view);
});

app.get('/photos/create', async function(req, res) {
  if (!process.env.ACCESS_TOKEN) {
    res.redirect('/connect');
    return;
  }
  else {
    photos = new Photos(process.env.ACCESS_TOKEN);
  }

  const response = await photos.albums.create('Mon super album');
  album = response;
  console.log(response);
  res.redirect(response.productUrl);
});

app.get('/photos/upload/album', async function(req, res) {
  if (!process.env.ACCESS_TOKEN) {
    res.redirect('/connect');
    return;
  }
  else {
    photos = new Photos(process.env.ACCESS_TOKEN);
  }

  try {
    for (const {albumName, files} of getNextAlbum(photosData)) {
      const album = await photos.albums.create(albumName);
  
      console.log(`Uploading album "${albumName}" ...`);
  
      await asyncForEach(files, async file => {
        await uploadingFile( 
          album.id,
          file.fileName,
          file.filePath,
          file.description,
          100000,
        );
      }).then(_ => {
        console.log(`☑️  The album "${albumName}" imported successfully `);
      }).catch(err => {
        // TODO : loger l'erreur et passer à la suite plutôt que de tout arrêter.
        console.log({albumName, err});
        throw err;
      })
    }
  }
  catch (err) {
    res.status(500).send({ err });
    return ;
  }
  
  res.send("C'est tout bon");
});
async function uploadingFile(albumId, fileName, filePath, description, requestDelay) {  
  try {
    process.stdout.write(`\--> Uploading file "${fileName}" ...`);

    const response = await photos.mediaItems.upload(albumId, fileName, filePath, description, requestDelay);
    console.log(' Done ! 🎉');

    return response;
  }
  catch(err) {
    console.log(err);
    throw err;
  }
}

app.get('/photos/upload/folder', async function(req, res) {
  if (!process.env.ACCESS_TOKEN) {
    res.redirect('/connect');
    return;
  }
  else {
    photos = new Photos(process.env.ACCESS_TOKEN);
  }

  if (!process.env.ALBUM_ID && (album === undefined || album === null)) {
    res.send("<p>Navré mais l'album n'existe pas, t'es sûr que tu l'as créé avant ?!</p>");
    return;
  }

  const files = [
    { name: 'barbichette marc.MOV', description: '2011.04.27 Champote avec ugo' },
    { name: 'GEDC1220.MOV', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080026.JPG', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080027.JPG', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080028.JPG', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080029.JPG', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080031.JPG', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080035.JPG', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080037.JPG', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080038.MOV', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080046.JPG', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080053.JPG', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080058.JPG', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080059.MOV', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080061.JPG', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080062.MOV', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080063.JPG', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080064.JPG', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080066.JPG', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080068.MOV', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080071.MOV', description: '2011.04.27 Champote avec ugo' },
    { name: 'P1080073.JPG', description: '2011.04.27 Champote avec ugo' },
  ];

  const albumId = album 
                  ? album.id
                  : process.env.ALBUM_ID;

  await uploadingFolder(
    res, 
    albumId,
    files,
    directoryPath = "D:\\Photos\\2011\\2011.04.27 Champote avec ugo\\P1080071.MOV",
    requestDelay = 100000,
  );
});
async function uploadingFolder(res, albumId, files, directoryPath, requestDelay) {  
  try {
    process.stdout.write(`Uploading [D] ${directoryPath}" ...`);

    const response = await photos.mediaItems.upload(albumId, files, directoryPath, requestDelay);
    console.log(' Done !');

    console.log('======== RESPONSE ========');
    console.log(response);

    res.send({response});
  }
  catch(err) {
    res.status(500).send({ error: err })
    // res.send("Navré mais il y a eu un souci");
    console.log(err);
  }
}

app.listen(8000, () => {
  console.log("listening on port 8000");
});


// ======= UTILS ========

function* getNextAlbum(data) {
  for (let index in data) {
    const albumName = index;
    const files = data[index];
    yield {albumName, files};
  }
}

function makeItDone(message, cb) {
  process.stdout.write(message);
  cb();
  console.log(" Done !");
}