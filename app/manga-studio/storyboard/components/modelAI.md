https://kie.ai/market



// Model definition with credits
{ value: "recraft/crisp-upscale", label: "🎨 Recraft Crisp", sub: "AI Upscale 1 credit", credits: 1 }

// Dynamic credit calculation
const getSelectedModelCredits = () => {
  const selected = inpaintModelOptions.find(m => m.value === model);
  return selected?.credits || credits;
};

// Updated button
<span>✦ {getSelectedModelCredits()}</span>

Complete Reference Image Limits by Tool Type:

Text-to-Image Models (0 reference images):

🟦 GPT Image 1.5 Text: maxReferenceImages: 0
🟩 Nano Banana Edit: maxReferenceImages: 0
🟡 Flux 2 Flex: maxReferenceImages: 0
🟠 Qwen Image Edit: maxReferenceImages: 0
Image-to-Image Models (various reference limits):

🔥 Flux 2 Pro: maxReferenceImages: 7
🟡 Flux 2 Flex: maxReferenceImages: 7
🟩 Nano Banana 2: maxReferenceImages: 13
🟣 Ideogram Remix: maxReferenceImages: 4
🟦 GPT Image 1.5: maxReferenceImages: 15 (highest)
Upscale Models (0 reference images):

🎨 Recraft Crisp: maxReferenceImages: 0
💎 Topaz Upscale: maxReferenceImages: 0


{ 
  value: "model-name", 
  label: "🎨 Model Name", 
  sub: "Description • X credits", 
  credits: X, 
  maxReferenceImages: Y 
}
----------------------------------------------


call back next time :


Upscale
1 credit


recraft/crisp-upscale





const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'recraft/crisp-upscale',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "image": "https://file.aiquickdraw.com/custom-page/akr/section-images/1757169577325ijj8vwvt.jpg"
    }
  })
});

const result = await response.json();
console.log(result);






callBackUrl
Optional
string
Callback URL for task completion notifications. Optional parameter. If provided, the system will send POST requests to this URL when the task completes (success or failure). If not provided, no callback notifications will be sent.

Example:

"https://your-domain.com/api/callback"

------------------


topaz/image-upscale
20 credit


const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'recraft/crisp-upscale',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "image": "https://file.aiquickdraw.com/custom-page/akr/section-images/1757169577325ijj8vwvt.jpg"
    }
  })
});

const result = await response.json();
console.log(result);




callBackUrl
Optional
string
Callback URL for task completion notifications. Optional parameter. If provided, the system will send POST requests to this URL when the task completes (success or failure). If not provided, no callback notifications will be sent.

Example:

"https://your-domain.com/api/callback"
-----------------------------------


add nano banana2 - nano-banana-2
36 credit
aspect ratio 1:1


const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'nano-banana-2',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "translation of all the text to Hindi.",
      "image_input": [
        "https://static.aiquickdraw.com/tools/example/1772164675129_TZfXY2Sn.png"
      ],
      "aspect_ratio": "auto",
      "google_search": false,
      "resolution": "1K",
      "output_format": "jpg"
    }
  })
});

const result = await response.json();
console.log(result);



qwen/image-edit
aspect ratio : Square HD



ideogram/character-remix
aspect ratio : Square HD
reference image upto 4 image


nano-banana-2
aspect ratio : 1:1


flux-2/flex-image-to-image
aspect ratio : 1:1
reference image upto 7 image.







-----------------------------------




flux-2/flex-image-to-image
15 credits

aspect ratio : 1:1
reference image upto 7 image.


input.aspect_ratio
Optional
string
Aspect ratio of the generated image

Available options:

1:1
-
1:1
auto-Auto

const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'flux-2/flex-image-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "input_urls": [
        "https://static.aiquickdraw.com/tools/example/1764235158281_tABmx723.png",
        "https://static.aiquickdraw.com/tools/example/1764235165079_8fIR5MEF.png"
      ],
      "prompt": "Replace the can in image 2 with the can from image 1",
      "aspect_ratio": "1:1",
      "resolution": "1K"
    }
  })
});

const result = await response.json();
console.log(result);



-----------------------------------



