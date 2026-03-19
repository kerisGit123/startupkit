// Simple test for n8n webhook callback
const http = require('http');

const testData = {
  "project_id": "sh72w66rr3sw5d2zndeewnskfs830fdg",
  "elements": {
    "characters": [
      {
        "name": "Dr. Elena Voss",
        "description": "Female oceanographer, early 40s, short dark hair",
        "confidence": 0.9,
        "type": "protagonist",
        "appearsInScenes": [2, 4, 5, 7]
      }
    ],
    "environments": [
      {
        "name": "Ocean Research Control Room",
        "description": "Control room at night with sonar monitors",
        "confidence": 0.8,
        "type": "research facility",
        "appearsInScenes": [2]
      }
    ],
    "props": [
      {
        "name": "Sonar Monitors",
        "description": "Equipment for detecting underwater signals",
        "confidence": 0.7,
        "type": "equipment",
        "appearsInScenes": [2]
      }
    ]
  },
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "The Deep Ocean",
      "duration": "5 seconds",
      "description": "Slow camera descent in the Pacific ocean abyss, particles drifting",
      "visualPrompt": "Deep Pacific ocean abyss, dark blue water fading into black",
      "elements": {
        "characters": [],
        "environments": [],
        "props": []
      }
    },
    {
      "sceneNumber": 2,
      "title": "The Strange Signal",
      "duration": "4 seconds",
      "description": "Scientists observe a waveform spike on sonar monitors",
      "visualPrompt": "Ocean research control room at night, multiple sonar monitors",
      "elements": {
        "characters": ["Dr. Elena Voss"],
        "environments": ["Ocean Research Control Room"],
        "props": ["Sonar Monitors"]
      }
    }
  ]
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/n8n-webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': 'n8n-webhook-secret-2024',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Testing n8n webhook callback...');
console.log('📊 Sending test data...');

const req = http.request(options, (res) => {
  console.log(`📡 Status: ${res.statusCode}`);
  console.log('📡 Headers:', res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ Response:', response);
    } catch (e) {
      console.log('📄 Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
});

req.write(postData);
req.end();

console.log('🎯 Request sent! Check your storyboard workspace for elements/scenes.');
