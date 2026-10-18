const STORAGE_KEY = "customerLensLabV1";
const STEP_NAMES = ["Роли", "Проект", "Сегменты", "Матрица", "Выбор", "Карта ролей", "JTBD", "Проверка", "Паспорт"];

const ROLE_CASES = [
  {
    q: "Переводчик ежедневно работает в CAT-системе. Руководитель отдела запрашивает коммерческое предложение, а директор по технологиям утверждает покупку.",
    ask: "Кто является пользователем?",
    options: ["Переводчик", "Руководитель отдела", "Директор по технологиям"],
    correct: 0,
    why: "Пользователь непосредственно работает с продуктом. Покупатель и лицо, принимающее решение, могут быть другими людьми."
  },
  {
    q: "Университет приобретает сервис проверки академических текстов для студентов. Договор оформляет контрактная служба, потребность формулирует преподаватель.",
    ask: "Кого нельзя автоматически считать единственным клиентом?",
    options: ["Только студента", "Университет", "Несколько участников покупки"],
    correct: 0,
    why: "Студент — пользователь, но в B2B/B2G покупке участвуют заказчик, плательщик, ЛПР и другие роли."
  },
  {
    q: "Команда пишет: «Наш продукт нужен всем, кто работает с языком».",
    ask: "В чём главная проблема формулировки?",
    options: ["Сегмент слишком узкий", "Нет общей проблемы и условий покупки", "Не указан возраст"],
    correct: 1,
    why: "Сегмент объединяет людей не профессией вообще, а сходной проблемой, контекстом, способом покупки и ожиданиями от решения."
  },
  {
    q: "Два сегмента одинаково велики. Первый легко доступен команде, часто сталкивается с проблемой и уже платит за обходные решения. Второй пока не признаёт проблему.",
    ask: "Какой сегмент разумнее проверить первым?",
    options: ["Первый", "Второй", "Оба одновременно"],
    correct: 0,
    why: "Для первого целевого сегмента важны не только размер, но и острота проблемы, доступность респондентов и признаки готовности платить."
  }
];

const MODELS = [
  {id:"B2C", icon:"👤", title:"B2C", hint:"Платит отдельный пользователь."},
  {id:"B2B", icon:"🏢", title:"B2B", hint:"Платит компания или организация."},
  {id:"B2G", icon:"🏛️", title:"B2G", hint:"Заказчик — государственная организация."},
  {id:"B2B2C", icon:"🔗", title:"B2B2C", hint:"Организация покупает доступ для пользователей."}
];

const SCORE_FACTORS = [
  ["pain", "Острота проблемы", "Насколько проблема мешает работе или приводит к потерям?"],
  ["frequency", "Частота", "Как часто сегмент сталкивается с проблемой?"],
  ["payment", "Готовность платить", "Есть ли бюджет или расходы на альтернативы?"],
  ["access", "Доступность", "Может ли команда найти респондентов и клиентов?"],
  ["fit", "Соответствие продукту", "Можно ли решить задачу текущими компетенциями команды?"]
];

const blankSegment = (i) => ({
  name: "",
  user: "",
  problem: "",
  context: "",
  pain: 3,
  frequency: 3,
  payment: 3,
  access: 3,
  fit: 3,
  id: i
});

const blankHypothesis = () => ({text:"", method:"Проблемное интервью", criterion:""});

const initialState = () => ({
  step: 0,
  maxStep: 0,
  caseIndex: 0,
  rolesDone: false,
  projectName: "",
  product: "",
  model: "",
  team: "",
  segments: [blankSegment(1), blankSegment(2), blankSegment(3)],
  chosen: 0,
  choiceReason: "",
  roles: {user:"", buyer:"", decision:"", influencer:"", blocker:""},
  jtbd: {when:"", want:"", result:"", alternatives:"", trigger:"", barriers:""},
  persona: {name:"", role:"", environment:"", success:"", quote:""},
  hypotheses: [blankHypothesis(), blankHypothesis(), blankHypothesis()],
  conclusion: ""
});

