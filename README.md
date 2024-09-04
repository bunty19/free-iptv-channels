# Pluto, Samsung, Stirr, Plex, PBS and Roku Playlist (M3U8)

This script generates an m3u8 playlist from the channels provided by services such as Pluto, Samsung, Stirr, Plex, PBS, and Roku. It is based on the original script created by matthuisman, which can be found at matthuisman's GitHub repository.

### Hosted Script URL

Use the following URL to access the hosted script. Replace the `ADD_REGION` and `ADD_SERVICE` placeholders with your desired parameters.

`https://tinyurl.com/multiservice21?region=ADD_REGION&service=ADD_SERVICE`


### Available Service Parameters

Choose one of the following services to include in the `service` parameter:

- Plex
- Roku
- SamsungTVPlus
- PlutoTV
- PBS
- Stirr

### Available Region Parameters

Use one of these region codes to specify the region in the `region` parameter:

- `all` (for all regions)
- `ar` (Argentina)
- `br` (Brazil)
- `ca` (Canada)
- `cl` (Chile)
- `de` (Germany)
- `dk` (Denmark)
- `es` (Spain)
- `fr` (France)
- `gb` (United Kingdom)
- `mx` (Mexico)
- `no` (Norway)
- `se` (Sweden)
- `us` (United States)

### How to Add the Script to Your Google Account (code.gs)

Follow this video tutorial to deploy the Google Apps Script:

[How to Deploy a Google Web App](https://www.youtube.com/watch?v=-AlstV1PAaA)

During the deployment process, make sure to select **"Anyone"** for the "Who has access" option, so the app can access the URL and load without requiring authentication.

Once deployed, you will get a URL similar to:

`https://script.google.com/macros/s/...gwlprM_Kn10kT7LGk/exec`

To use the script, you need to add the `region` and `service` parameters at the end of the URL. For example:

`https://script.google.com/macros/s/...gwlprM_Kn10kT7LGk/exec?region=us&service=Plex`

Simply replace `region=us` and `service=Plex` with the appropriate region and service values from the available parameters listed above.