add ideogram/character-remix
40 credits

ideogram/character-remix
aspect ratio : 1:1
reference image upto 4 image.


input.aspect_ratio
Optional
string
Aspect ratio of the generated image

Available options:

square_hd
-
Square HD



const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'ideogram/character-remix',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "A fisheye lens selfie photograph taken at night on an urban street. The image is circular with a black border and shows a person wearing dark sunglasses and a black jacket, holding a silver digital camera up to capture the reflection. The background shows a row of shuttered storefronts with red neon lighting visible in the upper portion. The street is empty and dark, with street lights creating a warm glow along the sidewalk. The fisheye effect creates a curved, distorted perspective that bends the straight lines of the street and buildings. The lighting is predominantly red and dark, creating a moody urban atmosphere. The person's reflection shows long dark hair and is positioned in the center of the circular frame. Multiple storefront shutters are visible in the background, creating a repeating pattern of horizontal lines. The overall composition has a cinematic quality with strong contrast between the dark street and the illuminated storefronts above.",
      "image_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1755768466167d0tiuc6e.webp",
      "reference_image_urls": [
        "https://file.aiquickdraw.com/custom-page/akr/section-images/1755768479029sugx0g6f.webp"
      ],
      "rendering_speed": "BALANCED",
      "style": "AUTO",
      "expand_prompt": true,
      "image_size": "square_hd",
      "num_images": "1",
      "strength": 0.8
    }
  })
});

const result = await response.json();
console.log(result);

*************************************************************



qwen/image-edit

ideogram/character-remix
aspect ratio : 1:1
reference image upto 4 image.


input.aspect_ratio
Optional
string
Aspect ratio of the generated image

Available options:

square_hd
-
Square HD



const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'ideogram/character-remix',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "A fisheye lens selfie photograph taken at night on an urban street. The image is circular with a black border and shows a person wearing dark sunglasses and a black jacket, holding a silver digital camera up to capture the reflection. The background shows a row of shuttered storefronts with red neon lighting visible in the upper portion. The street is empty and dark, with street lights creating a warm glow along the sidewalk. The fisheye effect creates a curved, distorted perspective that bends the straight lines of the street and buildings. The lighting is predominantly red and dark, creating a moody urban atmosphere. The person's reflection shows long dark hair and is positioned in the center of the circular frame. Multiple storefront shutters are visible in the background, creating a repeating pattern of horizontal lines. The overall composition has a cinematic quality with strong contrast between the dark street and the illuminated storefronts above.",
      "image_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1755768466167d0tiuc6e.webp",
      "reference_image_urls": [
        "https://file.aiquickdraw.com/custom-page/akr/section-images/1755768479029sugx0g6f.webp"
      ],
      "rendering_speed": "BALANCED",
      "style": "AUTO",
      "expand_prompt": true,
      "image_size": "square_hd",
      "num_images": "1",
      "strength": 0.8
    }
  })
});

const result = await response.json();
console.log(result);












-----------------------------------


gpt-image/1.5-text-to-image
8 credit

input.aspect_ratio
Required
string
Width-height ratio of the image, determining its visual form.

Available options:

1:1
-
1:1
-
1:1

const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'gpt-image/1.5-text-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "Create a photorealistic candid photograph of an elderly sailor standing on a small fishing boat.  He has weathered skin with visible wrinkles, pores, and sun texture, and a few faded traditional sailor tattoos on his arms. He is calmly adjusting a net while his dog sits nearby on the deck. Shot like a 35mm film photograph, medium close-up at eye level, using a 50mm lens. The image should feel honest and unposed, with real skin texture, worn materials, and everyday detail. No glamorization, no heavy retouching. ",
      "aspect_ratio": "3:2",
      "quality": "medium"
    }
  })
});

const result = await response.json();
console.log(result);



-----------------------------------

google/nano-banana-edit
8 credits

input.image_size
Optional
string
Radio description

Available options:

1:1
-
1:1
9:16
-
9:16
16:9
-
16:9
3:4
-
3:4
4:3
-
4:3
3:2
-
3:2
2:3
-
2:3
5:4
-
5:4
4:5
-
4:5
21:9
-
21:9
auto
-
auto