let state = loadState();
let toastTimer;
let feedbackAfter = null;
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(!saved) return initialState();
    const base = initialState();
    return {
      ...base,
      ...saved,
      roles:{...base.roles,...saved.roles},
      jtbd:{...base.jtbd,...saved.jtbd},
      persona:{...base.persona,...saved.persona},
      segments:base.segments.map((s,i)=>({...s,...(saved.segments?.[i]||{})})),
      hypotheses:base.hypotheses.map((h,i)=>({...h,...(saved.hypotheses?.[i]||{})}))
    };
  }catch{return initialState()}
}

function saveState(show=false){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const status = $("#saveStatus");
  if(status) status.textContent = "Сохранено";
  if(show) notify("Работа сохранена в этом браузере");
  setTimeout(()=>{if(status) status.textContent="Сохранение включено"},900);
}

function notify(message){
  const toast=$("#toast");
  toast.textContent=message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove("show"),2300);
}

function showFeedback(ok,title,text,after){
  $("#feedbackIcon").textContent=ok?"✓":"!";
  $("#feedbackIcon").className=`modal-icon ${ok?"":"bad"}`;
  $("#feedbackTitle").textContent=title;
  $("#feedbackText").textContent=text;
  feedbackAfter=after||null;
  $("#feedback").classList.add("open");
}

$("#feedbackClose").addEventListener("click",()=>{
  $("#feedback").classList.remove("open");
  const fn=feedbackAfter;
  feedbackAfter=null;
  fn?.();
});

function hasProgress(){return state.maxStep>0||state.caseIndex>0||state.projectName}
function start(reset=false){
  if(reset) state=initialState();
  $("#welcome").classList.remove("active");
  $("#workspace").classList.add("active");
  render();
  window.scrollTo({top:0,behavior:"smooth"});
}

$("#startBtn").addEventListener("click",()=>start(!hasProgress()));
$("#resumeBtn").addEventListener("click",()=>start(false));
if(hasProgress()) $("#resumeBtn").classList.remove("hidden");

function render(){
  renderNav();
  const screens=[renderCases,renderProject,renderSegments,renderScores,renderChoice,renderRoles,renderJTBD,renderValidation,renderPassport];
  $("#stage").innerHTML=screens[state.step]();
  bindCommon();
  [bindCases,bindProject,bindSegments,bindScores,bindChoice,bindRoles,bindJTBD,bindValidation,bindPassport][state.step]();
  const progress=Math.round((state.step+1)/STEP_NAMES.length*100);
  $("#progressBar").style.width=`${progress}%`;
  $("#progressText").textContent=`${progress}%`;
}

function renderNav(){
  $("#steps").innerHTML=STEP_NAMES.map((name,i)=>`<button data-go="${i}" class="${i===state.step?"current":i<state.step?"done":""}" ${i>state.maxStep?"disabled":""}>${i+1}. ${name}</button>`).join("");
  $$('[data-go]').forEach(b=>b.addEventListener("click",()=>goTo(+b.dataset.go)));
}

function goTo(step){
  if(step<0){$("#workspace").classList.remove("active");$("#welcome").classList.add("active");return}
  if(step<=state.maxStep){state.step=step;saveState();render();window.scrollTo({top:0,behavior:"smooth"})}
}

function panel(title,icon,lead,body,back=true,next="Далее"){
  return `<section class="panel"><div class="panel-head"><div><p class="eyebrow">Этап ${state.step+1} из ${STEP_NAMES.length}</p><h2>${title}</h2><p class="intro">${lead}</p></div><div class="icon">${icon}</div></div>${body}<div class="actions"><div>${back?'<button class="ghost" data-back>← Назад</button>':''}</div><div class="right"><button class="secondary" data-save>Сохранить</button>${next?`<button class="primary" data-next>${next} →</button>`:""}</div></div></section>`;
}

