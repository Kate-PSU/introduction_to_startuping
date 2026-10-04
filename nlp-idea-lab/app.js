const STORAGE_KEY = "nlpIdeaLabV1";

const AREAS = [
  {id:"education",icon:"🎓",title:"Изучение языков",hint:"Обучение, обратная связь, персонализация"},
  {id:"translation",icon:"🌍",title:"Перевод и локализация",hint:"Перевод, контроль качества, ресурсы"},
  {id:"special",icon:"📚",title:"Сложные тексты",hint:"Научные, технические и профессиональные тексты"},
  {id:"business",icon:"💬",title:"Коммуникация",hint:"Обращения, переписка, клиентский сервис"},
  {id:"access",icon:"♿",title:"Доступность",hint:"Понятность, озвучивание, специальные потребности"},
  {id:"speech",icon:"🎙️",title:"Речь и голос",hint:"Распознавание, синтез, устное взаимодействие"},
  {id:"media",icon:"📊",title:"Медиааналитика",hint:"Мнения, репутация, информационные потоки"},
  {id:"writing",icon:"✍️",title:"Работа с текстом",hint:"Проверка, редактирование, генерация"},
  {id:"terms",icon:"🧩",title:"Терминология",hint:"Термины, глоссарии, семантический поиск"},
  {id:"heritage",icon:"🗣️",title:"Языковое наследие",hint:"Редкие языки, диалекты, архивы"}
];

const AUDIENCES = ["Школьники","Студенты","Преподаватели","Переводчики","Исследователи","Специалисты компании","Авторы и редакторы","Люди с особыми потребностями","Клиенты сервиса","Другое"];

const TECHS = [
  {id:"classify",icon:"🏷️",title:"Классификация текста",hint:"Определять тему, жанр или тип сообщения"},
  {id:"sentiment",icon:"🙂",title:"Анализ тональности",hint:"Выявлять оценку, эмоции и отношение"},
  {id:"ner",icon:"🔎",title:"Извлечение сущностей",hint:"Находить имена, даты, термины и организации"},
  {id:"summary",icon:"📝",title:"Суммаризация",hint:"Создавать краткое содержание документа"},
  {id:"translate",icon:"🌐",title:"Машинный перевод",hint:"Переводить и локализовать содержание"},
  {id:"proofread",icon:"✅",title:"Проверка текста",hint:"Находить языковые и стилистические ошибки"},
  {id:"generate",icon:"✨",title:"Генерация текста",hint:"Создавать ответы, описания и черновики"},
  {id:"search",icon:"🧭",title:"Семантический поиск",hint:"Искать информацию по смыслу"},
  {id:"asr",icon:"🎧",title:"Распознавание речи",hint:"Преобразовывать аудио в текст"},
  {id:"tts",icon:"🔊",title:"Синтез речи",hint:"Озвучивать текст"},
  {id:"dialog",icon:"🤖",title:"Диалоговая система",hint:"Организовывать разговор с пользователем"},
  {id:"terms",icon:"🧠",title:"Терминологическая обработка",hint:"Извлекать термины и строить глоссарии"},
  {id:"corpus",icon:"📈",title:"Анализ корпуса",hint:"Находить частотность и языковые закономерности"}
];

const STEP_NAMES = ["Направление","Проблема","Технологии","Идеи","Проверка","Паспорт"];

const initialState = () => ({
  step:0,maxStep:0,areas:[],customArea:"",audience:"",customAudience:"",
  user:"",situation:"",task:"",currentWay:"",consequence:"",whyNot:"",
  techs:[],data:"",ideas:[],selectedIdea:0,
  scores:{problem:3,users:3,data:3,prototype:3,difference:3},
  projectName:"",hypothesis:"",prototype:"",validation:""
});

let state = loadState();
let toastTimer;

const $ = (selector,root=document) => root.querySelector(selector);
const $$ = (selector,root=document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? "").replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? {...initialState(),...saved,scores:{...initialState().scores,...saved.scores}} : initialState();
  }catch{return initialState();}
}

function saveState(show=false){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  $("#saveStatus").textContent="Сохранено";
  if(show) notify("Работа сохранена в этом браузере");
  setTimeout(()=>$("#saveStatus").textContent="Сохранение включено",1000);
}

