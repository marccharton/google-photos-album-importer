# google-photos-album-importer
Import albums photos to [google photos](https://www.google.com/photos/about/) from local files.

## todo
- [x] feed readme
- [x] fix download error report

## Environment
      
### CLIENT_ID  
**Environment variable aiming at** : proving client ID to google server.  
**Type of value** : Google UID  
**Source of value** : [Google Cloud](https://console.cloud.google.com/)  
  
### CLIENT_SECRET  
**Environment variable aiming at** : proving client secret to google server  
**Type of value** : Google Secret  
**Source of value** : [Google Cloud](https://console.cloud.google.com/)  
  
### REDIRECT_URL  
**Environment variable aiming at** : serve a local address used by google OAuth authentication.  
**Type of value** : URL  
**Source of value** : Node script.  
  
### ALBUMS_PATH  
**Environment variable aiming at** : providing the path to local system folder with photos albums  
**Type of value** : Folder Path  
**Source of value** : Your path to photos albums.  
  
### PROCESSED_ALBUMS_FILE_NAME  
**Environment variable aiming at** : giving a name to the file with all photos paths.  
**Type of value** : Json File Name  
**Source of value** : Arbitrary, you can keep it as it is.  

## Prerequisities

- [nodejs](https://nodejs.org/en/)
- specific folder archicture for albums

### folder architecture

- year
  - album
  - ablum
    - sub folder
    - sub folder
 
Example : 
          <li>2011
            <ul>
              <li>This akward weekend</li>
              <li>Let's go to Stockholm
                <ul>
                  <li> leaving home </li>
                  <li> stay in amsterdam </li>
                  <li> buildings </li>
                </ul>
              </li>
            </ul>
          </li>
          <li>2012
            <ul>
              <li>My super weekend</li>
              <li>My mom's birthday</li>
            </ul>
          </li>
  