function bindCommon(){
  $("[data-back]")?.addEventListener("click",()=>goTo(state.step-1));
  $("[data-next]")?.addEventListener("click",nextStep);
  $("[data-save]")?.addEventListener("click",()=>saveState(true));
}

function nextStep(){
  const error=validateStep();
  if(error) return notify(error);
  state.step=Math.min(STEP_NAMES.length-1,state.step+1);
  state.maxStep=Math.max(state.maxStep,state.step);
  saveState();render();window.scrollTo({top:0,behavior:"smooth"});
}

function validateStep(){
  if(state.step===0&&!state.rolesDone) return "Разберите все четыре ситуации";
  if(state.step===1&&(!state.projectName.trim()||!state.product.trim()||!state.model)) return "Заполните проект, продукт и модель";
  if(state.step===2&&state.segments.some(s=>!s.name.trim()||!s.user.trim()||!s.problem.trim())) return "Опишите название, пользователя и проблему каждого сегмента";
  if(state.step===4&&!state.choiceReason.trim()) return "Обоснуйте выбор первого сегмента";
  if(state.step===5&&(!state.roles.user.trim()||!state.roles.buyer.trim()||!state.roles.decision.trim())) return "Заполните пользователя, покупателя и ЛПР";
  if(state.step===6&&(!state.jtbd.when.trim()||!state.jtbd.want.trim()||!state.jtbd.result.trim())) return "Сформулируйте все три части JTBD";
  if(state.step===7&&state.hypotheses.some(h=>!h.text.trim()||!h.criterion.trim())) return "Заполните гипотезы и критерии проверки";
  return "";
}

function renderCases(){
  if(state.rolesDone) return panel("Кто здесь клиент?","🧩","Вы разобрали основные роли и готовы перейти к собственному проекту.",`<div class="notice good"><strong>Главное:</strong> пользователь, покупатель, заказчик и лицо, принимающее решение, могут быть разными людьми. Сегмент должен описывать общую проблему и ситуацию покупки.</div>`,false);
  const c=ROLE_CASES[state.caseIndex];
  return panel("Разведите роли в покупке","🧩","Начнём с коротких ситуаций. Объяснение останется на экране до нажатия «Понятно».",`<div class="mission"><p class="quiz-progress">Ситуация ${state.caseIndex+1} из ${ROLE_CASES.length}</p><h3>${c.q}</h3><p><strong>${c.ask}</strong></p><div class="answers">${c.options.map((o,i)=>`<button class="answer" data-answer="${i}">${o}</button>`).join("")}</div></div>`,false,null);
}

function bindCases(){
  $$('[data-answer]').forEach(b=>b.addEventListener("click",()=>{
    const c=ROLE_CASES[state.caseIndex],ok=+b.dataset.answer===c.correct;
    showFeedback(ok,ok?"Верно":"Проверьте ещё раз",c.why,()=>{
      if(ok){state.caseIndex++;if(state.caseIndex>=ROLE_CASES.length){state.rolesDone=true;state.maxStep=Math.max(state.maxStep,1)}saveState();render()}
    });
  }));
}

function renderProject(){
  const models=MODELS.map(m=>`<button class="model-card ${state.model===m.id?"selected":""}" data-model="${m.id}"><span class="emoji">${m.icon}</span><strong>${m.title}</strong><small>${m.hint}</small></button>`).join("");
  return panel("Задайте рамку проекта","🧭","Определите продукт и того, кто принимает решение об оплате. Это не даст смешать пользователей и покупателей.",`<div class="model-grid">${models}</div><div class="form-grid"><div class="field"><label for="projectName">Название проекта *</label><input id="projectName" value="${esc(state.projectName)}" placeholder="Например, TermContext"></div><div class="field"><label for="team">Название команды</label><input id="team" value="${esc(state.team)}" placeholder="Команда проекта"></div><div class="field full"><label for="product">Какой продукт вы создаёте и какую задачу он решает? *</label><textarea id="product" placeholder="Сервис помогает…">${esc(state.product)}</textarea></div></div>`);
}