function notify(message){
  const toast=$("#toast");
  toast.textContent=message;toast.classList.add("show");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2400);
}

function hasProgress(){
  return state.maxStep>0 || state.areas.length || state.user || state.techs.length;
}

function start(reset=false){
  if(reset) state=initialState();
  $("#welcome").classList.remove("active");
  $("#workspace").classList.add("active");
  render();window.scrollTo({top:0,behavior:"smooth"});
}

$("#startBtn").addEventListener("click",()=>start(!hasProgress()));
$("#resumeBtn").addEventListener("click",()=>start(false));
if(hasProgress()) $("#resumeBtn").classList.remove("hidden");

function render(){
  renderNav();
  const renderers=[renderDirection,renderProblem,renderTech,renderIdeas,renderScore,renderPassport];
  $("#stage").innerHTML=renderers[state.step]();
  bindCommon();
  [bindDirection,bindProblem,bindTech,bindIdeas,bindScore,bindPassport][state.step]();
  const percent=Math.round((state.step+1)/STEP_NAMES.length*100);
  $("#progressBar").style.width=`${percent}%`;
  $("#progressText").textContent=`${percent}%`;
}

function renderNav(){
  $("#steps").innerHTML=STEP_NAMES.map((name,i)=>`<button data-go="${i}" class="${i===state.step?'current':i<state.step?'done':''}" ${i>state.maxStep?'disabled':''}>${i+1}. ${name}</button>`).join("");
  $$('[data-go]').forEach(btn=>btn.addEventListener("click",()=>goTo(Number(btn.dataset.go))));
}

function panel(title,icon,lead,body,back=true,next="Далее"){
  return `<section class="panel"><div class="panel-head"><div><p class="eyebrow">Этап ${state.step+1} из 6</p><h2>${title}</h2><p class="intro">${lead}</p></div><div class="icon" aria-hidden="true">${icon}</div></div>${body}<div class="actions"><div>${back?'<button class="ghost" data-back>← Назад</button>':''}</div><div class="right"><button class="secondary" data-save>Сохранить</button>${next?`<button class="primary" data-next>${next} →</button>`:''}</div></div></section>`;
}

function bindCommon(){
  $("[data-back]")?.addEventListener("click",()=>goTo(state.step-1));
  $("[data-next]")?.addEventListener("click",nextStep);
  $("[data-save]")?.addEventListener("click",()=>saveState(true));
}

function goTo(step){
  if(step<0){$("#workspace").classList.remove("active");$("#welcome").classList.add("active");return;}
  if(step<=state.maxStep){state.step=step;saveState();render();window.scrollTo({top:0,behavior:"smooth"});}
}

function nextStep(){
  const errors=validateStep();
  if(errors){notify(errors);return;}
  if(state.step===2 && !state.ideas.length) generateIdeas();
  if(state.step===3) seedFinalFields();
  state.step=Math.min(5,state.step+1);state.maxStep=Math.max(state.maxStep,state.step);saveState();render();window.scrollTo({top:0,behavior:"smooth"});
}

function validateStep(){
  if(state.step===0 && !state.areas.length && !state.customArea.trim()) return "Выберите хотя бы одно направление";
  if(state.step===0 && !effectiveAudience()) return "Укажите целевую аудиторию";
  if(state.step===1 && (!state.user.trim()||!state.task.trim()||!state.currentWay.trim()||!state.consequence.trim())) return "Заполните четыре основных поля проблемы";
  if(state.step===2 && !state.techs.length) return "Выберите хотя бы одну NLP‑технологию";
  if(state.step===2 && !state.data.trim()) return "Укажите, какие данные понадобятся";
  if(state.step===3 && (!state.ideas[state.selectedIdea]||!state.ideas[state.selectedIdea].text.trim())) return "Выберите и уточните одну идею";
  return "";
}

