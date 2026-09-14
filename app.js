"use strict";

const TYPES = [
  {id:"lifestyle",name:"Lifestyle Startup",short:"Проект поддерживает выбранный образ жизни основателя.",clue:"Основатель создаёт языковой клуб вокруг своего увлечения и хочет получить устойчивую занятость без глобальной экспансии."},
  {id:"small",name:"Small-Business Startup",short:"Малая компания решает локальную потребность.",clue:"Команда запускает сервис устного перевода для мероприятий в одном городе и ориентируется на местные компании."},
  {id:"scalable",name:"Scalable Startup",short:"Проект рассчитан на быстрый рост и глобальный рынок.",clue:"Платформа автоматической проверки текста сразу проектируется для миллионов пользователей и нескольких стран."},
  {id:"buyable",name:"Buyable Startup",short:"Продукт создают с расчётом на последующую продажу.",clue:"Небольшая команда разрабатывает уникальный модуль перефразирования, чтобы заинтересовать крупную образовательную платформу."},
  {id:"large",name:"Large-Company Startup",short:"Новый продукт запускает крупная компания.",clue:"Международная корпорация создаёт внутри отдельную команду для нового сервиса машинного перевода."},
  {id:"social",name:"Social Startup",short:"Главная цель связана с общественно значимой проблемой.",clue:"Приложение бесплатно помогает мигрантам понимать документы и получать доступ к важным услугам."},
  {id:"creative",name:"Creative Startup",short:"Проект создаёт новый продукт в сфере творчества или медиа.",clue:"Сервис помогает авторам интерактивных историй создавать диалоги на разных языках."}
];

const state={mission:0,score:0,scores:[],sound:true,selected:new Set(),dragged:null,audioIndex:0,rapidIndex:0,rapidCorrect:0};
const $=s=>document.querySelector(s);
const stage=$("#stage"), scoreLabel=$("#scoreLabel");

function show(id){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");window.scrollTo({top:0,behavior:"smooth"})}
function tone(freq=540,duration=.1,type="sine"){
  if(!state.sound)return;
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  const ctx=new C(),o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.06,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration);o.onended=()=>ctx.close();
}
function celebrate(){tone(660,.08);setTimeout(()=>tone(880,.13),90)}
function fail(){tone(190,.18,"sawtooth")}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1700)}
function setScore(points){state.score+=points;state.scores.push(points);scoreLabel.textContent=`${state.score} очков`}
function updateProgress(){const n=state.mission+1;$("#missionLabel").textContent=`Миссия ${n} из 5`;$("#progressPercent").textContent=`${n*20}%`;$("#progressBar").style.width=`${n*20}%`}
function next(points){setScore(points);state.mission++;if(state.mission>=5)return finish();updateProgress();render()}
function feedback(text,good){return `<div class="feedback ${good?"good":"bad"}">${text}</div>`}
function head(icon,title,text){return `<div class="stage-head"><div><p class="eyebrow">Миссия ${state.mission+1}</p><h2>${title}</h2><p>${text}</p></div><div class="stage-icon">${icon}</div></div>`}

function render(){[
  renderSignals,renderDrag,renderAudio,renderBuilder,renderRapid
][state.mission]()}

