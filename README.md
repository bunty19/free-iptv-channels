[<img src="https://vercel.com/button" alt="Deploy with Vercel" height="30"/>](https://vercel.com/new/clone?repository-url=https://github.com/dtankdempse/free-iptv-channels/tree/master/node&project-name=multiservice&repo-name=multiservice)
[<img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy with Netlify" height="30"/>](https://app.netlify.com/start/deploy?repository=https://github.com/dtankdempse/free-iptv-channels)
[<img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy to Heroku" height="30"/>](https://heroku.com/deploy?template=https://github.com/dtankdempse/free-iptv-channels)
[<img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" height="30"/>](https://render.com/deploy?repo=https://github.com/dtankdempse/free-iptv-channels)
[<img src="https://i.imgur.com/fjfgTSm.jpeg" alt="Deploy to Fly.io" height="30"/>](https://fly.io/launch?source=https://github.com/dtankdempse/free-iptv-channels)
[<img src="https://oneclick.amplifyapp.com/button.svg" alt="Deploy to AWS Amplify" height="30"/>](https://console.aws.amazon.com/amplify/home#/deploy?repo=https://github.com/dtankdempse/free-iptv-channels)

# Pluto, Samsung, Stirr, Plex, PBS and Roku Playlist (M3U8)

This script generates an m3u8 playlist from the channels provided by services such as Pluto, Samsung, Stirr, Plex, PBS, and Roku. It is based on the original script created by matthuisman, which can be found at [matthuisman's GitHub repository](https://github.com/matthuisman/i.mjh.nz).

### Hosted Script URL

Use the following URL to access the hosted script. Replace the `ADD_REGION` and `ADD_SERVICE` placeholders with your desired parameters.

`https://tinyurl.com/multiservice21?region=ADD_REGION&service=ADD_SERVICE`

After customizing the URL by replacing the ADD_REGION and ADD_SERVICE placeholders with your desired region and service (e.g., us for the US region and Pluto for the service), copy the complete URL and paste it into the "Add Playlist" or "M3U8 URL" section of your IPTV application. Once added, the app will load both the channels and the guide information


### Available Service Parameters

Choose one of the following services to include in the `service` parameter:

- Plex
- Roku
- SamsungTVPlus
- PlutoTV
- PBS
- PBSKids
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

**Please note:** It’s much better to add the Google Apps Script to your own Google account rather than relying on this publicly shared URL long-term.

### How to Add the Script to Your Google Account (code.gs)

Go <a href="https://script.google.com/home/start" target="_blank">here</a> and click the "New Project" button in the upper left corner. Then, copy the script from <a href="https://github.com/dtankdempse/free-iptv-channels/blob/main/code.gs" target="_blank">code.gs</a> and paste it into the script editor. Once done, deploy the script.

Follow this video tutorial to learn how to deploy a Google Apps Script:

[How to Deploy a Google Web App](https://www.youtube.com/watch?v=-AlstV1PAaA)

During the deployment process, make sure to select **"Anyone"** for the "Who has access" option, so the app can access the URL and load without requiring authentication.

Once deployed, you will get a URL similar to:

`https://script.google.com/macros/s/...gwlprM_Kn10kT7LGk/exec`

To use the script, you need to add the `region` and `service` parameters at the end of the URL. For example:

`https://script.google.com/macros/s/...gwlprM_Kn10kT7LGk/exec?region=us&service=Plex`

Simply replace `region=us` and `service=Plex` with the appropriate region and service values from the available parameters listed above.

### EPG for TV Guide Information

The EPG URLs are embedded directly within the playlists. If you'd prefer to manually add the EPG guide, you can find the relevant URLs for each service on
this [page](https://github.com/matthuisman/i.mjh.nz/).