function bindProject(){
  $$('[data-model]').forEach(b=>b.addEventListener("click",()=>{state.model=b.dataset.model;saveState();render()}));
  bindValue("#projectName","projectName");bindValue("#team","team");bindValue("#product","product");
}

function renderSegments(){
  const rows=state.segments.map((s,i)=>`<tr><td><input data-segment="${i}" data-key="name" value="${esc(s.name)}" placeholder="Например, бюро технического перевода"></td><td><textarea data-segment="${i}" data-key="user" placeholder="Кто использует или покупает?">${esc(s.user)}</textarea></td><td><textarea data-segment="${i}" data-key="problem" placeholder="Какая общая проблема?">${esc(s.problem)}</textarea></td><td><textarea data-segment="${i}" data-key="context" placeholder="Когда и при каких условиях?">${esc(s.context)}</textarea></td></tr>`).join("");
  return panel("Сформулируйте три сегмента","🧱","Сегмент — не просто возраст или профессия. Его участники сталкиваются со сходной проблемой в сходном контексте и принимают решение похожим образом.",`<div class="notice"><strong>Проверка:</strong> если вы не можете найти представителей группы для интервью или объяснить их общую проблему, сегмент пока сформулирован слишком широко.</div><div style="overflow-x:auto"><table class="segment-table"><thead><tr><th>Название сегмента</th><th>Пользователь / покупатель</th><th>Общая проблема</th><th>Контекст возникновения</th></tr></thead><tbody>${rows}</tbody></table></div>`);
}

function bindSegments(){
  $$('[data-segment]').forEach(el=>el.addEventListener("input",e=>{state.segments[+e.target.dataset.segment][e.target.dataset.key]=e.target.value;saveState()}));
}

function segmentScore(s){return SCORE_FACTORS.reduce((sum,[key])=>sum+Number(s[key]||0),0)}

function renderScores(){
  const cards=state.segments.map((s,i)=>`<article class="score-card"><h3>${esc(s.name)||`Сегмент ${i+1}`}</h3>${SCORE_FACTORS.map(([key,label,hint])=>`<div class="score-row"><label title="${esc(hint)}">${label}</label><input type="range" min="1" max="5" step="1" value="${s[key]}" data-score-segment="${i}" data-score-key="${key}"><span class="score-value" id="score-${i}-${key}">${s[key]}</span></div>`).join("")}<div class="score-total"><span>Итого из 25</span><strong id="total-${i}">${segmentScore(s)}</strong></div></article>`).join("");
  return panel("Сравните сегменты","📊","Оцените каждый вариант по пяти одинаковым критериям. Это не заменяет исследование, но делает выбор прозрачным.",`<div class="notice"><strong>Шкала:</strong> 1 — признак почти отсутствует; 3 — средний уровень или недостаточно данных; 5 — сильное подтверждение.</div><div class="score-grid">${cards}</div>`);
}

function bindScores(){
  $$('[data-score-segment]').forEach(el=>el.addEventListener("input",e=>{
    const i=+e.target.dataset.scoreSegment,key=e.target.dataset.scoreKey;
    state.segments[i][key]=+e.target.value;
    $(`#score-${i}-${key}`).textContent=e.target.value;
    $(`#total-${i}`).textContent=segmentScore(state.segments[i]);
    saveState();
  }));
}

function ranking(){return state.segments.map((s,i)=>({i,s,score:segmentScore(s)})).sort((a,b)=>b.score-a.score)}

function renderChoice(){
  const list=ranking().map((x,pos)=>`<button class="rank-item ${state.chosen===x.i?"selected":""}" data-choose="${x.i}"><span class="rank-no">${pos+1}</span><span><strong>${esc(x.s.name)}</strong><div class="bar"><span style="width:${x.score/25*100}%"></span></div></span><strong>${x.score}/25</strong></button>`).join("");
  return panel("Выберите первый сегмент","🎯","Матрица предлагает приоритет, но решение принимает команда. Выберите сегмент для первых интервью и объясните выбор.",`<div class="ranking">${list}</div><div class="field"><label for="choiceReason">Почему вы начинаете именно с этого сегмента? *</label><textarea id="choiceReason" placeholder="Мы выбрали этот сегмент, потому что…">${esc(state.choiceReason)}</textarea><small>Укажите не только размер, но и проблему, доступность респондентов, признаки оплаты и соответствие компетенциям команды.</small></div>`);
}

