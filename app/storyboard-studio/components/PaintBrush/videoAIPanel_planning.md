change this to a selectionbox but same design like pic1. for the VideoAIPanel. imagine this is a VideoAIPanel like https://app.ltx.studio/ .pic2 it take reference image and element ( element are the Save characters, props, products, or places you want to reuse, and enhance their consistency throughout this project.  ). pic3 is LTX VideoAIPanel. change my stile to suit like pic3. pic4 is my original VideoAIPanel. see how you can use style like ltx . especially usee their upload video pic5 is correct , remain that , add 2 more upload , add start frame pic6 and add end frame pic7, write a planning to videoAIPanel. for this i will have multiple type e.g. image to video , Lips Sync . image to video im using kling-3.0/video  Pricing: Standard: no-audio 20 credits ($0.1) /s ; with audio 30 credits ($0.15)/s;  



veo-3-1
https://docs.kie.ai/veo3-api/generate-veo-3-video
Pricing: Fast mode (text-to-video / image-to-video / reference-to-video): 120 credits per video (≈ $0.30) 

veo-3-1
it has start Frame and end Frame


i can text to video o
image to Video
Reference to Video

16:9 and 9:16 outputs. Auto mode
1080P and 4K outputs
4k 2x credits



Pro:  no-audio 27 credits ($0.135) / s; with audio 40 credits ($0.2)/s  https://kie.ai/kling-3-0,  wan/2-6-image-to-video https://kie.ai/wan-2-6?model=wan%2F2-6-image-to-video , grok-imagine/image-to-video https://kie.ai/grok-imagine?model=grok-imagine%2Fimage-to-video  Pricing: 6s — 480p: 10 credits ($0.05) | 720p: 20 credits ($0.10)
10s — 480p: 20 credits ($0.10) | 720p: 30 credits ($0.15)
15s — 480p: 30 credits ($0.15) | 720p: 40 credits ($0.20)







wan/2-6-image-to-video

https://kie.ai/wan-2-6?model=wan%2F2-6-image-to-video

Pricing: 
100 / 200 / 300 credits (~$0.35 / $0.70 / $1.05) for 5 / 10 / 15 s at 720 p 
and 150 / 250 / 400 credits (~$0.53 / $1.05 / $1.58) for 5 / 10 / 15 s at 1080 p — 





kling-3.0/video

https://kie.ai/kling-3-0


Pricing: Standard: no-audio 20 credits ($0.1) /s ; with audio 30 credits ($0.15)/s;  
Pro:  no-audio 27 credits ($0.135) / s; with audio 40 credits ($0.2)/s






lip sync
kling/ai-avatar-standard
https://kie.ai/kling-ai-avatar



const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'kling/ai-avatar-standard',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "image_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/17579268936223zs9l3dt.png",
      "audio_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/17579258340109gghun47.mp3"
    }
  })
});

const result = await response.json();
console.log(result);