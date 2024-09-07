const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const params = parsedUrl.query;
  const region = (params.region || 'us').toLowerCase().trim();
  const service = params.service;

  if (parsedUrl.pathname === '/' && req.method === 'GET') {
    // Check if the service parameter is missing
    if (!service) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Error: No service type provided');
    }

    if (service.toLowerCase() === 'pbskids') {
      const pbsKidsOutput = await handlePBSKids();
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end(pbsKidsOutput);
    }

    const APP_URL = `https://i.mjh.nz/${service}/.app.json`;
    let data;
    try {
      data = await fetchJson(APP_URL);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('Error: Failed to fetch data');
    }

    if (service.toLowerCase() === 'pbs') {
      const pbsOutput = formatPbsDataForM3U8(data);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end(pbsOutput);
    }

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
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        return res.end(`Error: Invalid region ${region}`);
      }
    } else {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Error: Invalid data format');
    }

    const startChno = params.start_chno ? parseInt(params.start_chno) : null;
    const include = (params.include || '').split(',').filter(Boolean);
    const exclude = (params.exclude || '').split(',').filter(Boolean);

    let output = `#EXTM3U url-tvg="https://github.com/matthuisman/i.mjh.nz/raw/master/${service}/${region}.xml.gz"\n`;

    const sortedKeys = Object.keys(channels).sort((a, b) => channels[a].name.localeCompare(channels[b].name));

    sortedKeys.forEach(key => {
      const channel = channels[key];
      const { logo, name, url, regions } = channel;
      const channelId = `${service}-${key}`;

      let group = groupExtractionRequired
        ? (channel.groups && channel.groups.length > 0 ? channel.groups[0] : regionNameMap[region] || region.toUpperCase())
        : (channel.group || regionNameMap[region] || region.toUpperCase());

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
    });

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end(output);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Function to format PBS data for M3U8
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

// Function to handle PBS Kids
async function handlePBSKids() {
  const APP_URL = 'https://i.mjh.nz/PBS/.kids_app.json';
  const EPG_URL = 'https://github.com/matthuisman/i.mjh.nz/raw/master/PBS/kids_all.xml.gz';

  try {
    const data = await fetchJson(APP_URL);

    let output = `#EXTM3U url-tvg="${EPG_URL}"\n`;

    const sortedKeys = Object.keys(data.channels).sort((a, b) => {
      return data.channels[a].name.toLowerCase().localeCompare(data.channels[b].name.toLowerCase());
    });

    sortedKeys.forEach(key => {
      const channel = data.channels[key];
      output += `#EXTINF:-1 channel-id="pbskids-${key}" tvg-id="${key}" tvg-logo="${channel.logo}", ${channel.name}\n${channel.url}\n`;
    });

    return output;
  } catch (error) {
    return 'Error fetching PBS Kids data: ' + error.message;
  }
}

// Function to fetch JSON data using the built-in https module
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
