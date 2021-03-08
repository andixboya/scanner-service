const PROXY_CONFIG = [
  // used for ws handshacke
  {
    context: [
      "/negotiate?",
      "/connect?",
      "/start?",
      "/methods",
      // "/GetReaderBitmapImageByLightIndexAndPageIndex?",
      // "/GetTextFieldByTypeAndLCID?",
      // "/CheckReaderResultXml",
    ],
    "target": "http://localhost/",
    "secure": false,
    "logLevel": "debug",
    "changeOrigin": false,
    secure: false
  },
  {
    context: [
      "/fhir"
    ],
    "target": "http://localhost:8080",
    "secure": false,
    "logLevel": "debug",
    "changeOrigin": false,
    secure: false
  }
]

module.exports = PROXY_CONFIG;
