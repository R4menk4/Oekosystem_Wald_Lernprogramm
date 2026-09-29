(()=>{
  const pages=[...document.querySelectorAll('.page')];
  const navButtons=[...document.querySelectorAll('[data-page]')];
  const key='wald-lernprogramm-v2';
  let state={page:0,visited:[0],results:{},texts:{},self:''};
  try{state={...state,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{}
  const save=()=>localStorage.setItem(key,JSON.stringify(state));
  const feedback=(el,ok,text)=>{el.textContent=(ok?'✓ ':'✗ ')+text;el.className='feedback '+(ok?'correct':'incorrect')};

  function showPage(index){
    index=Math.max(0,Math.min(index,pages.length-1));state.page=index;if(!state.visited.includes(index))state.visited.push(index);
    pages.forEach((p,i)=>p.classList.toggle('active',i===index));
    navButtons.forEach((b,i)=>{b.toggleAttribute('aria-current',i===index);b.classList.toggle('done',state.visited.includes(i)&&i!==index)});
    document.querySelector('#progressText').textContent=`${index+1} von ${pages.length}`;
    document.querySelector('#progressBar').style.width=`${Math.round(((new Set(state.visited).size-1)/(pages.length-1))*100)}%`;
    document.querySelector('#prevButton').disabled=index===0;
    document.querySelector('#nextButton').textContent=index===pages.length-1?'Zum Start':'Weiter →';
    document.querySelector('#sidebar').classList.remove('open');document.querySelector('#menuButton').setAttribute('aria-expanded','false');
    save();document.querySelector('#main').focus();window.scrollTo({top:0,behavior:'smooth'});
  }
  navButtons.forEach(b=>b.addEventListener('click',()=>showPage(Number(b.dataset.page))));
  document.querySelector('#prevButton').addEventListener('click',()=>showPage(state.page-1));
  document.querySelector('#nextButton').addEventListener('click',()=>showPage(state.page===pages.length-1?0:state.page+1));
  document.querySelector('#menuButton').addEventListener('click',e=>{const side=document.querySelector('#sidebar');const open=side.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(open))});

  document.querySelectorAll('.quiz').forEach((form,index)=>form.addEventListener('submit',event=>{
    event.preventDefault();const chosen=form.querySelector('input:checked');const out=form.querySelector('.feedback');
    if(!chosen){feedback(out,false,'Wähle zuerst eine Antwort.');return}
    const ok=chosen.value===form.dataset.answer;state.results['quiz-'+index]=ok;feedback(out,ok,ok?form.dataset.ok:form.dataset.no);save();
  }));

  document.querySelectorAll('.saved-text').forEach(area=>{area.value=state.texts[area.dataset.save]||'';area.addEventListener('input',()=>{state.texts[area.dataset.save]=area.value;save()})});

  function initSort(task,index){
    const list=task.querySelector('.sort-list'),expected=task.dataset.order.split(','),out=task.querySelector('.feedback');let dragged=null;
    list.querySelectorAll('li').forEach(item=>{
      item.addEventListener('dragstart',()=>{dragged=item;item.classList.add('dragging')});item.addEventListener('dragend',()=>{item.classList.remove('dragging');dragged=null});
      item.addEventListener('dragover',e=>{e.preventDefault();if(!dragged||dragged===item)return;const box=item.getBoundingClientRect();list.insertBefore(dragged,e.clientY<box.top+box.height/2?item:item.nextSibling)});
      item.querySelectorAll('[data-move]').forEach(button=>button.addEventListener('click',()=>{const up=button.dataset.move==='up';const sibling=up?item.previousElementSibling:item.nextElementSibling;if(!sibling)return;if(up)list.insertBefore(item,sibling);else list.insertBefore(sibling,item)}));
    });
    task.querySelector('.sort-check').addEventListener('click',()=>{const actual=[...list.children].map(x=>x.dataset.id);const ok=actual.every((x,i)=>x===expected[i]);state.results['sort-'+index]=ok;feedback(out,ok,ok?'Die Reihenfolge stimmt.':'Noch nicht. Prüfe Ursache und direkte Folge.');save()});
  }
  document.querySelectorAll('.sort-task').forEach(initSort);

  function initPairs(board,index){
    const pairs=JSON.parse(board.dataset.pairs),cards=[...board.querySelectorAll('.pair-card')],targets=[...board.querySelectorAll('.pair-target')],table=board.querySelector('.pair-table'),out=board.querySelector('.feedback');let selected='';const assigned={};
    const render=()=>{table.innerHTML='';Object.entries(assigned).forEach(([term,definition])=>{const row=document.createElement('div');row.className='pair-row';row.innerHTML=`<strong></strong><span></span>`;row.children[0].textContent=term;row.children[1].textContent=definition;table.append(row)});cards.forEach(c=>c.classList.toggle('selected',c.dataset.key===selected));targets.forEach(t=>t.classList.toggle('filled',Object.values(assigned).includes(t.dataset.value)))};
    const assign=(term,target)=>{if(!term)return;Object.keys(assigned).forEach(k=>{if(assigned[k]===target.dataset.value)delete assigned[k]});assigned[term]=target.dataset.value;selected='';render()};
    cards.forEach(card=>{card.addEventListener('click',()=>{selected=card.dataset.key;render()});card.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',card.dataset.key))});
    targets.forEach(target=>{target.addEventListener('click',()=>assign(selected,target));target.addEventListener('dragover',e=>e.preventDefault());target.addEventListener('drop',e=>{e.preventDefault();assign(e.dataTransfer.getData('text/plain'),target)})});
    board.querySelector('.check-pairs').addEventListener('click',()=>{const all=Object.keys(pairs).length===Object.keys(assigned).length;const ok=all&&Object.entries(pairs).every(([k,v])=>assigned[k]===v);[...table.children].forEach(row=>row.classList.toggle('wrong',pairs[row.children[0].textContent]!==row.children[1].textContent));state.results['pairs-'+index]=ok;feedback(out,ok,ok?'Alle Paare stimmen. Die Tabelle ist vollständig.':'Prüfe die rot markierten oder noch fehlenden Paare.');save()});render();
  }
  document.querySelectorAll('.pair-board').forEach(initPairs);

  const labelTask=document.querySelector('.number-label-task');if(labelTask){let selected='';const bank=[...labelTask.querySelectorAll('.label-bank button')],targets=[...labelTask.querySelectorAll('.number-targets button')];const select=term=>{selected=term;bank.forEach(b=>b.classList.toggle('selected',b.dataset.term===term))};const assign=(target,term)=>{if(!term)return;targets.forEach(t=>{if(t.dataset.value===term){delete t.dataset.value;t.textContent=t.dataset.number+' · Begriff ablegen';t.classList.remove('filled')}});target.dataset.value=term;target.textContent=target.dataset.number+' · '+term;target.classList.add('filled');selected='';select('')};bank.forEach(b=>{b.addEventListener('click',()=>select(b.dataset.term));b.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',b.dataset.term))});targets.forEach(t=>{t.addEventListener('click',()=>assign(t,selected));t.addEventListener('dragover',e=>e.preventDefault());t.addEventListener('drop',e=>{e.preventDefault();assign(t,e.dataTransfer.getData('text/plain'))})});labelTask.querySelector('.label-check').addEventListener('click',()=>{const ok=targets.every(t=>t.dataset.value===t.dataset.answer);feedback(labelTask.querySelector('.feedback'),ok,ok?'Beide Begriffe sind richtig zugeordnet.':'Prüfe: Welches Modell führt zum Ausgangspunkt zurück?')})}

  function initClassify(task,index){
    const answers=JSON.parse(task.dataset.answers),bank=task.querySelector('.classify-bank'),zones=[...task.querySelectorAll('.drop-zone')],out=task.querySelector('.feedback');let selected=null;
    const cards=()=>[...task.querySelectorAll('.classify-bank button,.drop-zone button')];const choose=card=>{selected=card;cards().forEach(c=>c.classList.toggle('selected',c===card))};
    const move=(card,zone)=>{if(!card)return;zone.append(card);selected=null;cards().forEach(c=>c.classList.remove('selected'))};
    cards().forEach(card=>{card.addEventListener('click',()=>choose(card));card.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',card.textContent.trim()))});
    zones.forEach(zone=>{zone.addEventListener('click',e=>{if(e.target===zone||e.target.tagName==='H3')move(selected,zone)});zone.addEventListener('dragover',e=>e.preventDefault());zone.addEventListener('drop',e=>{e.preventDefault();const text=e.dataTransfer.getData('text/plain');move(cards().find(c=>c.textContent.trim()===text),zone)})});
    task.querySelector('.classify-check').addEventListener('click',()=>{let placed=0,ok=true;zones.forEach(zone=>zone.querySelectorAll('button').forEach(card=>{placed++;const right=answers[card.textContent.trim()]===zone.dataset.category;card.style.borderColor=right?'#4f9b66':'#b33';if(!right)ok=false}));ok=ok&&placed===Object.keys(answers).length;state.results['classify-'+index]=ok;feedback(out,ok,ok?'Alles richtig sortiert.':'Noch nicht vollständig richtig. Prüfe die rot markierten Karten.');save()});
  }
  document.querySelectorAll('.classify-task,.evidence-board').forEach(initClassify);

  document.querySelectorAll('.reveal-grid').forEach(grid=>{const output=grid.querySelector('.reveal-output');grid.querySelectorAll('[data-reveal]').forEach(button=>button.addEventListener('click',()=>{if(button.classList.contains('revealed'))return;button.classList.add('revealed');button.querySelector('span').textContent='entdeckt';const p=document.createElement('p');p.textContent=button.dataset.reveal;output.append(p)}))});

  document.querySelectorAll('.chain-builder').forEach(builder=>builder.querySelector('.chain-check').addEventListener('click',()=>{const fields=[...builder.querySelectorAll('select')];const ok=fields.every(f=>f.value===f.dataset.answer);fields.forEach(f=>f.style.borderColor=f.value===f.dataset.answer?'#4f9b66':'#b33');feedback(builder.querySelector('.feedback'),ok,ok?'Alle drei Angepasstheitsketten stimmen.':'Prüfe die rot markierten Schritte. Frage dich: Was ermöglicht das Merkmal direkt?')}));

  document.querySelectorAll('.compare-tabs').forEach(tabs=>tabs.querySelectorAll('[role=tab]').forEach(button=>button.addEventListener('click',()=>{tabs.querySelectorAll('[role=tab]').forEach(b=>b.setAttribute('aria-selected',String(b===button)));tabs.querySelectorAll('[data-panel]').forEach(panel=>panel.hidden=panel.dataset.panel!==button.dataset.tab)})));
  document.querySelectorAll('[data-branch]').forEach(button=>button.addEventListener('click',()=>{
    const output=button.parentElement.querySelector('.branch-output');
    if(output.textContent==='Noch kein Bereich untersucht.')output.textContent='';
    button.classList.add('explored');
    if(output.querySelector(`[data-branch-result="${button.textContent}"]`))return;
    const item=document.createElement('p');item.dataset.branchResult=button.textContent;
    const title=document.createElement('strong');title.textContent=button.textContent+': ';
    item.append(title,document.createTextNode(button.dataset.branch));output.append(item);
  }));

  const self=document.querySelector('.self-check');if(self){const out=self.querySelector('p');if(state.self)out.textContent='Gespeichert: '+state.self;self.querySelectorAll('[data-level]').forEach(button=>{button.classList.toggle('selected',button.dataset.level===state.self);button.addEventListener('click',()=>{state.self=button.dataset.level;self.querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b===button));out.textContent='Gespeichert: '+state.self;save()})})}

  const dialog=document.querySelector('#progressDialog');document.querySelector('#overviewButton').addEventListener('click',()=>{const list=document.querySelector('#progressList');list.innerHTML='';pages.forEach((page,i)=>{const li=document.createElement('li');li.textContent=(state.visited.includes(i)?'✓ ':'○ ')+page.dataset.title;if(state.visited.includes(i))li.className='dialog-list-done';list.append(li)});dialog.showModal()});dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  document.querySelector('#resetButton').addEventListener('click',()=>{if(confirm('Möchtest du den gesamten gespeicherten Lernstand auf diesem Gerät löschen?')){localStorage.removeItem(key);location.reload()}});
  showPage(Math.min(state.page,pages.length-1));
})();
