// Test script for n8n webhook with progress tracking
// Run this with: node test-webhook-progress.js

const webhookUrl = 'http://localhost:3000/api/n8n-webhook';
const webhookSecret = 'n8n-webhook-secret-2024';
const testProjectId = 'sh72w66rr3sw5d2zndeewnsk'; // This needs to be a valid Convex ID format

async function testProgressUpdates() {
  console.log('🧪 Testing n8n webhook progress updates...\n');

  const progressSteps = [
    { status: 'processing', message: 'Starting build process... (1/4)' },
    { status: 'processing', message: 'Calling n8n workflow... (2/4)' },
    { status: 'processing', message: 'Processing elements and scenes... (3/4)' },
    { status: 'processing', message: 'Generating frames... (4/4)' },
    { status: 'ready', message: 'Build completed successfully!' }
  ];

  for (const [index, step] of progressSteps.entries()) {
    console.log(`📊 Step ${index + 1}: ${step.message}`);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': webhookSecret
        },
        body: JSON.stringify({
          project_id: testProjectId,
          status: step.status,
          message: step.message,
          scriptType: 'ANIMATED_STORIES',
          language: 'en'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Success: ${result.message}`);
      } else {
        console.error(`❌ Error (${response.status}):`, result);
      }
    } catch (error) {
      console.error(`❌ Network error:`, error.message);
    }

    // Wait 1 second between updates to simulate real progress
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 Progress test completed!');
  console.log('📱 Check your storyboard workspace to see the progress bar in action!');
}

async function testFullCallback() {
  console.log('\n🎬 Testing full n8n callback with elements and scenes...\n');

  const mockData = {
    project_id: testProjectId,
    scriptType: 'ANIMATED_STORIES',
    language: 'en',
    buildStrategy: 'replace_all',
    elements: {
      characters: [
        {
          name: 'Captain Jack',
          description: 'Brave pirate captain',
          confidence: 0.95,
          type: 'character',
          appearsInScenes: [1, 2, 3]
        },
        {
          name: 'Kraken',
          description: 'Giant sea monster',
          confidence: 0.88,
          type: 'creature',
          appearsInScenes: [2, 3]
        }
      ],
      environments: [
        {
          name: 'Stormy Sea',
          description: 'Rough ocean waves',
          confidence: 0.92,
          type: 'environment',
          appearsInScenes: [1, 2, 3]
        },
        {
          name: 'Ancient Bridge',
          description: 'Old stone bridge',
          confidence: 0.85,
          type: 'environment',
          appearsInScenes: [3]
        }
      ],
      props: [
        {
          name: 'Treasure Chest',
          description: 'Wooden chest with gold',
          confidence: 0.90,
          type: 'prop',
          appearsInScenes: [1]
        }
      ]
    },
    scenes: [
      {
        sceneNumber: 1,
        title: 'The Discovery',
        duration: '5',
        description: 'Jack discovers a treasure map',
        visualPrompt: 'Pirate captain on ship deck holding ancient map, dramatic lighting',
        elements: {
          characters: ['Captain Jack'],
          environments: ['Stormy Sea'],
          props: ['Treasure Chest']
        }
      },
      {
        sceneNumber: 2,
        title: 'The Monster Appears',
        duration: '6',
        description: 'Kraken emerges from the depths',
        visualPrompt: 'Giant tentacles rising from stormy ocean, pirate ship in peril',
        elements: {
          characters: ['Captain Jack', 'Kraken'],
          environments: ['Stormy Sea'],
          props: []
        }
      },
      {
        sceneNumber: 3,
        title: 'The Bridge Collapse',
        duration: '7',
        description: 'Dramatic confrontation at ancient bridge',
        visualPrompt: 'Kraken destroying stone bridge, pirates escaping, epic destruction',
        elements: {
          characters: ['Captain Jack', 'Kraken'],
          environments: ['Stormy Sea', 'Ancient Bridge'],
          props: []
        }
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookSecret
      },
      body: JSON.stringify(mockData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Full callback success!');
      console.log('📊 Results:', JSON.stringify(result, null, 2));
    } else {
      console.error(`❌ Error (${response.status}):`, result);
    }
  } catch (error) {
    console.error(`❌ Network error:`, error.message);
  }
}

// Run tests
async function main() {
  console.log('🚀 Starting n8n webhook tests...\n');
  
  await testProgressUpdates();
  await testFullCallback();
  
  console.log('\n🏁 All tests completed!');
  console.log('💡 Tips:');
  console.log('   - Check your browser console for debug logs');
  console.log('   - Watch the progress bar update in real-time');
  console.log('   - Verify elements and scenes are saved correctly');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testProgressUpdates, testFullCallback };
