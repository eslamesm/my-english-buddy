/* UI strings for the new Journey / stage screens only. Course content, words, glosses and lessons are never translated here.
   The language is a device setting (settings.uiLang, default 'ar'). It scopes direction to the new screens, so every
   existing Arabic screen keeps its layout. */
(function(root){
  'use strict';
  const S={
    'nav.home':{ar:'الرئيسية',en:'Home'},'nav.journey':{ar:'رحلتي',en:'Journey'},'nav.learn':{ar:'تعلّم',en:'Learn'},'nav.me':{ar:'أنا',en:'Me'},
    'journey.title':{ar:'رحلتي',en:'Journey'},
    'phrase.step':{ar:'كل خطوة بتقرّبك',en:'Every step gets you closer'},
    'phrase.today':{ar:'خطوتك الجاية مستنياك',en:'Your next step is waiting'},'legend':{ar:'✓ مكتمل  ·  ● مرحلتك الحالية  ·  ○ لم تكتمل بعد',en:'✓ Completed  ·  ● Current stage  ·  ○ Not completed yet'},
    'learn.title':{ar:'تعلّم',en:'Learn'},'learn.sub':{ar:'اختار قسم وابدأ مع إسلام',en:'Pick a section and start with Islam'},
    'phrase.next':{ar:'جاهز للتحدّي الجاي',en:'Ready for the next challenge'},
    'stage.words':{ar:'الكلمات المتقنة (٣ نجوم)',en:'Mastered words (3 stars)'},
    'stage.of':{ar:'من',en:'of'},'stage.term':{ar:'ترم',en:'Term'},
    'stage.back':{ar:'رجوع',en:'Back'},
    'exam.title':{ar:'اختبار الانتقال',en:'Progress test'},
    'exam.passed':{ar:'نجحت في الاختبار',en:'You passed the test'},
    'exam.passedEarlier':{ar:'نجحت سابقًا على كلمات قديمة',en:'Passed earlier on an older word set'},
    'exam.locked':{ar:'يُفتح بعد إتقان كلمات المحطة',en:'Opens after you master this stage'},
    'exam.notThisStage':{ar:'اختبار هذه المحطة يظهر عندما تصل إليها',en:'This stage test appears when you reach it'},
    'exam.ready':{ar:'الاختبار جاهز',en:'The test is ready'},
    'exam.start':{ar:'ابدأ الاختبار',en:'Start test'},
    'exam.none':{ar:'لا توجد نتيجة مسجّلة',en:'No result recorded'},
    'exam.none.sub':{ar:'لم تُسجَّل محاولات اختبار لهذه المحطة',en:'No test tries were recorded for this stage'},
    'exam.results':{ar:'نتائجك',en:'Your results'},'exam.try':{ar:'المحاولة',en:'Try'},
    'exam.of':{ar:'من',en:'of'},
    'exam.passedTag':{ar:'ناجح',en:'Passed'},'exam.reviewTag':{ar:'راجع الأخطاء',en:'Review mistakes'},
    'exam.words20':{ar:'٢٠ كلمة',en:'20 words'},'exam.pass90':{ar:'النجاح \u2066٩٠٪\u2069',en:'Pass at 90%'},'exam.unlimited':{ar:'محاولات بلا حد',en:'Unlimited tries'},
    'practice.title':{ar:'امتحان تدريب',en:'Practice exam'},'practice.last':{ar:'آخر نتيجة',en:'Last score'},'practice.note':{ar:'تدريب، ليس شرط انتقال',en:'Practice, not a gate'},
    'lang.label':{ar:'لغة الواجهة',en:'App language'},'lang.ar':{ar:'عربي',en:'عربي'},'lang.en':{ar:'English',en:'English'},
    'state.done':{ar:'تمّت',en:'Done'},'state.current':{ar:'أنت هنا',en:'You are here'},'state.locked':{ar:'مقفولة',en:'Locked'},
    'home.hello':{ar:'أهلاً بيك',en:'Welcome'},
    'home.hero.title':{ar:'كمّل رحلتك مع إسلام',en:'Continue your journey with Islam'},
    'home.next':{ar:'الخطوة الجاية',en:'Next step'},'home.start':{ar:'ابدأ',en:'Start'},
    'home.journey':{ar:'رحلتي',en:'Journey'},'home.viewMap':{ar:'عرض الخريطة',en:'View map'},
    'home.pick':{ar:'اختر نشاطك',en:'Pick an activity'},
    'home.learn':{ar:'تعلّم',en:'Learn'},'home.learn.s':{ar:'كلمات وأصوات',en:'Words and sounds'},
    'home.games':{ar:'ألعاب',en:'Games'},'home.games.s':{ar:'العب وتدرّب',en:'Play and practice'},
    'home.stories':{ar:'قصص',en:'Stories'},'home.stories.s':{ar:'اقرأ واسمع',en:'Read and listen'},
    'home.stars':{ar:'نجومي',en:'My stars'},'home.stars.s':{ar:'مكافآت وإنجازات',en:'Rewards and achievements'},
    'home.all':{ar:'كل الأقسام والإعدادات',en:'All sections and settings'},'home.less':{ar:'إخفاء الأقسام',en:'Hide sections'},
    'pos.earlier':{ar:'قبل مرحلتك الحالية',en:'Before your current stage'},'pos.current':{ar:'مرحلتك الحالية',en:'Your current stage'},'pos.ahead':{ar:'مرحلة قادمة',en:'A stage ahead'},
    'level.badge':{ar:'مستواك',en:'Your level'}
  };
  const GRADE_EN={kg1:'KG1',kg2:'KG2',p1:'Grade 1',p2:'Grade 2',p3:'Grade 3',p4:'Grade 4',p5:'Grade 5',p6:'Grade 6',prep1:'Prep 1',prep2:'Prep 2'};
  let lang='ar';
  function norm(l){return l==='en'?'en':'ar';}
  function set(l){lang=norm(l);return lang;}
  function get(){return lang;}
  function t(key,l){const e=S[key];if(!e)return key;return e[norm(l||lang)]||e.ar;}
  function digits(n,l){const s=String(n);return norm(l||lang)==='ar'?s.replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]):s;}
  function gradeName(id,arName,l){return norm(l||lang)==='en'?(GRADE_EN[id]||String(id)):String(arName).replace(' الابتدائي','').replace(/\s*\(KG\d\)/,'');}
  root.I18N={S,GRADE_EN,set,get,t,norm,digits,gradeName};
})(typeof window!=='undefined'?window:globalThis);