function renderSignals(){
  const options=["Инновации","Высокая определённость","Поиск масштабируемой модели","Работа только по готовой схеме","Рост и изменения","Гарантированная прибыль"];
  stage.innerHTML=`<article class="stage-card">${head("📡","Сканер признаков","Выберите три признака стартапа, отмеченные в лекции.")}<div class="choice-grid">${options.map((x,i)=>`<button class="choice" data-i="${i}"><span class="choice-num">${i+1}</span>${x}</button>`).join("")}</div><div id="missionFeedback"></div><div class="stage-actions"><button id="checkSignals" class="primary" disabled>Проверить</button></div></article>`;
  document.querySelectorAll(".choice").forEach(b=>b.onclick=()=>{const i=+b.dataset.i;state.selected.has(i)?state.selected.delete(i):state.selected.add(i);b.classList.toggle("selected");$("#checkSignals").disabled=state.selected.size!==3;tone(420,.05)});
  $("#checkSignals").onclick=()=>{const right=[0,2,4],ok=right.every(x=>state.selected.has(x));document.querySelectorAll(".choice").forEach((b,i)=>b.classList.add(right.includes(i)?"correct":state.selected.has(i)?"wrong":""));$("#missionFeedback").innerHTML=feedback(ok?"Точно. Стартап связан с инновациями, поиском масштабируемой модели и стремлением к росту.":"Проверьте выбор. В лекции ключевыми названы инновации, поиск масштабируемой модели, рост и изменения.",ok);ok?celebrate():fail();const btn=$("#checkSignals");btn.textContent="Продолжить";btn.disabled=false;btn.onclick=()=>{state.selected.clear();next(ok?20:10)}};
}

function renderDrag(){
  const cards=[TYPES[2],TYPES[5],TYPES[4],TYPES[1]];
  const zones=[TYPES[1],TYPES[2],TYPES[4],TYPES[5]];
  stage.innerHTML=`<article class="stage-card">${head("🧩","Сортировочный ангар","Перетащите четыре ситуации к подходящим типам. Можно также выбрать карточку, затем нажать на область.")}<div class="drag-layout"><div class="drag-stack">${cards.map(t=>`<div class="drag-card" draggable="true" tabindex="0" role="button" aria-pressed="false" data-id="${t.id}">${t.clue}</div>`).join("")}</div><div class="drop-grid">${zones.map(t=>`<button class="drop-zone" data-id="${t.id}"><strong>${t.name}</strong><span>${t.short}</span></button>`).join("")}</div></div><div id="missionFeedback"></div><div class="stage-actions"><button id="checkDrag" class="primary" disabled>Проверить</button></div></article>`;
  const placements={};
  function select(card){if(card.classList.contains("placed"))return;document.querySelectorAll(".drag-card").forEach(c=>c.setAttribute("aria-pressed","false"));state.dragged=card.dataset.id;card.setAttribute("aria-pressed","true")}
  function place(zone,id){if(!id||zone.classList.contains("filled"))return;const card=document.querySelector(`.drag-card[data-id="${id}"]`);if(!card||card.classList.contains("placed"))return;placements[zone.dataset.id]=id;zone.classList.add("filled");zone.innerHTML+=`<small>${card.textContent}</small>`;card.classList.add("placed");card.setAttribute("aria-pressed","false");state.dragged=null;$("#checkDrag").disabled=Object.keys(placements).length!==4;tone(460,.06)}
  document.querySelectorAll(".drag-card").forEach(c=>{c.onclick=()=>select(c);c.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();select(c)}};c.ondragstart=e=>{state.dragged=c.dataset.id;e.dataTransfer.setData("text/plain",c.dataset.id)}});
  document.querySelectorAll(".drop-zone").forEach(z=>{z.onclick=()=>place(z,state.dragged);z.ondragover=e=>e.preventDefault();z.ondrop=e=>{e.preventDefault();place(z,e.dataTransfer.getData("text/plain"))}});
  $("#checkDrag").onclick=()=>{let correct=0;document.querySelectorAll(".drop-zone").forEach(z=>{const ok=placements[z.dataset.id]===z.dataset.id;z.classList.add(ok?"correct":"wrong");correct+=ok});const pts=correct*5;$("#missionFeedback").innerHTML=feedback(`${correct} из 4. ${correct===4?"Все ситуации распределены верно.":"Сравните главную цель проекта: локальная потребность, глобальный рост, инициатива корпорации или социальная задача."}`,correct===4);correct===4?celebrate():fail();const b=$("#checkDrag");b.textContent="Продолжить";b.onclick=()=>next(pts)};
}

