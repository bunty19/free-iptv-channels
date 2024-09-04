function doGet(e) {
  const params = e.parameter;
  const region = (params.region || 'us').toLowerCase().trim();
  const service = params.service;

  // Check if the service parameter is missing
  if (!service) {
    return ContentService.createTextOutput('Error: No service type provided').setMimeType(ContentService.MimeType.TEXT);
  }

  const APP_URL = 'https://i.mjh.nz/' + service + '/.app.json';
  const response = UrlFetchApp.fetch(APP_URL);
  const data = JSON.parse(response.getContentText());

  if (service.toLowerCase() === 'pbs') {
    return ContentService.createTextOutput(formatPbsDataForM3U8(data))
      .setMimeType(ContentService.MimeType.TEXT);
  }

  let channels = {};
  let groupExtractionRequired = false;
  let regionNames = {}; // For Plex, to map region codes to full names

  // Map of region codes to full names for Plex
  const regionNameMap = {
    us: "USA",
    mx: "Mexico",
    es: "Spain",
    ca: "Canada",
    au: "Australia",
    nz: "New Zealand"
  };

  if (data.channels) {
    // Channels are directly in the data object, and group extraction is needed
    channels = data.channels;

    // Plex-specific region filtering logic
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
    // Channels are inside regions, no special group extraction needed
    const regions = data.regions;

    // Populate regionNames for Plex using the provided map
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
    output = `#EXTM3U url-tvg="https://github.com/matthuisman/i.mjh.nz/raw/master/roku/all.xml.gz"\n`;
  }

  const sortedKeys = Object.keys(channels).sort((a, b) => {
    const chA = channels[a];
    const chB = channels[b];
    return chA.name.localeCompare(chB.name); 
  });

  sortedKeys.forEach(key => {
    const channel = channels[key];
    const { logo, name, url, regions } = channel; // Extract regions from channel
    const channelId = `${service}-${key}`;

    // If group extraction is required (channels are outside regions), use the first group from the groups array
    let group = groupExtractionRequired
      ? (channel.groups && channel.groups.length > 0 ? channel.groups[0] : regionNameMap[region] || region.toUpperCase())
      : (channel.group || regionNameMap[region] || region.toUpperCase());
	  
	// Add this condition to remove the group title for Roku
	if (service.toLowerCase() === 'roku') {
	  group = ''; // No group title for Roku
	}

    // Handle group-title for Plex
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
      // Handle group-title for SamsungTVPlus and PlutoTV when region is "all"
      if ((service.toLowerCase() === 'samsungtvplus' || service.toLowerCase() === 'plutotv') && region === 'all' && channel.region) {
        group = channel.region;  // Set group-title to region name only
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