const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'google/nano-banana-edit',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "turn this photo into a character figure. Behind it, place a box with the character’s image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. set the scene indoors if possible",
      "image_urls": [
        "https://file.aiquickdraw.com/custom-page/akr/section-images/1756223420389w8xa2jfe.png"
      ],
      "output_format": "png",
      "image_size": "1:1"
    }
  })
});

const result = await response.json();
console.log(result);
-----------------------------------



flux-2/flex-text-to-image
40 credit

input.aspect_ratio
Required
string
Aspect ratio for the generated image. Select 'auto' to match the first input image ratio (requires input image).

Available options:

1:1
-
1:1 (Square)



const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'flux-2/flex-text-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "A humanoid figure with a vintage television set for a head, featuring a green-tinted screen displaying a `Hello FLUX.2` writing in ASCII font. The figure is wearing a yellow raincoat, and there are various wires and components attached to the television. The background is cloudy and indistinct, suggesting an outdoor setting",
      "aspect_ratio": "1:1",
      "resolution": "1K"
    }
  })
});

const result = await response.json();
console.log(result);



-----------------------------------

qwen/image-edit

10 credit

input.image_size
Optional
string
The size of the generated image. Default value: landscape_4_3

Available options:

square
-
Square
square_hd
-
Square HD



const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'qwen/image-edit',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "image_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1755603225969i6j87xnw.jpg",
      "acceleration": "none",
      "image_size": "landscape_4_3",
      "num_inference_steps": 25,
      "guidance_scale": 4,
      "sync_mode": false,
      "enable_safety_checker": true,
      "output_format": "png",
      "negative_prompt": "blurry, ugly"
    }
  })
});

const result = await response.json();
console.log(result);




******************************************************
gpt-image/1.5-image-to-image

45 credits



input.aspect_ratio
Required
string
Width-height ratio of the image, determining its visual form.

Available options:

1:1
-
1:1

const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'gpt-image/1.5-image-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "input_urls": [
        "https://static.aiquickdraw.com/tools/example/1765962794374_GhtqB9oX.webp"
      ],
      "prompt": "Change her clothing to an elegant blue evening gown. Preserve her face, identity, hairstyle, pose, body shape, background, lighting, and camera angle exactly as in the original image.",
      "aspect_ratio": "3:2",
      "quality": "medium"
    }
  })
});

const result = await response.json();
console.log(result);




-----------------------------------

flux-2/flex-image-to-image
reference image 7 
credits = 30


input.aspect_ratio
Required
string
Aspect ratio for the generated image. Select 'auto' to match the first input image ratio (requires input image).

Available options:
1:1
-
1:1 (Square)

uto
-
Auto (Based on first input image)

input.resolution
Required
string
Output image resolution.

Available options:

1K
-
1K
2K
-
2K
Example:

"1K"

const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'flux-2/flex-image-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "input_urls": [
        "https://static.aiquickdraw.com/tools/example/1764235158281_tABmx723.png",
        "https://static.aiquickdraw.com/tools/example/1764235165079_8fIR5MEF.png"
      ],
      "prompt": "Replace the can in image 2 with the can from image 1",
      "aspect_ratio": "1:1",
      "resolution": "1K"
    }
  })
});

const result = await response.json();
console.log(result);








-----------------------------------


flux-2/pro-image-to-image
maxReferenceImages: 7

credits = 15


input.aspect_ratio
Required
string
Aspect ratio for the generated image. Select 'auto' to match the first input image ratio (requires input image).

Available options:

1:1
-
1:1 (Square)
4:3
-
4:3 (Landscape)
3:4
-
3:4 (Portrait)
16:9
-
16:9 (Widescreen)
9:16
-
9:16 (Vertical)
3:2
-
3:2 (Classic)
2:3
-
2:3 (Classic Portrait)
auto
-
Auto (Based on first input image)
Example:

"4:3"

const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'flux-2/pro-image-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "input_urls": [
        "https://static.aiquickdraw.com/tools/example/1767778229847_vlvnwO6j.png",
        "https://static.aiquickdraw.com/tools/example/1767778235468_hdL7eCh2.png"
      ],
      "prompt": "Change the man into the outfit shown in picture two, full-body photo.",
      "aspect_ratio": "4:3",
      "resolution": "1K"
    }
  })
});