const AUDIO=[TYPES[3],TYPES[0],TYPES[6]];
function speak(text,button){
  if(!("speechSynthesis" in window)){toast("Озвучивание не поддерживается браузером");return}
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="ru-RU";u.rate=.92;button.classList.add("playing");u.onend=()=>button.classList.remove("playing");speechSynthesis.speak(u)
}
function renderAudio(){
  const item=AUDIO[state.audioIndex];
  stage.innerHTML=`<article class="stage-card">${head("🎧","Радиоперехват","Прослушайте описание и выберите тип стартапа. Три сигнала подряд.")}<div class="audio-console"><button id="playClue" class="audio-orb" aria-label="Прослушать описание">▶</button><div><strong>Сигнал ${state.audioIndex+1} из 3</strong><div class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><button id="textClue" class="secondary">Показать текст</button></div></div><div id="clueText" class="scenario" hidden>${item.clue}</div><div class="choice-grid">${TYPES.map(t=>`<button class="choice" data-id="${t.id}">${t.name}</button>`).join("")}</div><div id="missionFeedback"></div></article>`;
  $("#playClue").onclick=()=>speak(item.clue,$("#playClue"));$("#textClue").onclick=()=>{$("#clueText").hidden=false};document.querySelectorAll(".choice").forEach(b=>b.onclick=()=>{if("speechSynthesis" in window)window.speechSynthesis.cancel();const ok=b.dataset.id===item.id;b.classList.add(ok?"correct":"wrong");$("#missionFeedback").innerHTML=feedback(ok?`Верно: ${item.name}.`:`Это ${item.name}. Главный ориентир: ${item.short.toLowerCase()}`,ok);ok?celebrate():fail();document.querySelectorAll(".choice").forEach(x=>x.disabled=true);setTimeout(()=>{state.rapidCorrect+=(ok?1:0);state.audioIndex++;if(state.audioIndex<3)renderAudio();else{const pts=state.rapidCorrect*5+5;state.rapidCorrect=0;next(pts)}},1200)})
}

function renderBuilder(){
  stage.innerHTML=`<article class="stage-card">${head("🛠️","Конструктор стратегии","Изменяйте параметры и наблюдайте, как меняется наиболее вероятный тип проекта. Здесь нет штрафа: исследуйте связи.")}<div class="builder"><div class="builder-row"><label for="scale">Масштаб рынка</label><input id="scale" type="range" min="0" max="2" value="1" step="1"><div class="scale-labels"><span>локальный</span><span>национальный</span><span>глобальный</span></div></div><div class="builder-row"><label for="goal">Главная цель</label><input id="goal" type="range" min="0" max="2" value="1" step="1"><div class="scale-labels"><span>образ жизни</span><span>общественная польза</span><span>быстрый рост</span></div></div><div class="builder-row"><label for="origin">Где возник проект</label><input id="origin" type="range" min="0" max="1" value="0" step="1"><div class="scale-labels"><span>независимая команда</span><span>крупная компания</span></div></div></div><div id="profile" class="profile-output"></div><div class="stage-actions"><button id="builderDone" class="primary">Я понял связь</button></div></article>`;
  function update(){const s=+$(`#scale`).value,g=+$(`#goal`).value,o=+$(`#origin`).value;let t=o?TYPES[4]:g===0?TYPES[0]:g===1?TYPES[5]:s===2?TYPES[2]:TYPES[1];$("#profile").innerHTML=`Вероятный профиль: <strong>${t.name}</strong><br>${t.short} Один проект может сочетать несколько признаков, поэтому тип выбирают по доминирующей цели и стратегии.`;tone(330+s*70+g*40,.04)}
  ["scale","goal","origin"].forEach(id=>$(`#${id}`).oninput=update);update();$("#builderDone").onclick=()=>{celebrate();next(20)}
}