function bindChoice(){
  $$('[data-choose]').forEach(b=>b.addEventListener("click",()=>{state.chosen=+b.dataset.choose;saveState();render()}));
  bindValue("#choiceReason","choiceReason");
}

function renderRoles(){
  const name=esc(state.segments[state.chosen]?.name||"выбранного сегмента");
  const fields=[
    ["user","👤 Пользователь *","Кто непосредственно работает с продуктом?"],
    ["buyer","💳 Покупатель / плательщик *","Кто выделяет деньги или оформляет покупку?"],
    ["decision","✅ Лицо, принимающее решение *","Кто может окончательно сказать «да»?"],
    ["influencer","💬 Влиятельное лицо","Чьё мнение влияет на выбор?"],
    ["blocker","⛔ Блокирующая сторона","Кто может остановить внедрение и почему?"]
  ];
  return panel("Постройте карту покупки","🕸️",`Для сегмента «${name}» разведите участников решения. В B2C роли могут совпасть, в B2B и B2G — часто распределены.`,`<div class="role-grid">${fields.map(([key,label,ph])=>`<div class="role-card"><h3>${label}</h3><textarea data-role="${key}" placeholder="${ph}">${esc(state.roles[key])}</textarea></div>`).join("")}</div>`);
}

function bindRoles(){$$('[data-role]').forEach(el=>el.addEventListener("input",e=>{state.roles[e.target.dataset.role]=e.target.value;saveState()}))}

function renderJTBD(){
  return panel("Опишите работу клиента","🛠️","JTBD фокусируется не на биографии вымышленного человека, а на ситуации, прогрессе и результате, ради которого выбирают продукт.",`<div class="jtbd"><h3>Когда… я хочу… чтобы…</h3><div class="jtbd-grid"><div class="field"><label>Когда возникает ситуация? *</label><textarea data-jtbd="when" placeholder="Когда мне нужно…">${esc(state.jtbd.when)}</textarea></div><div class="field"><label>Что клиент хочет сделать? *</label><textarea data-jtbd="want" placeholder="Я хочу…">${esc(state.jtbd.want)}</textarea></div><div class="field"><label>Какой результат важен? *</label><textarea data-jtbd="result" placeholder="Чтобы…">${esc(state.jtbd.result)}</textarea></div></div></div><div class="form-grid"><div class="field"><label>Текущие альтернативы</label><textarea data-jtbd="alternatives" placeholder="Как задачу решают без вашего продукта?">${esc(state.jtbd.alternatives)}</textarea></div><div class="field"><label>Триггер поиска</label><textarea data-jtbd="trigger" placeholder="Какое событие заставляет искать новое решение?">${esc(state.jtbd.trigger)}</textarea></div><div class="field full"><label>Барьеры и опасения</label><textarea data-jtbd="barriers" placeholder="Цена, внедрение, безопасность данных, недоверие к качеству…">${esc(state.jtbd.barriers)}</textarea></div><div class="field"><label>Условное имя портрета</label><input data-persona="name" value="${esc(state.persona.name)}" placeholder="Например, Анна — руководитель локализации"></div><div class="field"><label>Роль и рабочая среда</label><input data-persona="role" value="${esc(state.persona.role)}" placeholder="Должность или роль"></div><div class="field"><label>Контекст работы</label><textarea data-persona="environment" placeholder="Инструменты, ограничения, типовые задачи">${esc(state.persona.environment)}</textarea></div><div class="field"><label>Критерий успеха</label><textarea data-persona="success" placeholder="Как клиент понимает, что задача решена?">${esc(state.persona.success)}</textarea></div><div class="field full"><label>Ключевая фраза клиента</label><input data-persona="quote" value="${esc(state.persona.quote)}" placeholder="Формулировка проблемы языком клиента"></div></div>`);
}

