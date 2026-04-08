help me write the json files for the below 2 model 

if nano-banana-2 is 


Pricing: Nano Banana 2 — now just 8 credits ($0.04) for 1 K, 12 credits ($0.06) for 2 K, and 18 credits ($0.09) for 4 K, 

{"pricing":{"base_cost":18,"qualities":[{"name":"1K","cost":18},{"name":"2K","cost":18},{"name":"4K","cost":24}]}}


then what about below 2 model
kling-3.0/motion-control

with pricing 
Pricing: 20 credits/s ($0.1) for 720 p or 27 credits/s ($0.135) for 1080 p 

formula :
{
  "pricing": {
    "base_cost": 27,
    "qualities": [
      {
        "name": "720P",
        "cost": 20
      },
      {
        "name": "1080P",
        "cost": 27
      }
    ]
  }
}
create new function for  kling-3.0/motion-control :  getKlingMotionControl



bytedance/seedance-2

Pricing: Pricing: 480P — 11.5 credits/s ($0.0575/s, with video input) / 19 credits/s ($0.095/s, no video input); 720P — 25 credits/s ($0.125/s, with video input) / 41 credits/s ($0.205/s, no video input) 

{
  "pricing": {
    "unit": "credits_per_second",
    "base_cost": 11.5,
    "resolutions": {
      "480P": {
        "video_input": 11.5,
        "no_video": 19
      },
      "720P": {
        "video_input": 25,
        "no_video": 41
      }
    },
    "duration_rule": "total_duration = input_duration + output_duration"
  }
}



create new function for  bytedance/seedance-2 :  getSeedance20