const RAPID=[
  {q:"Команда разрабатывает продукт специально для продажи крупному игроку.",a:"buyable",why:"Цель проекта связана с последующим приобретением."},
  {q:"Новый языковой сервис создаётся как отдельная инициатива внутри корпорации.",a:"large",why:"Проект запускает крупная компания."},
  {q:"Продукт рассчитан на быстрый выход на международный рынок.",a:"scalable",why:"Ключевой признак — масштабируемый рост."},
  {q:"Главная цель проекта — решить общественно значимую языковую проблему.",a:"social",why:"Социальный эффект определяет стратегию."}
];
function renderRapid(){const x=RAPID[state.rapidIndex];stage.innerHTML=`<article class="stage-card">${head("⚡","Финальный спринт","Определите тип по главной цели. За каждый точный ответ начисляется 5 очков.")}<div class="scenario"><strong>${state.rapidIndex+1}/4</strong><br>${x.q}</div><div class="choice-grid">${TYPES.map(t=>`<button class="choice" data-id="${t.id}">${t.name}</button>`).join("")}</div><div id="missionFeedback"></div></article>`;document.querySelectorAll(".choice").forEach(b=>b.onclick=()=>{const ok=b.dataset.id===x.a;b.classList.add(ok?"correct":"wrong");$("#missionFeedback").innerHTML=feedback(ok?`Верно. ${x.why}`:`Подходящий ответ: ${TYPES.find(t=>t.id===x.a).name}. ${x.why}`,ok);ok?celebrate():fail();document.querySelectorAll(".choice").forEach(z=>z.disabled=true);state.rapidCorrect+=ok?1:0;setTimeout(()=>{state.rapidIndex++;if(state.rapidIndex<4)renderRapid();else{const pts=state.rapidCorrect*5;state.rapidCorrect=0;next(pts)}},1050)})}

function finish(){show("#resultScreen");const n=state.score;$("#finalScore").textContent=n;document.querySelector(".score-ring").style.setProperty("--score-angle",`${n*3.6}deg`);let title,text,badge;if(n>=85){title="Стартап вышел на орбиту";text="Вы уверенно различаете типы стартапов и связываете их с целями и стратегиями.";badge="🚀"}else if(n>=60){title="Система почти готова";text="Основные различия понятны. Повторите типы, которые определяются по цели создания и происхождению проекта.";badge="🛰️"}else{title="Нужна повторная калибровка";text="Вернитесь к лекции и сравните типы по трём вопросам: кто запускает проект, для какого рынка и с какой главной целью.";badge="🧭"}$("#resultTitle").textContent=title;$("#resultText").textContent=text;$("#resultBadge").textContent=badge;$("#resultBreakdown").innerHTML=state.scores.map((x,i)=>`<span class="tag">Миссия ${i+1}: ${x}/20</span>`).join("");localStorage.setItem("startupMissionBest",Math.max(n,+(localStorage.getItem("startupMissionBest")||0)));celebrate()}
function reset(){Object.assign(state,{mission:0,score:0,scores:[],selected:new Set(),dragged:null,audioIndex:0,rapidIndex:0,rapidCorrect:0});scoreLabel.textContent="0 очков";updateProgress();show("#playScreen");render()}

$("#startBtn").onclick=reset;$("#restartBtn").onclick=reset;$("#soundBtn").onclick=e=>{state.sound=!state.sound;e.currentTarget.textContent=state.sound?"🔊":"🔇";e.currentTarget.setAttribute("aria-pressed",String(state.sound));e.currentTarget.title=state.sound?"Выключить звук":"Включить звук";if(!state.sound&&"speechSynthesis" in window)speechSynthesis.cancel()};$("#copyBtn").onclick=async()=>{const text=`Стартап-миссия: ${state.score} из 100 очков.`;try{await navigator.clipboard.writeText(text);toast("Результат скопирован")}catch{toast(text)}};