function renderDirection(){
  const cards=AREAS.map(a=>`<button class="choice ${state.areas.includes(a.id)?'selected':''}" data-area="${a.id}" aria-pressed="${state.areas.includes(a.id)}"><span class="emoji">${a.icon}</span><strong>${a.title}</strong><small>${a.hint}</small></button>`).join("");
  const audiences=AUDIENCES.map(a=>`<option ${state.audience===a?'selected':''}>${a}</option>`).join("");
  return panel("Выберите поле поиска","🧭","Отметьте одно или два направления, в которых команде действительно интересно искать проблему.",`<div class="notice"><strong>Не ищите название продукта.</strong> Пока достаточно определить область и людей, которым команда хотела бы помочь.</div><div class="choice-grid">${cards}</div><div class="form-grid"><div class="field full"><label for="customArea">Своё направление</label><input id="customArea" value="${esc(state.customArea)}" placeholder="Например, коммуникация врача и пациента"></div><div class="field"><label for="audience">Кому вы хотите помогать?</label><select id="audience"><option value="">Выберите аудиторию</option>${audiences}</select></div><div class="field"><label for="customAudience">Уточните аудиторию</label><input id="customAudience" value="${esc(state.customAudience)}" placeholder="Например, начинающие технические переводчики"></div></div>`,false);
}

function bindDirection(){
  $$('[data-area]').forEach(btn=>btn.addEventListener("click",()=>{
    const id=btn.dataset.area;
    if(state.areas.includes(id)) state.areas=state.areas.filter(x=>x!==id);
    else if(state.areas.length<2) state.areas.push(id);
    else return notify("Можно выбрать не более двух направлений");
    saveState();render();
  }));
  bindValue("#customArea","customArea");bindValue("#audience","audience");bindValue("#customAudience","customAudience");
}

function effectiveAudience(){return state.customAudience.trim()||state.audience;}
function areaNames(){return [...state.areas.map(id=>AREAS.find(a=>a.id===id)?.title).filter(Boolean),state.customArea.trim()].filter(Boolean);}

function renderProblem(){
  return panel("Сформулируйте проблему","🔍","Опишите конкретную ситуацию глазами пользователя. Чем точнее контекст, тем полезнее будущая идея.",`<div class="form-grid"><div class="field"><label for="user">Кто сталкивается с проблемой? *</label><input id="user" value="${esc(state.user)}" placeholder="Например, студент технической специальности"></div><div class="field"><label for="situation">В какой ситуации?</label><input id="situation" value="${esc(state.situation)}" placeholder="Например, при чтении англоязычной статьи"></div><div class="field full"><label for="task">Что пользователь пытается сделать? *</label><textarea id="task" placeholder="Понять термины и сохранить их для дальнейшей работы">${esc(state.task)}</textarea></div><div class="field"><label for="currentWay">Как он решает задачу сейчас? *</label><textarea id="currentWay" placeholder="Ищет каждый термин вручную в нескольких словарях">${esc(state.currentWay)}</textarea></div><div class="field"><label for="consequence">К чему это приводит? *</label><textarea id="consequence" placeholder="Тратит много времени и теряет контекст">${esc(state.consequence)}</textarea></div><div class="field full"><label for="whyNot">Почему существующие решения не подходят?</label><textarea id="whyNot" placeholder="Например, дают общий перевод без учёта предметной области">${esc(state.whyNot)}</textarea></div></div><div class="formula"><h3>Черновик проблемного интервью</h3><p id="problemFormula" class="formula-output">${problemFormula()}</p></div>`);
}

function problemFormula(){
  const user=state.user.trim()||effectiveAudience()||"Пользователь";
  const task=state.task.trim()||"выполнить важную языковую задачу";
  const situation=state.situation.trim()?` ${state.situation.trim()}`:"";
  const way=state.currentWay.trim()||"существующие инструменты";
  const consequence=state.consequence.trim()||"лишние затраты времени и ошибки";
  return `${esc(user)} испытывает трудности, когда пытается ${esc(lowerFirst(task))}${esc(situation)}. Сейчас используется способ «${esc(way)}», но это приводит к тому, что ${esc(lowerFirst(consequence))}.`;
}

function bindProblem(){
  ["user","situation","task","currentWay","consequence","whyNot"].forEach(key=>bindValue(`#${key}`,key,()=>$("#problemFormula").innerHTML=problemFormula()));
}

