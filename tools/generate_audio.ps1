Add-Type -AssemblyName System.Speech

$Root = "C:\EnglishKids\audio"
if (Test-Path $Root) { Remove-Item -Recurse -Force $Root }
foreach ($d in @("letters","words","phrases","sentences","praise")) {
  New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null
}

$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(
  22050,
  [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
  [System.Speech.AudioFormat.AudioChannel]::Mono)

$syn = New-Object System.Speech.Synthesis.SpeechSynthesizer
$syn.SelectVoice("Microsoft Zira Desktop")

function SaySsml($body, $path) {
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>$body</speak>"
  $syn.SetOutputToWaveFile($path, $fmt)
  try { $syn.SpeakSsml($ssml) } catch { $syn.Speak($body) }
  $syn.SetOutputToNull()
}

# letter, example word, phonics approximation (stable for this voice)
$letters = @(
  @('A','Apple','ah'),   @('B','Ball','buh'),   @('C','Cat','kuh'),
  @('D','Dog','duh'),    @('E','Egg','eh'),     @('F','Fish','ffff'),
  @('G','Goat','guh'),   @('H','Hat','huh'),    @('I','Ice','eye'),
  @('J','Juice','juh'),  @('K','Kite','kuh'),   @('L','Lion','llll'),
  @('M','Monkey','mmm'), @('N','Nest','nnn'),   @('O','Orange','awe'),
  @('P','Pig','puh'),    @('Q','Queen','kwuh'), @('R','Rabbit','rrr'),
  @('S','Sun','sss'),    @('T','Tiger','tuh'),  @('U','Umbrella','uh'),
  @('V','Van','vvv'),    @('W','Water','wuh'),  @('X','Fox','ks'),
  @('Y','Yo-yo','yuh'),  @('Z','Zebra','zzz')
)

foreach ($l in $letters) {
  $ch = $l[0]; $word = $l[1]; $sound = $l[2]
  SaySsml "<prosody rate='-06%'>$ch.</prosody>" (Join-Path $Root "letters\${ch}_name.wav")
  SaySsml "<prosody rate='-22%'>$sound</prosody>" (Join-Path $Root "letters\${ch}_sound.wav")
  SaySsml "<prosody rate='-04%'>$word.</prosody>" (Join-Path $Root "letters\${ch}_word.wav")
  $full = "<prosody rate='-08%'>$ch.</prosody><break time='300ms'/><prosody rate='-20%'>$ch says $sound.</prosody><break time='260ms'/><prosody rate='-03%'>$word.</prosody>"
  SaySsml $full (Join-Path $Root "letters\${ch}_full.wav")
}

# base + Egyptian curriculum words (deduped)
$words = @(
 'cat','dog','sun','ball','fish','star','tree','book','milk','cake','bird','moon','apple','car','house','flower','banana','rabbit','table','water',
 'hello','bye','red','blue','yellow','green','doll','one','two','three','mom','dad','eye','nose','mouth','yes','no',
 'pen','pencil','bag','door','window','chair','teacher','student','father','mother','brother','sister','cow','horse','sheep','frog','eat','drink','run','jump','sleep','happy',
 'morning','evening','today','weather','rain','cold','hot','wind','kitchen','bedroom','bathroom','garden','bread','egg','cheese','chicken','rice','orange','grapes','watermelon','under',
 'doctor','farmer','baker','policeman','nurse','tomato','potato','carrot','onion','cucumber','football','tennis','swimming','basketball','pizza','tea','meat','lunch','breakfast','cartoon','play','read',
 'school','class','subject','english','math','science','art','music','shop','street','hospital','station','mosque','church','sad','angry','tired','brave','helpful','beautiful','small',
 'trip','sea','river','beach','mountain','desert','camel','pyramid','museum','zoo','yesterday','visit','wonderful','delicious','interesting','holiday','swim','travel','watch','played',
 'health','medicine','tooth','temperature','headache','future','plan','homework','project','group','important','easy','difficult','famous','inventor','computer','internet','email','message','camera','engineer','pilot',
 'achievement','challenge','success','skill','knowledge','culture','tourist','guide','explain','suggest','compare','decision','journey','adventure','explore','experience','improve','practice','performance','confidence','respect','friendly',
 'opinion','argument','reason','result','advice','responsibility','environment','pollution','climate','technology','education','opportunity','effort','encourage','participate','organize','present','discuss','ambition','research','social','cooperation',
 # grade-1 curriculum (Connect Primary 1 - Term 1 & Term 2)
 'goodbye','shake hands','please','thank you','sharpener','pencil case','ruler','salad','drum','guitar','piano','flute','hear','smell','touch','taste','eight','nine','ten','black','grandfather','grandmother','living room','star','square','triangle','circle','rectangle','key','sphinx','stone','king','queen','big','port said','alexandria','cairo','luxor','aswan','kick','dig','skip','throw','in','on','behind',
 'dentist','vet','firefighter','police officer','sunny','cloudy','rainy','windy','cold','rainbow','sky','sun','cloud','spring','winter','summer','fall','purple','white','sweater','jacket','skirt','t-shirt','socks','pants','shoes','zipper',
 'bus','bicycle','astronaut','motorbike','truck','van','train','yacht','rocket','stop','go','cross','road','elephant','snake','lion','monkey','jellyfish','ant','insect','octopus','fox','parrot','bed','man','nut','olive','umbrella','mat',
 'mango','guava','date','fig','eggplant','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','pound','clock','restaurant','librarian','shout','trash','tour guide','food','yummy','hungry'
)
$words = $words | Sort-Object -Unique
foreach ($w in $words) { SaySsml "<prosody rate='-04%'>$w.</prosody>" (Join-Path $Root "words\$w.wav") }

$phrases = @('Good morning','Good night','Thank you','You are welcome','How are you','I am fine','My name is','I love you','Excuse me','See you later','Good luck','Happy birthday')
for ($i=0; $i -lt $phrases.Count; $i++) { SaySsml "<prosody rate='-06%'>$($phrases[$i]).</prosody>" (Join-Path $Root "phrases\$i.wav") }

$sentences = @(
 'I like to play football',
 'My favorite color is blue',
 'The sun is very bright today',
 'I have a little cat at home',
 'Can I have some water please',
 'My mother makes a delicious cake',
 'We go to school every morning',
 'The bird sings a beautiful song',
 'I want to learn English very well',
 'Yesterday I played with my friends'
)
for ($i=0; $i -lt $sentences.Count; $i++) { SaySsml "<prosody rate='-04%'>$($sentences[$i]).</prosody>" (Join-Path $Root "sentences\$i.wav") }

$praise = @{
  'excellent'='Excellent!'; 'great_job'='Great job!';
  'perfect'='Perfect!'; 'wonderful'='Wonderful!';
  'amazing'='Amazing!'; 'well_done'='Well done!';
  'try_again'='Try again'; 'good'='Good!';
  'superstar'='You are a superstar!'; 'great_work'='Great work!'
}
foreach ($k in $praise.Keys) { SaySsml "<prosody rate='-02%'>$($praise[$k])</prosody>" (Join-Path $Root "praise\$k.wav") }

$syn.Dispose()

$count = (Get-ChildItem -Recurse -File $Root).Count
$size  = [math]::Round((Get-ChildItem -Recurse -File $Root | Measure-Object Length -Sum).Sum / 1MB, 2)
"Generated $count files, $size MB"