function bindJTBD(){
  $$('[data-jtbd]').forEach(el=>el.addEventListener("input",e=>{state.jtbd[e.target.dataset.jtbd]=e.target.value;saveState()}));
  $$('[data-persona]').forEach(el=>el.addEventListener("input",e=>{state.persona[e.target.dataset.persona]=e.target.value;saveState()}));
}

function renderValidation(){
  const methods=["Проблемное интервью","Наблюдение","Анализ обращений и отзывов","Анализ закупок","Лендинг / заявка","Пилотное использование","Иное"];
  const items=state.hypotheses.map((h,i)=>`<article class="hypothesis"><h3>Гипотеза ${i+1}</h3><div class="form-grid"><div class="field full"><label>Что мы пока предполагаем? *</label><textarea data-hyp="${i}" data-hkey="text" placeholder="Мы предполагаем, что…">${esc(h.text)}</textarea></div><div class="field"><label>Как проверим?</label><select data-hyp="${i}" data-hkey="method">${methods.map(m=>`<option ${h.method===m?"selected":""}>${m}</option>`).join("")}</select></div><div class="field"><label>Какой результат подтвердит гипотезу? *</label><textarea data-hyp="${i}" data-hkey="criterion" placeholder="Например: 6 из 10 респондентов…">${esc(h.criterion)}</textarea></div></div></article>`).join("");
  return panel("Превратите портрет в план проверки","🧪","Портрет клиента — гипотеза, пока он не подтверждён поведением, интервью и данными. Запишите три наиболее рискованные догадки.",`<div class="notice"><strong>Хороший критерий наблюдаем:</strong> не «клиенту понравится», а «не менее 6 из 10 респондентов уже сталкивались с проблемой за последний месяц».</div><div class="hypothesis-list">${items}</div>`);
}

function bindValidation(){
  $$('[data-hyp]').forEach(el=>{
    const handler=e=>{state.hypotheses[+e.target.dataset.hyp][e.target.dataset.hkey]=e.target.value;saveState()};
    el.addEventListener("input",handler);
    el.addEventListener("change",handler);
  });
}

function chosenSegment(){return state.segments[state.chosen]||state.segments[0]}
function jtbdText(){return `Когда ${state.jtbd.when}, я хочу ${state.jtbd.want}, чтобы ${state.jtbd.result}.`}

