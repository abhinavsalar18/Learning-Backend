// proxy-config.mjs

import fetch from 'node-fetch';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

const proxyServer = 'http://172.31.100.14:3128'; // Replace with your proxy server and port
const proxyCredentials = 'edcguest:edcguest'; // Replace with your username and password

// Create the appropriate proxy agent for HTTP or HTTPS
const proxyAgent = proxyServer.startsWith('https://')
  ? new HttpsProxyAgent(proxyServer, {
      auth: proxyCredentials,
    })
  : new HttpProxyAgent(proxyServer, {
      auth: proxyCredentials,
    });

// Configure the proxy settings
globalThis.fetch = fetch;
globalThis.fetch.options = {
  agent: proxyAgent,
};
