function doGet(e) {
  const params = e.parameter;
  const region = (params.region || 'us').toLowerCase().trim();
  const service = params.service;

  if (!service) {
    return ContentService.createTextOutput('Error: No service type provided').setMimeType(ContentService.MimeType.TEXT);
  }

  let cacheFileId = checkCache(service);

  let data;

  try {
    if (cacheFileId) {
      Logger.log('Using cached data');
      data = retrieveJsonFromDrive(cacheFileId);
    } else {
      Logger.log('Fetching new data');
      const APP_URL = 'https://i.mjh.nz/' + service + '/.app.json';
      const response = UrlFetchApp.fetch(APP_URL);
      data = JSON.parse(response.getContentText());
      cacheFileId = saveJsonToDrive(data, service);  // Save only based on the service
    }
  } catch (error) {
    Logger.log('Error fetching new data: ' + error.message);
    if (cacheFileId) {
      Logger.log('Serving previously cached data due to fetch error');
      data = retrieveJsonFromDrive(cacheFileId);
    } else {
      return ContentService.createTextOutput('Error fetching data and no cached data available: ' + error.message).setMimeType(ContentService.MimeType.TEXT);
    }
  }

  if (service.toLowerCase() === 'pbs') {
    return ContentService.createTextOutput(formatPbsDataForM3U8(data))
      .setMimeType(ContentService.MimeType.TEXT);
  }

  // The rest of the script remains unchanged, using the data and filtering based on the region.

  let channels = {};
  let groupExtractionRequired = false;
  let regionNames = {};

  const regionNameMap = {
    us: "USA",
    mx: "Mexico",
    es: "Spain",
    ca: "Canada",
    au: "Australia",
    nz: "New Zealand"
  };

  if (data.channels) {
    channels = data.channels;

    if (service.toLowerCase() === 'plex' && region !== 'all') {
      channels = Object.keys(channels).reduce((filteredChannels, key) => {
        const channel = channels[key];
        if (channel.regions && channel.regions.includes(region)) {
          filteredChannels[key] = { ...channel, group: regionNameMap[region] || region.toUpperCase() };
        }
        return filteredChannels;
      }, {});
    }

    groupExtractionRequired = true;
  } else if (data.regions) {
    const regions = data.regions;

    if (service.toLowerCase() === 'plex') {
      for (let regionKey in regions) {
        regionNames[regionKey] = regionNameMap[regionKey] || regionKey.toUpperCase();
      }
    }

    if (region === 'all') {
      for (let regionKey in regions) {
        for (let channelKey in regions[regionKey].channels) {
          if (!channels[channelKey]) {
            channels[channelKey] = { ...regions[regionKey].channels[channelKey], region: regions[regionKey].name || regionKey.toUpperCase() };
          }
        }
      }
    } else if (regions[region]) {
      channels = regions[region].channels || {};
    } else {
      return ContentService.createTextOutput(`Error: Invalid region ${region}`).setMimeType(ContentService.MimeType.TEXT);
    }
  } else {
    return ContentService.createTextOutput('Error: Invalid data format').setMimeType(ContentService.MimeType.TEXT);
  }

  const startChno = params.start_chno ? parseInt(params.start_chno) : null;
  const sort = params.sort || 'chno';
  const include = (params.include || '').split(',').filter(Boolean);
  const exclude = (params.exclude || '').split(',').filter(Boolean);

  let output = `#EXTM3U url-tvg="https://github.com/matthuisman/i.mjh.nz/raw/master/` + service + `/${region}.xml.gz"\n`;

  // Add this condition to set EPG to "all" for Roku regardless of region
  if (service.toLowerCase() === 'roku') {
    output = `#EXTM3U url-tvg="https://github.com/matthuisman/i.mjh.nz/raw/master/Roku/all.xml.gz"\n`;
  }

  const sortedKeys = Object.keys(channels).sort((a, b) => {
    const chA = channels[a];
    const chB = channels[b];
    return sort === 'chno' ? chA.chno - chB.chno : chA.name.localeCompare(chB.name);
  });

  sortedKeys.forEach(key => {
    const channel = channels[key];
    const { logo, name, url, regions } = channel;
    const channelId = `${service}-${key}`;

    let group = groupExtractionRequired
      ? (channel.groups && channel.groups.length > 0 ? channel.groups[0] : regionNameMap[region] || region.toUpperCase())
      : (channel.group || regionNameMap[region] || region.toUpperCase());

    // Add this condition to remove the group title for Roku
    if (service.toLowerCase() === 'roku') {
      group = ''; // No group title for Roku
    } 

    if (service.toLowerCase() === 'plex' && region === 'all' && regions && regions.length > 0) {
      regions.forEach(regionCode => {
        const regionFullName = regionNameMap[regionCode] || regionCode.toUpperCase();

        if (!channel.license_url && (!include.length || include.includes(channelId)) && !exclude.includes(channelId)) {
          let chno = '';
          if (startChno !== null) {
            chno = ` tvg-chno="${startChno}"`;
            startChno++;
          } else if (channel.chno) {
            chno = ` tvg-chno="${channel.chno}"`;
          }

          output += `#EXTINF:-1 channel-id="${channelId}" tvg-id="${key}" tvg-logo="${logo}" group-title="${regionFullName}"${chno},${name}\n${url}\n`;
        }
      });
    } else {
      if ((service.toLowerCase() === 'samsungtvplus' || service.toLowerCase() === 'plutotv') && region === 'all' && channel.region) {
        group = channel.region;
      } else if (region === 'all' && channel.region) {
        const regionCode = channel.region ? channel.region.toUpperCase() : '';
        if (regionCode) {
          group += ` (${regionCode})`;
        }
      }

      if (!channel.license_url && (!include.length || include.includes(channelId)) && !exclude.includes(channelId)) {
        let chno = '';
        if (startChno !== null) {
          chno = ` tvg-chno="${startChno}"`;
          startChno++;
        } else if (channel.chno) {
          chno = ` tvg-chno="${channel.chno}"`;
        }

        output += `#EXTINF:-1 channel-id="${channelId}" tvg-id="${key}" tvg-logo="${logo}" group-title="${group}"${chno},${name}\n${url}\n`;
      }
    }
  });

  return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.TEXT);
}