function renderTech(){
  const cards=TECHS.map(t=>`<button class="tech-card ${state.techs.includes(t.id)?'selected':''}" data-tech="${t.id}" aria-pressed="${state.techs.includes(t.id)}"><span class="tick">✓</span><span class="emoji">${t.icon}</span><strong>${t.title}</strong><small>${t.hint}</small></button>`).join("");
  return panel("Соберите технологический набор","🧠",`Выберите от одной до трёх технологий. Выбрано: <span class="counter">${state.techs.length}/3</span>`,`<div class="tech-grid">${cards}</div><div class="compatibility">${compatibilityText()}</div><div class="field"><label for="data">Какие данные понадобятся? *</label><textarea id="data" placeholder="Например: англо-русские статьи, терминологические словари и примеры употребления терминов">${esc(state.data)}</textarea><small>Укажите тексты, аудиозаписи, словари, размеченные примеры или пользовательские запросы.</small></div>`);
}

function compatibilityText(){
  if(!state.techs.length) return "<strong>Подсказка:</strong> сначала выберите технологию, которая выполняет центральную функцию продукта.";
  const names=state.techs.map(id=>TECHS.find(t=>t.id===id)?.title).filter(Boolean);
  if(names.length===1) return `<strong>Хорошее начало.</strong> ${esc(names[0])} может стать центральной функцией первого прототипа.`;
  if(names.length===2) return `<strong>Связка технологий:</strong> ${esc(names.join(" + "))}. Проверьте, действительно ли обе нужны в первой версии.`;
  return `<strong>Полный набор:</strong> ${esc(names.join(" + "))}. Для MVP выберите одну центральную функцию, остальные оставьте для развития.`;
}

function bindTech(){
  $$('[data-tech]').forEach(btn=>btn.addEventListener("click",()=>{
    const id=btn.dataset.tech;
    if(state.techs.includes(id)) state.techs=state.techs.filter(x=>x!==id);
    else if(state.techs.length<3) state.techs.push(id);
    else return notify("Для фокуса выберите не более трёх технологий");
    state.ideas=[];saveState();render();
  }));
  bindValue("#data","data",()=>state.ideas=[]);
}

function generateIdeas(){
  const user=state.user.trim()||effectiveAudience()||"выбранной аудитории";
  const task=state.task.trim()||"решать выбранную языковую задачу";
  const consequence=state.consequence.trim()||"сократить затраты времени и количество ошибок";
  const techNames=state.techs.map(id=>TECHS.find(t=>t.id===id)?.title.toLowerCase()).filter(Boolean);
  const main=techNames[0]||"NLP-обработку";
  const extra=techNames.slice(1).join(" и ");
  state.ideas=[
    {type:"Минимальный продукт",icon:"🧪",text:`Простой сервис для ${user}, который использует ${main}, чтобы помочь ${lowerFirst(task)} и ${lowerFirst(consequence)}. В первой версии — одна основная функция и ручная проверка результата.`},
    {type:"Расширенный продукт",icon:"🚀",text:`Платформа для ${user}, объединяющая ${main}${extra?` с технологиями «${extra}»`:""}. Она сопровождает пользователя в ситуации «${state.situation.trim()||task}», сохраняет результаты и предлагает персональные рекомендации.`},
    {type:"Смелая идея",icon:"🔭",text:`Интеллектуальный помощник для ${user}, который адаптируется к контексту и данным пользователя, прогнозирует трудности при выполнении задачи «${task}» и предлагает решение до возникновения ошибки.`}
  ];
  state.selectedIdea=0;
}

function renderIdeas(){
  if(!state.ideas.length) generateIdeas();
  const cards=state.ideas.map((idea,i)=>`<button class="idea-card ${state.selectedIdea===i?'selected':''}" data-idea="${i}"><span class="idea-icon">${idea.icon}</span><h3>${idea.type}</h3><p>${esc(idea.text)}</p><span class="select-label">${state.selectedIdea===i?'Выбрано ✓':'Выбрать концепцию'}</span></button>`).join("");
  return panel("Сравните три масштаба идеи","💡","Это не готовые ответы, а стартовые формулировки. Выберите наиболее полезную и отредактируйте её под замысел команды.",`<div class="idea-grid">${cards}</div><div class="field full"><label for="ideaText">Отредактируйте выбранную концепцию</label><textarea id="ideaText" rows="6">${esc(state.ideas[state.selectedIdea]?.text)}</textarea></div><p class="no-print"><button class="secondary" id="regenerate">↻ Сформировать варианты заново</button></p>`);
}

