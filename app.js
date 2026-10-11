'use strict';
// Test-branch build: live form connection enabled for delivery verification.
const CONFIG = { preview: false, provider: 'web3forms', endpoint: 'https://api.web3forms.com/submit', accessKey: 'c82d12d0-cc3d-4413-8ab0-8c5c8fa64764', bookingUrl: 'https://calendly.com/dustin-frostbotusa/15min' };
const money = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
function calculate(v) {
  const revenue=v.salesPerDay*v.ticketPrice*v.daysPerMonth*v.numMachines;
  const food=revenue*v.foodCost/100;
  const fees=revenue*(v.venueCost+v.processingCost)/100;
  return {revenue,annualRevenue:revenue*12,food,gross:revenue-food,fees,other:v.otherCost,remainder:revenue-food-fees-v.otherCost};
}
function buildLead(f,calc,context={}) {
  const map={'First Name':'firstName','Last Name':'lastName','Email':'email','Phone':'phone','Company':'company','City':'city','State':'state','Business Type':'businessType','Location Type':'locationType','Number of Machines':'machineCount','Financing Needed':'financing','Estimated Timeline':'timeline','Message':'message','Location Status':'hasLocation','Product Interest':'productInterest','Wrap Preference':'wrapPreference'};
  const lead={};for(const [name,key] of Object.entries(map))lead[name]=String(f.get(key)||'').trim();
  lead['Date and Time Submitted']=new Date().toLocaleString('en-US',{timeZone:'America/Chicago',dateStyle:'full',timeStyle:'short'});
  lead['Submission Time UTC']=new Date().toISOString();
  lead['Marketing SMS Consent']='Not collected — no marketing SMS opt-in';
  Object.assign(lead,calc,context);return lead;
}
async function submitLead(lead,config=CONFIG,request=fetch) {
  if(config.preview)return {success:true,preview:true};
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
  try {
    const response=await request(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},signal:controller.signal,body:JSON.stringify({access_key:config.accessKey,subject:'New FrostBot Pricing Request — '+lead['First Name']+' '+lead['Last Name'],from_name:'FrostBotUSA.com',replyto:lead.Email,botcheck:'',...lead})});
    const data=await response.json();if(!response.ok||data.success!==true)throw new Error('Submission failed');return data;
  } finally {clearTimeout(timeout);}
}
if(typeof module!=='undefined'&&module.exports)module.exports={calculate,buildLead,submitLead};
if(typeof document!=='undefined') {
  const $=id=>document.getElementById(id);
  function track(event,extra={}) {window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:(CONFIG.preview?'preview_':'')+event,...extra});}
  document.querySelectorAll('[data-track]').forEach(el=>el.addEventListener('click',()=>track('cta_click',{cta:el.dataset.track})));
  $('menuToggle').addEventListener('click',()=>{const open=$('mainNav').classList.toggle('open');$('menuToggle').setAttribute('aria-expanded',String(open));});
  $('mainNav').querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{$('mainNav').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false');}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('mainNav').classList.contains('open')){$('mainNav').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false');$('menuToggle').focus();}});
  document.querySelectorAll('[data-wrap-choice]').forEach(link=>link.addEventListener('click',()=>{$('wrapPreference').value=link.dataset.wrapChoice;$('wrapPreference').closest('details').open=true;if(link.dataset.wrapChoice==='Custom protein wrap')$('productInterest').value='Protein ice cream';}));
  const demoVideo=$('machineDemo');
  function playDemo(time){if(typeof time==='number')demoVideo.currentTime=time;const promise=demoVideo.play();if(promise&&promise.catch)promise.catch(()=>{demoVideo.focus();});}
  document.querySelectorAll('[data-play-demo]').forEach(a=>a.addEventListener('click',()=>playDemo()));
  document.querySelectorAll('[data-demo-time]').forEach(button=>button.addEventListener('click',()=>{const time=Number(button.dataset.demoTime);if(demoVideo.readyState>=1)playDemo(time);else{demoVideo.addEventListener('loadedmetadata',()=>playDemo(time),{once:true});demoVideo.load();}track('video_chapter',{seconds:time});}));
  demoVideo.addEventListener('play',()=>track('video_start',{video:'manufacturer_18s'}));
  demoVideo.addEventListener('ended',()=>track('video_complete',{video:'manufacturer_18s'}));
  const productCopy={protein:['A different reason to visit.','Exploring protein ice cream for your gym, workplace, or venue? Talk through the intended menu, mix compatibility, and operating requirements before choosing your setup.','Nutrition depends on the recipe, portion size, and toppings.'],classic:['A classic with a self-service twist.','Explore traditional soft serve for your indoor venue. Discuss the base mix, available toppings and sauces, and the configuration that suits your intended menu.','Menu availability depends on the model, supplies, and setup you choose.']};
  const tabs=[...document.querySelectorAll('[data-product]')];
  function selectProduct(tab){tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1;});const c=productCopy[tab.dataset.product];$('productPanel').innerHTML='<h3>'+c[0]+'</h3><p>'+c[1]+'</p><p class="small-note">'+c[2]+'</p>';$('productPanel').setAttribute('aria-labelledby',tab.id);$('productInterest').value=tab.dataset.product==='protein'?'Protein ice cream':'Traditional soft serve';track('product_select',{product:tab.dataset.product});}
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectProduct(tab));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();selectProduct(tabs[next]);tabs[next].focus();}});});
  const venues={gym:['Make it part of the visit.','For a gym, evaluate more than membership count.',['Member interest in the proposed menu and price.','Visibility near the exit or a natural gathering point.','Venue permission, utilities, and servicing access.']],campus:['Work with the campus routine.','For a university, account for how campus life changes through the year.',['Dining contracts and approval from the right department.','Term dates, breaks, and realistic operating hours.','Placement, payment needs, and regular service access.']],hospital:['Plan around a working facility.','For a hospital, consider staff, visitors, and facility requirements.',['Food-service approval and any applicable nutrition policies.','Placement that does not obstruct care or circulation.','Cleaning, servicing access, and actual demand by shift.']],office:['Understand the everyday audience.','For a workplace, use actual attendance rather than total headcount.',['On-site attendance by day and time.','Competing food options and likely purchase frequency.','An accountable owner for restocking, care, and customer issues.']],entertainment:['Account for the peaks and quiet days.','For an entertainment venue, match your plan to how guests use the space.',['Event schedules, seasonality, and dwell time.','Peak demand, serving capacity, and queue placement.','Venue fees, utilities, storage, and restocking access.']]};
  document.querySelectorAll('[data-venue]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-venue]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));const v=venues[button.dataset.venue];$('fitResult').innerHTML='<h3>'+v[0]+'</h3><p>'+v[1]+'</p><ul>'+v[2].map(x=>'<li>'+x+'</li>').join('')+'</ul>';track('location_explore',{venue:button.dataset.venue});}));
  const calcIds=['salesPerDay','ticketPrice','daysPerMonth','numMachines','foodCost','venueCost','processingCost','otherCost'];let calculatorChanged=false;
  function calcValues(){return Object.fromEntries(calcIds.map(id=>[id,Number($(id).value)]));}
  function validCalculator(){return calcIds.every(id=>$(id).value.trim()!==''&&$(id).checkValidity()&&Number.isFinite(Number($(id).value)));}
  function updateCalculator(){if(!validCalculator()){$('calcError').textContent='Enter a valid value in each calculator field to update the results.';return;}$('calcError').textContent='';const r=calculate(calcValues());Object.entries({rMonthlyRev:r.revenue,rAnnualRev:r.annualRevenue,rMonthlyCost:r.food,rMonthlyProfit:r.gross,rOperatingFees:r.fees,rOtherCost:r.other,rRemainder:r.remainder}).forEach(([id,v])=>$(id).textContent=money(v));}
  calcIds.forEach(id=>$(id).addEventListener('input',()=>{if(!calculatorChanged)track('calculator_engaged');calculatorChanged=true;updateCalculator();}));updateCalculator();
  function snapshot(){if(!calculatorChanged)return {'Calculator Scenario Status':'Not provided — visitor did not change example values'};if(!validCalculator())return {'Calculator Scenario Status':'Incomplete — invalid fields, no scenario attached'};const v=calcValues(),r=calculate(v);return {'Calculator Scenario Status':'Visitor-edited hypothetical inputs — not a forecast','Calc — Avg Sales/Day':v.salesPerDay,'Calc — Avg Ticket Price':'$'+v.ticketPrice.toFixed(2),'Calc — Operating Days/Month':v.daysPerMonth,'Calc — Food Cost %':v.foodCost+'%','Calc — Machines':v.numMachines,'Calc — Monthly Revenue':money(r.revenue),'Calc — Monthly Gross Profit':money(r.gross),'Calc — Annual Revenue':money(r.annualRevenue),'Calc — Annual Gross Profit':money(r.gross*12),'Calc — Venue Share %':v.venueCost+'%','Calc — Processing %':v.processingCost+'%','Calc — Other Monthly Costs':money(v.otherCost),'Calc — Monthly Remainder After Entered Costs':money(r.remainder),'Calc — Limitations':'Gross subtotal subtracts food/packaging only. Remainder is not net profit. Taxes, depreciation, equipment purchase and unentered expenses excluded.'};}
  'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ').forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;$('state').appendChild(o);});
  const form=$('leadForm');let formStarted=false;form.addEventListener('input',()=>{if(!formStarted){track('form_start');formStarted=true;}});
  form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity()||$('botcheck').value)return;const button=$('submitButton');button.disabled=true;button.textContent='Checking your request…';$('formStatus').textContent='';
    try{const context={};const params=new URLSearchParams(window.location.search);['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(k=>{if(params.has(k))context[k]=params.get(k).slice(0,250);});const result=await submitLead(buildLead(new FormData(form),snapshot(),context));
      if(result.preview){$('formStatus').innerHTML='<h3>Your preview test worked.</h3><p>The form passed validation. No information was sent or saved. In the live version, this step will confirm provider acceptance and offer the existing booking link.</p><a href="'+CONFIG.bookingUrl+'" target="_blank" rel="noopener noreferrer">Open the existing booking page ↗</a>';track('lead_test_success');}
      else{$('formStatus').innerHTML='<h3>Thank you—your request has been received.</h3><p>The team will review your details and follow up. You can also choose a time to discuss your location.</p><a href="'+CONFIG.bookingUrl+'" target="_blank" rel="noopener noreferrer">Book a 15-minute call ↗</a>';track('generate_lead');form.reset();formStarted=false;}
      $('formStatus').querySelector('a').addEventListener('click',()=>track('cta_click',{cta:'confirmation_booking'}));$('formStatus').focus();
    }catch(error){$('formStatus').textContent='We couldn’t confirm delivery. Your details are still in the form. Please try again, or email dustin@frostbotusa.com.';track('lead_error');$('formStatus').focus();}
    finally{button.disabled=false;button.textContent='Get Pricing & Details ↗';}
  });
  if('IntersectionObserver'in window){new IntersectionObserver(entries=>{$('mobileCta').hidden=entries[0].isIntersecting;},{threshold:0}).observe($('pricing-form'));}
}