const result = await response.json();
console.log(result);




-----------------------------------
nano-banana-2

maxReferenceImages: 13

input.aspect_ratio
Optional
string
Aspect ratio of the generated image

Available options:

1:1
-
1:1
auto
-
Auto

const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'nano-banana-2',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "translation of all the text to Hindi.",
      "image_input": [
        "https://static.aiquickdraw.com/tools/example/1772164675129_TZfXY2Sn.png"
      ],
      "aspect_ratio": "auto",
      "google_search": false,
      "resolution": "1K",
      "output_format": "jpg"
    }
  })
});

const result = await response.json();
console.log(result);

-----------------------------------

ideogram/character-remix
maxReferenceImages: 4
credit 40





input.image_size
Optional
string
Select description

Available options:

square
-
Square
square_hd
-
Square HD

const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'ideogram/character-remix',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "A fisheye lens selfie photograph taken at night on an urban street. The image is circular with a black border and shows a person wearing dark sunglasses and a black jacket, holding a silver digital camera up to capture the reflection. The background shows a row of shuttered storefronts with red neon lighting visible in the upper portion. The street is empty and dark, with street lights creating a warm glow along the sidewalk. The fisheye effect creates a curved, distorted perspective that bends the straight lines of the street and buildings. The lighting is predominantly red and dark, creating a moody urban atmosphere. The person's reflection shows long dark hair and is positioned in the center of the circular frame. Multiple storefront shutters are visible in the background, creating a repeating pattern of horizontal lines. The overall composition has a cinematic quality with strong contrast between the dark street and the illuminated storefronts above.",
      "image_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1755768466167d0tiuc6e.webp",
      "reference_image_urls": [
        "https://file.aiquickdraw.com/custom-page/akr/section-images/1755768479029sugx0g6f.webp"
      ],
      "rendering_speed": "BALANCED",
      "style": "AUTO",
      "expand_prompt": true,
      "image_size": "square_hd",
      "num_images": "1",
      "strength": 0.8
    }
  })
});

const result = await response.json();
console.log(result);


*******************************************************************

nano-banana-2

maxReferenceImages: 13
credit : 40

2k , png

input.aspect_ratio
Optional
string
Aspect ratio of the generated image

Available options:

1:1
-
1:1
4:3
-
4:3
3:4
-
3:4

9:16
-
9:16
16:9
-
16:9
auto
-
Auto

input.google_search
Optional
boolean
Use Google Web Search grounding to generate images based on real-time information

Boolean value (true/false)
Example:

false


input.resolution
Optional
string
Resolution of the generated image. Higher resolutions take longer to generate.

Available options:

1K
-
1K
2K
-
2K
4K
-
4K


input.output_format
Optional
string
Format of the output image

Available options:

jpg
-
JPG
png
-
PNG


const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'nano-banana-2',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "translation of all the text to Hindi.",
      "image_input": [
        "https://static.aiquickdraw.com/tools/example/1772164675129_TZfXY2Sn.png"
      ],
      "aspect_ratio": "auto",
      "google_search": false,
      "resolution": "1K",
      "output_format": "jpg"
    }
  })
});

const result = await response.json();
console.log(result);



-----------------------------------

seedream/5-lite-image-to-image

credit :10
maxReferenceImages: 13


input.aspect_ratio
Required
string
Width-height ratio of the image, determining its visual form.

Available options:

1:1
-
1:1
4:3
-
4:3
3:4
-
3:4
9:16
-
9:16
16:9
-
16:9

input.quality
Required
string
Basic outputs 2K images, while High outputs 3K images.

Available options:

basic
-
Basic
high
-
High

const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'seedream/5-lite-image-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "Change the lighting effect to light spots",
      "image_urls": [
        "https://static.aiquickdraw.com/tools/example/1772015399360_taMCXESx.png"
      ],
      "aspect_ratio": "1:1",
      "quality": "basic"
    }
  })
});

const result = await response.json();
console.log(result);




-----------------------------------