function bindIdeas(){
  $$('[data-idea]').forEach(btn=>btn.addEventListener("click",()=>{state.selectedIdea=Number(btn.dataset.idea);saveState();render();}));
  $("#ideaText").addEventListener("input",e=>{state.ideas[state.selectedIdea].text=e.target.value;saveState();});
  $("#regenerate").addEventListener("click",()=>{generateIdeas();saveState();render();notify("Варианты обновлены")});
}

const SCORE_META={
  problem:["problem","Проблема понятна","Можно объяснить без названия технологии"],
  users:["users","Доступны пользователи","Можно провести интервью в ближайшие две недели"],
  data:["data","Доступны данные","Понятно, где взять материалы для прототипа"],
  prototype:["prototype","Реален прототип","Основную функцию можно показать за один семестр"],
  difference:["difference","Есть отличие","Это больше, чем обычный запрос готовому чат-боту"]
};

function renderScore(){
  const rows=Object.entries(SCORE_META).map(([key,[,title,hint]])=>`<div class="score-row"><label for="score-${key}">${title}<small>${hint}</small></label><input id="score-${key}" data-score="${key}" type="range" min="1" max="5" value="${state.scores[key]}"><output id="out-${key}">${state.scores[key]}</output></div>`).join("");
  return panel("Проверьте идею на реалистичность","⚖️","Оцените не привлекательность формулировки, а возможность проверить гипотезу и сделать первый прототип.",`<div class="score-list">${rows}</div><div id="scoreResult">${scoreResult()}</div>`);
}

function scoreResult(){
  const total=Object.values(state.scores).reduce((a,b)=>a+Number(b),0);
  let level="Жёлтая зона",cls="",text="Идею можно развивать, но сначала уточните самые слабые элементы.";
  if(total>=21){level="Зелёная зона";cls="green";text="Гипотеза достаточно сфокусирована, чтобы переходить к интервью и проектированию MVP.";}
  if(total<=13){level="Красная зона";cls="red";text="Сузьте аудиторию или проблему и проверьте доступность пользователей и данных.";}
  const weakest=Object.entries(state.scores).sort((a,b)=>a[1]-b[1])[0][0];
  const weakTitle=SCORE_META[weakest][1];
  return `<div class="score-result"><div class="score-badge ${cls}">${total}/25</div><div><h3>${level}</h3><p>${text}</p><p><strong>Первым делом обсудите:</strong> ${weakTitle.toLowerCase()}.</p></div></div>`;
}

function bindScore(){
  $$('[data-score]').forEach(input=>input.addEventListener("input",e=>{state.scores[e.target.dataset.score]=Number(e.target.value);$(`#out-${e.target.dataset.score}`).value=e.target.value;$("#scoreResult").innerHTML=scoreResult();saveState();}));
}

function seedFinalFields(){
  const idea=state.ideas[state.selectedIdea]?.text||"";
  if(!state.hypothesis) state.hypothesis=`Мы предполагаем, что ${state.user.trim()||effectiveAudience()} нуждается в решении, которое поможет ${lowerFirst(state.task)}.`;
  if(!state.prototype) state.prototype=`Первая версия проверит одну основную функцию: ${TECHS.find(t=>t.id===state.techs[0])?.title||"обработку пользовательского запроса"}.`;
  if(!state.validation) state.validation="Провести 5 интервью с представителями целевой аудитории и показать им простой прототип.";
  if(!state.projectName) state.projectName=idea?"Рабочее название проекта":"";
}

function passportText(){
  const techNames=state.techs.map(id=>TECHS.find(t=>t.id===id)?.title).filter(Boolean);
  const idea=state.ideas[state.selectedIdea]?.text||"";
  return `ПАСПОРТ ПРОЕКТНОЙ ГИПОТЕЗЫ\n\nНазвание: ${state.projectName}\nНаправление: ${areaNames().join(", ")}\nЦелевая аудитория: ${effectiveAudience()}\n\nПроблема:\n${stripHtml(problemFormula())}\n\nКонцепция решения:\n${idea}\n\nNLP-технологии: ${techNames.join(", ")}\nНеобходимые данные: ${state.data}\n\nГлавная гипотеза:\n${state.hypothesis}\n\nПервый прототип:\n${state.prototype}\n\nКак проверить:\n${state.validation}\n\nРеалистичность: ${Object.values(state.scores).reduce((a,b)=>a+Number(b),0)}/25`;
}