function renderPassport(){
  const s=chosenSegment(),score=segmentScore(s),roles=state.roles;
  const body=`<div class="notice good no-print"><strong>Паспорт готов.</strong> Это рабочая гипотеза для интервью, а не окончательная истина о клиенте.</div><div class="metric-cards"><div class="metric"><small>Первый сегмент</small><strong>${esc(s.name)}</strong></div><div class="metric"><small>Оценка привлекательности</small><strong>${score}/25</strong></div><div class="metric"><small>Модель покупки</small><strong>${esc(state.model)}</strong></div></div><div class="passport"><section><h3>${esc(state.projectName)}</h3><p>${esc(state.product)}\nКоманда: ${esc(state.team||"не указана")}</p></section><section><h3>Первый целевой сегмент</h3><p><strong>${esc(s.name)}</strong>\nПользователь / покупатель: ${esc(s.user)}\nПроблема: ${esc(s.problem)}\nКонтекст: ${esc(s.context)}\n\nПочему выбран: ${esc(state.choiceReason)}</p></section><section><h3>Карта покупки</h3><p>Пользователь: ${esc(roles.user)}\nПокупатель: ${esc(roles.buyer)}\nЛПР: ${esc(roles.decision)}\nВлиятельное лицо: ${esc(roles.influencer||"не определено")}\nБлокирующая сторона: ${esc(roles.blocker||"не определена")}</p></section><section><h3>Job to Be Done</h3><p>${esc(jtbdText())}\n\nАльтернативы: ${esc(state.jtbd.alternatives)}\nТриггер: ${esc(state.jtbd.trigger)}\nБарьеры: ${esc(state.jtbd.barriers)}</p></section><section><h3>Портрет клиента</h3><p>Условное имя: ${esc(state.persona.name)}\nРоль: ${esc(state.persona.role)}\nРабочая среда: ${esc(state.persona.environment)}\nКритерий успеха: ${esc(state.persona.success)}\nФраза клиента: «${esc(state.persona.quote)}»</p></section><section><h3>План проверки</h3>${state.hypotheses.map((h,i)=>`<p><strong>${i+1}. ${esc(h.text)}</strong>\nМетод: ${esc(h.method)}\nКритерий: ${esc(h.criterion)}</p>`).join("")}</section><section class="no-print"><h3>Краткий вывод команды</h3><textarea id="conclusion" placeholder="Первым мы проверяем сегмент… Главная гипотеза…">${esc(state.conclusion)}</textarea></section></div><div class="actions no-print"><div><button class="ghost" data-back>← Назад</button></div><div class="right"><button class="secondary" id="copyBtn">Копировать паспорт</button><button class="primary" id="printBtn">Сохранить как PDF</button></div></div><div class="reset-row no-print"><button class="danger" id="resetBtn">Начать новый проект</button></div>`;
  return `<section class="panel"><div class="panel-head"><div><p class="eyebrow">Этап ${STEP_NAMES.length} из ${STEP_NAMES.length}</p><h2>Паспорт первого сегмента</h2><p class="intro">Используйте его как основу для рекрутинга респондентов, проблемных интервью и уточнения ценностного предложения.</p></div><div class="icon">📄</div></div>${body}</section>`;
}

function bindPassport(){
  bindValue("#conclusion","conclusion");
  $("#copyBtn").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(reportText());notify("Паспорт скопирован")}catch{notify("Не удалось скопировать — сохраните как PDF")}});
  $("#printBtn").addEventListener("click",()=>window.print());
  $("#resetBtn").addEventListener("click",()=>{if(confirm("Удалить сохранённые ответы и начать заново?")){localStorage.removeItem(STORAGE_KEY);state=initialState();start(true)}});
}

function reportText(){
  const s=chosenSegment(),r=state.roles;
  return `ПАСПОРТ ПЕРВОГО СЕГМЕНТА\n\nПроект: ${state.projectName}\nМодель: ${state.model}\nПродукт: ${state.product}\n\nСЕГМЕНТ\n${s.name}\nПользователь / покупатель: ${s.user}\nПроблема: ${s.problem}\nКонтекст: ${s.context}\nОценка: ${segmentScore(s)}/25\nПочему выбран: ${state.choiceReason}\n\nКАРТА ПОКУПКИ\nПользователь: ${r.user}\nПокупатель: ${r.buyer}\nЛПР: ${r.decision}\nВлиятельное лицо: ${r.influencer}\nБлокирующая сторона: ${r.blocker}\n\nJTBD\n${jtbdText()}\nАльтернативы: ${state.jtbd.alternatives}\nТриггер: ${state.jtbd.trigger}\nБарьеры: ${state.jtbd.barriers}\n\nПОРТРЕТ\n${state.persona.name}; ${state.persona.role}\n${state.persona.environment}\nКритерий успеха: ${state.persona.success}\nФраза: ${state.persona.quote}\n\nГИПОТЕЗЫ\n${state.hypotheses.map((h,i)=>`${i+1}. ${h.text}\nМетод: ${h.method}\nКритерий: ${h.criterion}`).join("\n\n")}\n\nВЫВОД\n${state.conclusion}`;
}

function bindValue(selector,key){
  const el=$(selector);if(!el)return;
  const handler=e=>{state[key]=e.target.value;saveState()};
  el.addEventListener("input",handler);el.addEventListener("change",handler);
}
