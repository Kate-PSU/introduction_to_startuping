"use strict";

const STARTUPS=[
 {id:"duolingo",name:"Duolingo",hint:"Обучение языкам",domain:"duolingo.com"},
 {id:"grammarly",name:"Grammarly",hint:"Помощник для письменной речи",domain:"grammarly.com"},
 {id:"deepl",name:"DeepL",hint:"Машинный перевод и письмо",domain:"deepl.com"},
 {id:"quillbot",name:"QuillBot",hint:"Перефразирование и работа с текстом",domain:"quillbot.com"},
 {id:"lingualeo",name:"LinguaLeo",hint:"Изучение иностранных языков",domain:"lingualeo.com"},
 {id:"other",name:"Другой проект",hint:"По согласованию с преподавателем",domain:""}
];
const SCENARIOS=[
 {id:"campus",name:"Campus Lingua",text:"Приложение помогает иностранным студентам понимать университетские документы и общаться с преподавателями."},
 {id:"author",name:"StoryVoice",text:"Платформа помогает авторам создавать интерактивные истории и многоязычные диалоги персонажей."},
 {id:"industry",name:"TermPilot",text:"Сервис извлекает отраслевые термины, предлагает перевод и формирует корпоративные глоссарии."}
];
const ROLES=[
 {id:"product",name:"Product Manager",cost:3,emoji:"🧭",note:"Ценность продукта и приоритеты"},
 {id:"linguist",name:"Лингвист",cost:2,emoji:"🔤",note:"Языковые данные и качество"},
 {id:"developer",name:"NLP/ML-разработчик",cost:4,emoji:"🤖",note:"Модели, данные и код"},
 {id:"designer",name:"UX/UI-дизайнер",cost:2,emoji:"🎨",note:"Сценарии и удобство"},
 {id:"marketing",name:"Маркетолог",cost:2,emoji:"📣",note:"Аудитория и продвижение"},
 {id:"sales",name:"Специалист по продажам",cost:2,emoji:"🤝",note:"Клиенты и выручка"},
 {id:"legal",name:"Юрист по данным",cost:2,emoji:"🛡️",note:"Приватность и риски"},
 {id:"content",name:"Автор контента",cost:1,emoji:"✍️",note:"Примеры и материалы"}
];
const CRISES=[
 {icon:"🎯",title:"Пользователей почти нет",text:"Технология работает, но целевая аудитория не понимает, зачем ей продукт."},
 {icon:"⚠️",title:"Ошибки в языковых рекомендациях",text:"Первые пользователи обнаружили систематические неточности и перестали доверять сервису."},
 {icon:"💸",title:"Бюджет сокращён",text:"На ближайшие три месяца можно сохранить только ключевые функции и перераспределить обязанности."},
 {icon:"🔐",title:"Требование защитить данные",text:"Партнёр требует доказать, что персональные и языковые данные пользователей обрабатываются безопасно."},
 {icon:"🌍",title:"Выход в другую страну",text:"Появился зарубежный партнёр, но продукт нужно адаптировать к новой культуре и образовательной системе."},
 {icon:"💬",title:"Спор о целевой аудитории",text:"Половина команды делает продукт для студентов, другая — для преподавателей. Разработка остановилась."}
];
const blank=()=>({step:0,startup:"",otherStartup:"",founders:"",competencies:"",roleMap:"",complementarity:"",missing:"",evolution:"",source1:"",source2:"",scenario:"campus",roles:[],rationale:"",leader:"",gaps:"",combined:"",crisis:null,change:"",crisisDecision:""});
let state=load();
const $=s=>document.querySelector(s),stage=$("#stage");

