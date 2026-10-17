Add-Type -AssemblyName System.Speech

$Root = "C:\EnglishKids\audio\words"
New-Item -ItemType Directory -Force -Path $Root | Out-Null

$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(
  22050,
  [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
  [System.Speech.AudioFormat.AudioChannel]::Mono)

$syn = New-Object System.Speech.Synthesis.SpeechSynthesizer
$syn.SelectVoice("Microsoft Zira Desktop")

function SayWord($text, $path) {
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><prosody rate='-04%'>$text.</prosody></speak>"
  $syn.SetOutputToWaveFile($path, $fmt)
  try { $syn.SpeakSsml($ssml) } catch { $syn.Speak($text) }
  $syn.SetOutputToNull()
}

$words = @(
  'hello','goodbye','shake hands','play','please','thank you',
  'bag','pen','sharpener','pencil','ruler','pencil case','book','ball',
  'one','two','three','four','five','six','seven','eight','nine','ten',
  'ear','eye','hand','mouth','nose','face','hair','teeth',
  'salad','drum','guitar','piano','flute','hear','smell','touch','taste','see',
  'red','orange','yellow','green','blue','black',
  'father','mother','grandfather','grandmother','brother','sister',
  'bathroom','bedroom','garden','kitchen','living room',
  'star','square','triangle','circle','rectangle','camel','key','pyramid','sphinx','stone','king','queen','big','small',
  'port said','alexandria','cairo','luxor','aswan','kick','dig','swim','skip','throw','in','on','under','behind',
  'dentist','teacher','engineer','doctor','vet','firefighter','police officer',
  'sunny','cloudy','rainy','windy','hot','cold','window','rainbow','sky','sun','cloud','spring','winter','summer','fall',
  'purple','white','sweater','jacket','skirt','t-shirt','socks','pants','shoes','zipper',
  'bus','bicycle','car','astronaut','motorbike','truck','van','train','yacht','rocket','stop','go','cross','road',
  'elephant','snake','lion','monkey','jellyfish','ant','insect','octopus','fox','parrot','fish',
  'bed','man','nut','olive','umbrella','mat','egg','sea',
  'banana','apple','mango','guava','date','watermelon','fig','carrot','eggplant','cucumber','tea',
  'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty',
  'pound','clock','visit','restaurant','beach','stand','line','librarian','shout','trash','tour guide','museum',
  'food','yummy','hungry','sad','happy',
  'friends','board','desk','chair','grass','flower','tree','bird','butterfly',
  'parents','head','eyes','ears','tongue','arm','leg','foot','toe',
  'farm','cow','horse','duck','chicken','cheese','meat','eggs',
  'pets','cat','dog','turtle','jungle','tiger','giraffe',
  'saturday','sunday','monday','tuesday','wednesday','thursday','friday','week','before','after','dinner',
  'surprised','scared','warm',
  'january','february','march','april','may','june','july','august','september','october','november','december',
  'home','dining room','closet','couch','chairs','tv','fridge','oven','sink','toilet',
  'building','park','catch','animals','friend','share',
  'good morning','boy','girl','classroom','eraser','crayon','playground','swing','slide',
  'arms','hands','legs','feet','mower','fruits','chocolate','chips','juice','sandwich',
  'walk','run','jump','dress','trousers','shorts','cap','today','tomorrow','yesterday',
  'morning','noon','night','breakfast','lunch','get up','go to bed','go to school'
)

$made = 0
foreach ($w in $words) {
  $path = Join-Path $Root "$w.wav"
  if (Test-Path $path) { continue }
  SayWord $w $path
  $made++
}

$syn.Dispose()
"Generated $made new word files in $Root"
