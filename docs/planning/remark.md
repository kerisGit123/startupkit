So Suno (which Kie uses under the hood) does support covers of existing songs — the 413 error you got is specifically for commercially copyrighted songs. It's not blocking all covers, just known published tracks.

For your flow, here's what actually works:

What you CAN cover:

Your own original songs
AI-generated songs from Kie/Suno
Voice memos / demos you recorded
Independent/unsigned music
What gets blocked (413):

Known commercial releases (like 寂寞寂寞就好)
Songs that match Suno's audio fingerprint database
Your best workflow with persona:

Generate Music → write your own lyrics, get an original AI song
Create Persona → extract the voice you like
Cover Song → upload a different AI-generated song or your own recording → persona re-sings it
Or if you want a specific existing song's melody:

ecord yourself humming/singing the melody (even badly — just the tune)
Cover Song → upload your recording + persona + lyrics → AI re-creates it with persona's voice
The humming/recording approach bypasses the copyright filter since it's your own audio, but the AI still picks up the melody structure.


That error means Kie's content filter detected your uploaded WAV matches a copyrighted song. Kie blocks covers of known commercial tracks.

This is a Kie AI policy — not a bug in our code. They use audio fingerprinting to detect copyrighted material.

What you can do:

Use original/independent songs — songs you or someone else created (not commercially released)
Use AI-generated songs — generate a song with AI Music first, then use Cover Song on that
Modify the audio first — change the key, tempo, or arrangement enough that it doesn't match the fingerprint (not guaranteed to work)
So for your flow with persona:

Generate Music with the lyrics you want → get an original AI song
Create Persona from a voice you like
Cover Song that AI-generated song with your persona → this will work because it's not copyrighted
The 413 error will always happen with well-known commercial songs like 寂寞寂寞就好 (JJ Lin / 林俊傑). Kie won't allow it







the cover song we created only for a section of song. should we 





{"audioWeight":0.5,"callBackUrl":"https://context-soon-trainers-dude.trycloudflare.com/api/kie-callback?fileId=s977nfksnzrryan4htppza3t7n85ax0z","customMode":true,"instrumental":false,"model":"V4","personaId":"5866e09866fde44c7cfdeceaf241b366","personaModel":"style_persona","prompt":"[Verse 1]\n還是原來那個我 不過流掉幾公升淚所以變瘦\n對著鏡子我承諾 遲早我會還這張臉一堆笑容 [Pre-Chorus]\n不算什麼 愛錯就愛錯\n早點認錯 早一點解脫 [Chorus]\n我寂寞寂寞就好 這時候誰都別來安慰擁抱\n就讓我一個人去痛到受不了 想到快瘋掉\n死不了就還好 我寂寞寂寞就好 你真的不用來我回憶裡微笑\n我就不相信我會笨到忘不了 賴著不放掉\n人本來就寂寞的 借來的都該還掉\n我總會把你戒掉 [Verse 2]\n還是原來那個你 是我自己做夢你有改變什麼\n再多的愛也沒用 每個人有每個人的業障因果 [Pre-Chorus]\n會有什麼 什麼都沒有\n早點看破 才看得見以後 [Chorus]\n我寂寞寂寞就好 這時候誰都別來安慰擁抱\n就讓我一個人去痛到受不了 想到快瘋掉\n死不了就還好 我寂寞寂寞就好 你真的不用來我回憶裡微笑\n我就不相信我會笨到忘不了 賴著不放掉\n人本來就寂寞的 我總會把你戒掉","style":"Pop, Balled","styleWeight":0.5,"title":"寂寞寂寞就好","uploadUrl":"https://pub-253ddb7b6dfa40a8a026dc16b8546f84.r2.dev/user_3CFIfm0kkPdgvs69to7ij57qv9n/uploaded/1776794866009-i67arc6zxun.wav","vocalGender":"m","weirdnessConstraint":0.5}



{"audioId":"0e98eabe-d01e-45e6-9086-086d590aac5e","callBackUrl":"https://context-soon-trainers-dude.trycloudflare.com/api/kie-callback?fileId=s970d2jy37f6dh1ckexwdppdgx85agpr","continueAt":5,"defaultParamFlag":true,"model":"V4","personaId":"5866e09866fde44c7cfdeceaf241b366","personaModel":"style_persona","prompt":"[Verse 1] 星光洒落在窗前 你的影子还在眼前 那些温柔的从前 像风一样飘远 [Chorus] 我看着满天的星 每一颗都是你的名 可是你已经离去 留下我一个人叹息 [Verse 2] 月亮弯弯像你的眉 我的泪水悄悄在飞 曾经说好的永远 变成了再也不见 [Bridge] 如果时光能倒流 我会紧紧握住你的手 不让你走 [Chorus] 我看着满天的星 每一颗都是你的名 可是你已经离去 留下我一个人叹息 [Outro] 星光慢慢暗了 像我们的故事 慢慢远了...","style":"Rock, Soul","title":"star final"}



{"callBackUrl":"https://context-soon-trainers-dude.trycloudflare.com/api/kie-callback?fileId=s9709d7mwz075rfh6zfy559c7x85ak6j","customMode":false,"instrumental":false,"model":"V4","negativeTags":"custom","prompt":"[Verse 1]小企鹅，胖嘟嘟妈妈说不许走太远他摇摇头，我不听滑着肚子就溜走\n[Chorus]不听话，不听话小企鹅不听话扑通一声掉进坑哭着喊妈妈\n[Verse 2]冰好滑，坑好深小企鹅爬不上来他小声说，对不起妈妈我再也不敢啦\n[Chorus]不听话，不听话小企鹅不听话扑通一声掉进坑哭着喊妈妈\n[Outro]妈妈来了，抱紧紧小企鹅笑了下次一定乖乖的真的真的啦","style":"Rock, Soul","title":"penguil male","uploadUrl":"https://pub-253ddb7b6dfa40a8a026dc16b8546f84.r2.dev/user_3CFIfm0kkPdgvs69to7ij57qv9n/generated/ai-music-1776766647974-v2.mp3","vocalGender":"0.6"}


so do you think you done most of it ?