function load(){try{return {...blank(),...JSON.parse(localStorage.getItem("teamLabState")||"{}")}}catch{return blank()}}
function save(){localStorage.setItem("teamLabState",JSON.stringify(state));const s=$("#saved");if(s){s.textContent="Сохранено";setTimeout(()=>s.textContent="Сохранение включено",800)}}
function esc(v=""){return String(v).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
function show(id){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");window.scrollTo({top:0,behavior:"smooth"})}
function toast(text){const t=$("#toast");t.textContent=text;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1600)}
function complete(n){if(n===0)return !!(state.startup&&state.founders&&state.competencies&&state.roleMap&&state.complementarity&&state.missing&&state.evolution&&state.source1&&state.source2&&(state.startup!=="other"||state.otherStartup));if(n===1)return state.roles.length>=3&&budget()<=12&&!!(state.rationale&&state.leader&&state.gaps&&state.combined);if(n===2)return state.crisis!==null&&!!(state.change&&state.crisisDecision);return complete(0)&&complete(1)&&complete(2)}
function progress(){return [complete(0),complete(1),complete(2),complete(3)].filter(Boolean).length*25}
function budget(){return state.roles.reduce((sum,id)=>sum+(ROLES.find(r=>r.id===id)?.cost||0),0)}
function updateChrome(){const p=progress();$("#progressBar").style.width=`${p}%`;$("#progressText").textContent=`${p}%`;document.querySelectorAll(".steps button").forEach((b,i)=>{b.classList.toggle("current",i===state.step);b.classList.toggle("done",complete(i))})}
function panelHead(icon,title,text){return `<div class="panel-head"><div><p class="eyebrow">Этап ${state.step+1} из 4</p><h2>${title}</h2><p class="lead">${text}</p></div><div class="icon">${icon}</div></div>`}
function nav(back=true,next=true,label="Продолжить →"){return `<div class="actions">${back?'<button id="back" class="secondary">← Назад</button>':'<span></span>'}${next?`<button id="next" class="primary">${label}</button>`:""}</div>`}
function bindNav(){const b=$("#back"),n=$("#next");if(b)b.onclick=()=>go(state.step-1);if(n)n.onclick=()=>{if(!complete(state.step)){toast("Сначала заполните обязательные поля этапа");return}go(state.step+1)}}
function go(n){if(n<0)return show("#welcome");if(n>3)n=3;state.step=n;save();render();window.scrollTo({top:0,behavior:"smooth"})}
function input(id,key){const el=$(`#${id}`);if(!el)return;el.oninput=()=>{state[key]=el.value.trim();save();updateChrome()}}
function render(){[renderResearch,renderBuilder,renderCrisis,renderPassport][state.step]();updateChrome();bindNav()}

function renderResearch(){
 stage.innerHTML=`<section class="panel">${panelHead("🔎","Детективное исследование","Выберите реальный лингвистический стартап и восстановите логику формирования его команды.")}<div class="notice"><strong>Правило исследования:</strong> используйте минимум два источника. Ответ нейросети без проверки источников не считается исследованием.</div><div class="startup-grid">${STARTUPS.map(s=>`<button class="startup-card ${state.startup===s.id?"selected":""}" data-id="${s.id}"><strong>${s.name}</strong><span>${s.hint}</span>${s.domain?`<small>${s.domain}</small>`:""}</button>`).join("")}</div><div class="form-grid">${state.startup==="other"?`<div class="field full"><label for="otherStartup">Название проекта *</label><input id="otherStartup" value="${esc(state.otherStartup)}"></div>`:""}<div class="field"><label for="founders">Основатели и их опыт *</label><textarea id="founders" placeholder="Кто создал проект? Чем они занимались раньше?">${esc(state.founders)}</textarea></div><div class="field"><label for="competencies">Исходные компетенции *</label><textarea id="competencies" placeholder="Технологии, языки, бизнес, образование…">${esc(state.competencies)}</textarea></div><div class="field"><label for="roleMap">Распределение ролей *</label><textarea id="roleMap" placeholder="Кто отвечал за продукт, технологию, язык и продвижение?">${esc(state.roleMap)}</textarea></div><div class="field"><label for="complementarity">Как участники дополняли друг друга? *</label><textarea id="complementarity">${esc(state.complementarity)}</textarea></div><div class="field"><label for="missing">Кого не хватало на старте? *</label><textarea id="missing">${esc(state.missing)}</textarea></div><div class="field"><label for="evolution">Как команда изменилась? *</label><textarea id="evolution">${esc(state.evolution)}</textarea></div><div class="field"><label for="source1">Источник 1 *</label><input id="source1" type="url" placeholder="https://..." value="${esc(state.source1)}"><small>Желательно официальный сайт или интервью основателя.</small></div><div class="field"><label for="source2">Источник 2 *</label><input id="source2" type="url" placeholder="https://..." value="${esc(state.source2)}"><small>Используйте независимый источник для проверки.</small></div></div>${nav(true,true)}</section>`;
 document.querySelectorAll(".startup-card").forEach(b=>b.onclick=()=>{state.startup=b.dataset.id;save();render()});["otherStartup","founders","competencies","roleMap","complementarity","missing","evolution","source1","source2"].forEach(id=>input(id,id));
}

function renderBuilder(){
 const spent=budget(),over=spent>12;
 stage.innerHTML=`<section class="panel">${panelHead("🧩","Конструктор команды","Соберите команду для нового лингвистического продукта. Бюджет ограничен 12 жетонами.")}<div class="field"><label for="scenario">Проект команды</label><select id="scenario">${SCENARIOS.map(s=>`<option value="${s.id}" ${state.scenario===s.id?"selected":""}>${s.name}</option>`).join("")}</select></div><div class="scenario"><h3>${SCENARIOS.find(s=>s.id===state.scenario).name}</h3><p>${SCENARIOS.find(s=>s.id===state.scenario).text}</p></div><div class="budget"><div><span>Потрачено</span><br><strong>${spent} / 12 жетонов</strong></div><div class="meter ${over?"over":""}"><span style="width:${Math.min(100,spent/12*100)}%"></span></div><span>${over?"Бюджет превышен":"Можно выбрать ещё"}</span></div><div class="role-grid">${ROLES.map(r=>`<button class="role-card ${state.roles.includes(r.id)?"selected":""}" data-id="${r.id}"><span class="cost">${r.cost}</span><span class="emoji">${r.emoji}</span><strong>${r.name}</strong><small>${r.note}</small></button>`).join("")}</div><div class="form-grid" style="margin-top:22px"><div class="field"><label for="rationale">Почему выбраны эти роли? *</label><textarea id="rationale">${esc(state.rationale)}</textarea></div><div class="field"><label for="leader">Кто принимает продуктовые решения? *</label><textarea id="leader">${esc(state.leader)}</textarea></div><div class="field"><label for="gaps">Каких компетенций пока не хватает? *</label><textarea id="gaps">${esc(state.gaps)}</textarea></div><div class="field"><label for="combined">Какие обязанности можно совмещать? *</label><textarea id="combined">${esc(state.combined)}</textarea></div></div>${nav(true,true)}</section>`;
 $("#scenario").onchange=e=>{state.scenario=e.target.value;save();render()};document.querySelectorAll(".role-card").forEach(b=>b.onclick=()=>{const id=b.dataset.id;state.roles=state.roles.includes(id)?state.roles.filter(x=>x!==id):[...state.roles,id];save();render()});["rationale","leader","gaps","combined"].forEach(id=>input(id,id));
}

function renderCrisis(){
 const c=state.crisis===null?null:CRISES[state.crisis];
 stage.innerHTML=`<section class="panel">${panelHead("⚡","Испытание кризисом","Проверьте, выдержит ли выбранная команда неожиданное изменение условий.")}${c?`<div class="crisis"><h3>${c.icon} ${c.title}</h3><p>${c.text}</p></div>`:`<div class="crisis-card"><div class="big">🎲</div><h3>Команда пока не знает, что произойдёт</h3><p>Откройте случайную кризисную карточку.</p><button id="drawCrisis" class="primary">Открыть карточку</button></div>`}${c?`<div class="form-grid"><div class="field"><label for="change">Что вы измените в составе или ролях? *</label><textarea id="change" placeholder="Можно заменить одного специалиста или перераспределить обязанности.">${esc(state.change)}</textarea></div><div class="field"><label for="crisisDecision">Обоснуйте решение *</label><textarea id="crisisDecision" placeholder="Почему это изменение поможет команде справиться?">${esc(state.crisisDecision)}</textarea></div></div><div class="actions"><button id="newCrisis" class="danger">Получить другую карточку</button></div>`:""}${nav(true,!!c,"Сформировать паспорт →")}</section>`;
 if(!c)$("#drawCrisis").onclick=()=>{state.crisis=Math.floor(Math.random()*CRISES.length);save();render()};else{$("#newCrisis").onclick=()=>{state.crisis=(state.crisis+1+Math.floor(Math.random()*(CRISES.length-1)))%CRISES.length;state.change="";state.crisisDecision="";save();render()};input("change","change");input("crisisDecision","crisisDecision")}
}

function renderPassport(){
 const startup=state.startup==="other"?state.otherStartup:STARTUPS.find(s=>s.id===state.startup)?.name;
 const scenario=SCENARIOS.find(s=>s.id===state.scenario),crisis=CRISES[state.crisis];
 const roles=state.roles.map(id=>ROLES.find(r=>r.id===id));
 stage.innerHTML=`<section class="panel">
  ${panelHead("📋","Паспорт команды","Используйте итог как основу для минутной защиты решения.")}
  <div class="completion"><strong>100%</strong><div><b>Исследование завершено</b><br><span>Команда прошла проверку фактами, бюджетом и кризисом.</span></div></div>
  <div id="passport" class="passport" style="margin-top:22px">
   <div class="passport-section"><h3>1. Исследованный стартап</h3><p><strong>${esc(startup)}</strong></p><p><b>Основатели:</b> ${esc(state.founders)}</p><p><b>Компетенции:</b> ${esc(state.competencies)}</p><p><b>Роли:</b> ${esc(state.roleMap)}</p><p><b>Дополняемость:</b> ${esc(state.complementarity)}</p><p><b>Развитие команды:</b> ${esc(state.evolution)}</p><p><b>Источники:</b><br>${esc(state.source1)}<br>${esc(state.source2)}</p></div>
   <div class="passport-section"><h3>2. Собственная команда — ${esc(scenario.name)}</h3><p>${esc(scenario.text)}</p><div class="role-tags">${roles.map(r=>`<span>${r.emoji} ${r.name}</span>`).join("")}</div><p><b>Бюджет:</b> ${budget()} из 12 жетонов</p><p><b>Логика выбора:</b> ${esc(state.rationale)}</p><p><b>Продуктовые решения:</b> ${esc(state.leader)}</p><p><b>Дефицит компетенций:</b> ${esc(state.gaps)}</p><p><b>Совмещение ролей:</b> ${esc(state.combined)}</p></div>
   <div class="passport-section"><h3>3. Кризис: ${crisis.icon} ${esc(crisis.title)}</h3><p>${esc(crisis.text)}</p><p><b>Изменение:</b> ${esc(state.change)}</p><p><b>Обоснование:</b> ${esc(state.crisisDecision)}</p></div>
  </div>
  <div class="actions"><button id="back" class="secondary">← Вернуться к решениям</button><div><button id="copy" class="secondary">Скопировать паспорт</button> <button id="print" class="primary">Печать / PDF</button></div></div>
 </section>`;
 $("#copy").onclick=async()=>{const text=$("#passport").innerText;try{await navigator.clipboard.writeText(text);toast("Паспорт скопирован")}catch{toast("Не удалось скопировать")}};
 $("#print").onclick=()=>window.print();
}

$("#startBtn").onclick=()=>{show("#workspace");render()};
document.querySelectorAll(".steps button").forEach(b=>b.onclick=()=>{const n=+b.dataset.step;if(n<=state.step||complete(n-1))go(n);else toast("Сначала завершите предыдущий этап")});