function renderPassport(){
  seedFinalFields();
  const techTags=state.techs.map(id=>`<span class="tag">${esc(TECHS.find(t=>t.id===id)?.title)}</span>`).join("");
  const idea=state.ideas[state.selectedIdea]?.text||"";
  const body=`<div class="notice success-notice no-print"><strong>Первый результат готов.</strong> Это не окончательная концепция: следующая задача команды — поговорить с пользователями и проверить проблему.</div><div class="form-grid no-print"><div class="field"><label for="projectName">Рабочее название</label><input id="projectName" value="${esc(state.projectName)}"></div><div class="field"><label for="hypothesis">Главная гипотеза</label><textarea id="hypothesis">${esc(state.hypothesis)}</textarea></div><div class="field"><label for="prototype">Что войдёт в первый прототип?</label><textarea id="prototype">${esc(state.prototype)}</textarea></div><div class="field"><label for="validation">Как проверить идею?</label><textarea id="validation">${esc(state.validation)}</textarea></div></div><div id="passportPreview" class="passport">${passportPreview(idea,techTags)}</div><div class="actions no-print"><div><button class="ghost" data-back>← Назад</button></div><div class="right"><button class="secondary" id="copyBtn">Копировать текст</button><button class="primary" id="printBtn">Сохранить как PDF</button></div></div><div class="reset-row no-print"><button class="danger" id="resetBtn">Начать новую идею</button></div>`;
  return `<section class="panel"><div class="panel-head"><div><p class="eyebrow">Этап 6 из 6</p><h2>Паспорт проектной гипотезы</h2><p class="intro">Сохраните документ и используйте его для обсуждения, интервью и дальнейшего заполнения Lean Canvas.</p></div><div class="icon">📄</div></div>${body}</section>`;
}

function passportPreview(idea,techTags){
  const score=Object.values(state.scores).reduce((a,b)=>a+Number(b),0);
  return `<div class="passport-section"><h3>${esc(state.projectName||"Рабочее название проекта")}</h3><p><strong>Направление:</strong> ${esc(areaNames().join(", "))}<br><strong>Целевая аудитория:</strong> ${esc(effectiveAudience())}</p></div><div class="passport-section"><h3>Проблема пользователя</h3><p>${problemFormula()}</p></div><div class="passport-section"><h3>Концепция решения</h3><p>${esc(idea)}</p></div><div class="passport-section"><h3>NLP‑технологии</h3><div class="tags">${techTags}</div><p><strong>Необходимые данные:</strong> ${esc(state.data)}</p></div><div class="passport-section"><h3>Главная гипотеза</h3><p>${esc(state.hypothesis)}</p></div><div class="passport-section"><h3>Первый прототип</h3><p>${esc(state.prototype)}</p></div><div class="passport-section"><h3>Проверка</h3><p>${esc(state.validation)}</p></div><div class="passport-section"><h3>Предварительная реалистичность</h3><p><strong>${score}/25.</strong> Оценка нужна для обсуждения, а не является отметкой преподавателя.</p></div>`;
}

function bindPassport(){
  ["projectName","hypothesis","prototype","validation"].forEach(key=>bindValue(`#${key}`,key,refreshPassport));
  $("#copyBtn").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(passportText());notify("Паспорт скопирован") }catch{notify("Не удалось скопировать — используйте печать в PDF")}});
  $("#printBtn").addEventListener("click",()=>window.print());
  $("#resetBtn").addEventListener("click",()=>{if(confirm("Удалить сохранённые ответы и начать заново?")){localStorage.removeItem(STORAGE_KEY);state=initialState();start(true);}});
}

function refreshPassport(){
  const tags=state.techs.map(id=>`<span class="tag">${esc(TECHS.find(t=>t.id===id)?.title)}</span>`).join("");
  $("#passportPreview").innerHTML=passportPreview(state.ideas[state.selectedIdea]?.text||"",tags);
}

function bindValue(selector,key,onInput){
  const element=$(selector);if(!element)return;
  element.addEventListener("input",e=>{state[key]=e.target.value;saveState();onInput?.();});
  element.addEventListener("change",e=>{state[key]=e.target.value;saveState();onInput?.();});
}

function lowerFirst(text){return text ? text.charAt(0).toLowerCase()+text.slice(1) : "";}
function stripHtml(html){const div=document.createElement("div");div.innerHTML=html;return div.textContent||"";}
