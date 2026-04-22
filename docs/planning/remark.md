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