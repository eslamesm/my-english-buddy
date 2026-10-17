# Generates fixed Arabic teacher clips into C:\EnglishKids\audio\teacher
# Prefers the Windows OneCore Arabic voice (Microsoft Hoda) via WinRT,
# falls back to any installed System.Speech voice for the ar culture.
# Run:  powershell -ExecutionPolicy Bypass -File tools\generate_teacher_voice.ps1

$ErrorActionPreference = 'Stop'
$Root = 'C:\EnglishKids\audio\teacher'
New-Item -ItemType Directory -Force -Path $Root | Out-Null

# id => Arabic text (fixed scaffolding lines; dynamic word/meaning are spoken by the app)
$clips = [ordered]@{
  'hello'           = 'مرحباً! أنا معلّمتك بومة، جاهز نبدأ الدرس؟'
  'intro_letters'   = 'هذا الحرف. اسمع النطق جيداً، ثم انطق الكلمة بعدي.'
  'intro_words'     = 'هذه كلمة جديدة. اسمعها منّي، ثم انطقها أنت.'
  'intro_phrases'   = 'هذه عبارة نستخدمها كثيراً. اسمعها، ثم رددها.'
  'intro_sentences' = 'الآن نتدرّب على جملة كاملة. سأقرؤها ببطء، ثم اقرؤها أنت.'
  'intro_review'    = 'هذه مراجعة سريعة. تذكّر النطق، ثم انطقها.'
  'your_turn'       = 'دورك الآن. انطق بثقة، أنا أسمعك!'
  'listen_again'    = 'استمع جيداً إلى النطق الصحيح، ثم انطق.'
  'praise3'         = 'رائع! نطق ممتاز، أنا فخورة بك.'
  'praise3b'        = 'ممتاز! كأنك معلّم صغير.'
  'praise2'         = 'جيد جداً! اقتربت كثيراً، جرّب مرة أخرى.'
  'praise1'         = 'محاولة جيدة. اسمعني مرة أخرى، ثم أعِد.'
  'praise0'         = 'لا بأس! خذ نفساً، واستمع إليّ، ثم حاول من جديد.'
  'cheer'           = 'أحسنت!'
}

function Write-WinRT {
  param([string]$Text, [string]$Path)
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  [void][Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]
  [void][Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]
  $ext = [System.WindowsRuntimeSystemExtensions]
  $mAs = $ext.GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
  } | Select-Object -First 1
  $await = {
    param($op, [Type]$t)
    $task = $mAs.MakeGenericMethod($t).Invoke($null, @($op))
    $task.Wait(-1) | Out-Null
    return $task.Result
  }
  $synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
  $voice = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices |
    Where-Object { $_.Language -like 'ar*' } | Select-Object -First 1
  if (-not $voice) { throw 'no-arabic-winrt-voice' }
  $synth.Voice = $voice
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ar-EG'><prosody rate='-4%'>$Text</prosody></speak>"
  try { $op = $synth.SynthesizeSsmlToStreamAsync($ssml) }
  catch { $op = $synth.SynthesizeTextToStreamAsync($Text) }
  $stream = & $await $op ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
  if (-not $stream) { $op = $synth.SynthesizeTextToStreamAsync($Text); $stream = & $await $op ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream]) }
  $size = [uint32]$stream.Size
  $reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
  [void](& $await ($reader.LoadAsync($size)) ([uint32]))
  $bytes = New-Object 'byte[]' $size
  $reader.ReadBytes($bytes)
  [System.IO.File]::WriteAllBytes($Path, $bytes)
  return $voice.DisplayName
}

function Write-Sapi {
  param([string]$Text, [string]$Path)
  Add-Type -AssemblyName System.Speech
  $syn = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $voice = $syn.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'ar*' } | Select-Object -First 1
  if (-not $voice) { $syn.Dispose(); throw 'no-arabic-sapi-voice' }
  $syn.SelectVoice($voice.VoiceInfo.Name)
  $fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(
    22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
  $syn.SetOutputToWaveFile($Path, $fmt)
  $syn.Speak($Text)
  $syn.SetOutputToNull()
  $syn.Dispose()
  return $voice.VoiceInfo.Name
}

$used = $null
$count = 0
foreach ($id in $clips.Keys) {
  $text = $clips[$id]
  $path = Join-Path $Root ($id + '.wav')
  if (-not $used) {
    try { $used = 'WinRT: ' + (Write-WinRT -Text $text -Path $path) }
    catch { try { $used = 'SAPI: ' + (Write-Sapi -Text $text -Path $path) } catch { $used = 'NONE' } }
  } else {
    if ($used -like 'WinRT*') { [void](Write-WinRT -Text $text -Path $path) }
    else { [void](Write-Sapi -Text $text -Path $path) }
  }
  $count++
}

"Voice: $used"
"Generated $count clips in $Root"