function checkCache(service) {
  const folder = DriveApp.getFolderById('1rsEllB18ceRdHvBvumwSpyPg3fnZFxo1');
  const files = folder.getFilesByName(`${service}_cache.json`);
  if (files.hasNext()) {
    const file = files.next();
    const lastUpdated = new Date(file.getLastUpdated()).getTime();
    const now = new Date().getTime();

    if (now - lastUpdated < 7200000) {  // 2 hours = 7200000 milliseconds
      return file.getId();
    } else {
      file.setTrashed(true); // Trash old cache file
    }
  }
  return null;
}

function saveJsonToDrive(data, service) {
  const jsonString = JSON.stringify(data);
  const fileName = `${service}_cache.json`;
  const folder = DriveApp.getFolderById('1rsEllB18ceRdHvBvumwSpyPg3fnZFxo1');
  const file = folder.createFile(fileName, jsonString, MimeType.PLAIN_TEXT);
  return file.getId(); // Return file ID for future reference
}

function retrieveJsonFromDrive(fileId) {
  const file = DriveApp.getFileById(fileId);
  const jsonString = file.getBlob().getDataAsString();
  return JSON.parse(jsonString);
}

function formatPbsDataForM3U8(data) {
  let output = '#EXTM3U x-tvg-url="https://github.com/matthuisman/i.mjh.nz/raw/master/PBS/all.xml.gz"\n';

  Object.keys(data.channels).forEach(key => {
    const channel = data.channels[key];
    output += '#EXTINF:-1 channel-id="pbs-' + key + '" tvg-id="' + key + '" tvg-logo="' + channel.logo + '", ' + channel.name + '\n';
    output += '#KODIPROP:inputstream.adaptive.manifest_type=mpd\n';
    output += '#KODIPROP:inputstream.adaptive.license_type=com.widevine.alpha\n';
    output += '#KODIPROP:inputstream.adaptive.license_key=' + channel.license + '|Content-Type=application%2Foctet-stream&user-agent=okhttp%2F4.9.0|R{SSM}|\n';
    output += channel.url + '|user-agent=okhttp%2F4.9.0\n';
  });

  return output;
}

