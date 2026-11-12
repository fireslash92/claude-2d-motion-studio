import math, os, subprocess, wave
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import cairosvg
ROOT=Path(__file__).parent; A=ROOT/'assets'; A.mkdir(exist_ok=True)
W,H=1920,1080
NAVY='#122C40'; TEAL='#137F80'; AQUA='#5AB9B0'; GOLD='#D7A45D'; IVORY='#F8F0E2'; INK='#163747'; SAND='#E6C9A1'; WHITE='#FFF9EF'
FONT='/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf'; REG='/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf'
def rect(x,y,w,h,c,r=0): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{c}"/>'
def circle(x,y,r,c): return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>'
def path(d,c,stroke='none',sw=1): return f'<path d="{d}" fill="{c}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>'
def line(x,y,x2,y2,c,w=4): return path(f'M{x} {y}L{x2} {y2}','none',c,w)
def group(s,x=0,y=0,k=1): return f'<g transform="translate({x} {y}) scale({k})">{s}</g>'
def svg(s,w=W,h=H): return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{s}</svg>'
def png(s,name,w=W,h=H):
 (A/(name+'.svg')).write_text(svg(s,w,h)); cairosvg.svg2png(bytestring=svg(s,w,h).encode(),write_to=str(A/(name+'.png')))
def window(x,y,w=40,h=65): return path(f'M{x} {y+h}V{y+20}Q{x+w/2} {y-15} {x+w} {y+20}V{y+h}Z',NAVY)+line(x+w/2,y+15,x+w/2,y+h,AQUA,3)
def palm(x,y,k=1):
 s=path('M-12 0 Q8 -110 -5 -225 L10 -225 Q24 -100 6 0Z','#926C49')
 for d in ['M0 -220 Q-95 -290 -165 -206 Q-70 -249 0 -220','M0 -220 Q-75 -335 -140 -285 Q-65 -289 0 -220','M0 -220 Q58 -338 135 -286 Q58 -295 0 -220','M0 -220 Q110 -283 172 -203 Q77 -246 0 -220','M0 -220 Q-12 -330 20 -352 Q54 -300 0 -220','M0 -220 Q-65 -200 -85 -136 Q-42 -190 0 -220','M0 -220 Q65 -210 99 -148 Q51 -197 0 -220']:
  s+=path(d,TEAL)
 return group(s,x,y,k)
def building(x,y,w,h,c=WHITE):
 s=rect(0,0,w,h,c,3)+rect(-5,0,w+10,13,SAND)+rect(0,h-18,w,18,'#C1A581')
 for i in range(3): s+=rect(15+i*(w-20)/3,-13,22,15,c)
 for i in range(2): s+=window(18+i*(w-42)/2,50,28,48)
 s+=path(f'M{w/2-25} {h}V{h-65}Q{w/2} {h-100} {w/2+25} {h-65}V{h}Z','#9C7557')
 return group(s,x,y)
def coast():
 s=rect(0,0,W,H,IVORY)+circle(380,225,145,'#F3C982')+path('M0 548L180 335 306 410 460 250 635 420 808 285 1040 510 1200 390 1430 550Z','#B7C5B8')+path('M0 620L220 463 360 550 535 391 710 551 920 415 1120 620Z','#849D96')+rect(0,610,W,470,'#DCE4D9')
 for x,y,w,h in [(30,550,150,165),(185,515,165,205),(365,555,140,165),(520,505,180,215),(715,570,135,150)]: s+=building(x,y,w,h)
 s+=rect(0,720,1920,160,'#74B9B3')+path('M0 780Q150 760 300 780T600 780T900 780T1200 780T1500 780T1920 780','none','#D7F0E8',5)+path('M0 832Q200 812 400 832T800 832T1200 832T1600 832T2000 832','none','#BDE1D9',4)+rect(0,880,W,200,'#D1B38F')+path('M0 900L1920 900','none','#F1E4CB',8)
 s+=palm(80,910,.9)+palm(780,885,.65)
 return s
# Character paths: traditional white Omani dishdasha, tassel and embroidered kumma; black abaya/hijab.
def man():
 s=path('M107 194Q74 200 60 270L31 410 90 422 117 342 110 590 283 590 278 337 316 407 368 378 337 246Q321 205 272 194Z',WHITE,'#D9D1C4',3)
 s+=path('M109 240Q132 223 153 220L196 250 241 220Q273 229 279 247L268 590H114Z','#F5E7D1')+path('M148 219L196 250 241 219','none','#B4A48B',4)+line(196,250,196,425,'#D4C4AA',3)+path('M197 252Q213 276 213 305','none','#B88D55',4)+circle(213,307,6,GOLD)
 s+=path('M110 590L95 650 169 650 181 590Z','#253C40')+path('M221 590L230 650 303 650 282 590Z','#253C40')+path('M82 654Q112 630 169 640L177 661H80Z','#5B4334')+path('M229 640Q280 630 312 653L315 663H228Z','#5B4334')
 s+=rect(167,153,57,76,'#AD6D45',18)+path('M128 84Q126 37 196 30Q259 37 262 88L254 153Q242 193 196 197Q150 190 138 155Z','#C6865B')+path('M139 130Q145 172 173 185Q204 205 236 179L252 144Q222 171 196 163Q171 169 139 130Z','#37332E')+circle(162,119,4,NAVY)+circle(231,119,4,NAVY)+path('M193 117L185 145 201 145','none','#915B40',3)+path('M182 166Q199 173 215 165','none','#FFE7C6',3)
 s+=path('M128 91V52Q132 16 194 15Q257 17 263 52V91Q196 107 128 91Z','#E8D7BA','#B49A76',3)
 for i in range(8):
  x=140+i*15; s+=path(f'M{x} 58l6 -10 6 10 -6 10Z','none',TEAL,2)
 s+=path('M132 77Q195 88 259 77','none',GOLD,5)+path('M132 43Q195 34 259 43','none','#AC7552',3)
 s+=path('M31 410Q27 433 48 443Q72 448 90 422Z','#C6865B')+path('M316 407Q344 417 368 378L380 384Q390 407 373 423L350 436Z','#C6865B')
 return s
def woman():
 s=path('M101 184Q49 219 51 315L18 586Q102 611 185 601Q266 613 337 586L300 309Q302 231 255 183Z','#253D4B')+path('M130 192Q126 294 86 560L185 600 271 560Q233 298 246 192Z','#172D3B')+path('M112 205Q72 248 67 300L26 436 73 453 124 322','none','#44616B',8)+path('M253 210Q296 243 306 319L335 420 285 437 241 320','none','#44616B',8)
 s+=path('M106 104Q104 18 186 17Q267 19 268 105L282 207 239 240 186 220 128 240 91 207Z','#172D3B')+path('M143 76Q187 37 231 76L239 126Q237 180 187 198Q139 182 135 130Z','#C48660')+path('M132 92Q155 44 187 47Q223 49 241 95','none','#354B58',10)+circle(161,115,4,NAVY)+circle(213,115,4,NAVY)+path('M180 152Q189 158 199 152','none','#824C42',3)+path('M28 436Q21 458 46 465L73 453Z','#C48660')+path('M285 437Q305 466 327 447L335 420Z','#C48660')
 return s
def phone(x,y,k=1,screen='pay'):
 s=rect(0,0,265,480,NAVY,40)+rect(13,14,239,451,'#EAF6EF',29)+rect(91,25,82,11,NAVY,6)+rect(33,75,199,102,TEAL,17)+circle(64,105,12,GOLD)+rect(87,101,110,8,'#A4D4C8',4)+rect(53,138,120,14,WHITE,7)
 s+=circle(132,254,58,'#D0E8DF')
 if screen=='pay': s+=path('M104 255L124 276 163 231','none',TEAL,10)
 elif screen=='send': s+=path('M97 253H168M147 232L169 253 147 274','none',TEAL,9)
 else: s+=path('M132 211L169 226V259Q163 286 132 302Q101 285 95 259V226Z',TEAL)+path('M116 256L128 269 149 244','none',WHITE,6)
 for yy in [339,385]: s+=rect(40,yy,185,31,'#D5E7E2',8)+circle(59,yy+15,6,TEAL)+rect(79,yy+11,110,8,'#A0C9BF',4)
 return group(s,x,y,k)
def coin(x,y,k=1): return group(circle(0,0,46,'#B97E39')+circle(0,-5,43,GOLD)+circle(0,-5,33,'#EBC17B')+circle(0,-5,28,'none')+path('M0 -25V15M-13 -16H8Q23 -16 13 -3L-11 3Q-25 16 -7 16H13','none','#99652F',5),x,y,k)
def store():
 s=rect(10,130,570,485,'#F2E3CC',10)+rect(0,113,590,50,'#B78C61',8)+rect(34,167,520,55,TEAL,8)+rect(30,268,530,310,'#B3DBD0',8)+rect(50,288,225,275,'#E3F3E9',4)+rect(308,288,231,275,'#E3F3E9',4)+rect(0,578,590,37,'#9C7556',6)
 for i in range(6): s+=rect(i*98,221,98,80,TEAL if i%2==0 else WHITE,8)
 for i in range(3): s+=rect(75,335+i*70,180,12,'#BE9264')+rect(90,308+i*70,30,28,GOLD,4)+rect(150,315+i*70,52,20,TEAL,4)
 s+=rect(330,402,180,155,'#B98C65',5)+rect(350,423,140,112,'#D7B78B',5)+rect(383,371,74,47,NAVY,6)+rect(392,378,56,29,AQUA,3)
 return s
def shield(): return path('M0 -160L147 -105V20Q129 146 0 210Q-129 146 -147 20V-105Z',TEAL,'#67C9BA',8)+path('M-82 25L-22 85 85 -45','none',WHITE,22)+path('M0 -129L119 -85V18Q107 118 0 178','none','#A1E1D5',5)
# Native-resolution background and transparent foreground, with all typography rendered with Arabic shaping.
scenes=[('التقنية المالية\nفي عُمان','تجربة مالية أقرب إليك','من يومنا العادي تبدأ الحكاية؛ التقنية تسهّل تعاملاتنا المالية.'),('ادفع بسهولة','من هاتفك إلى المتجر','تقدر تدفع إلكترونيًا في ثوانٍ، بدون ما تحتاج تحمل النقد.'),('حوّل بكل مرونة','أموالك تصل بسهولة','أرسل المبلغ لأهلك أو أصدقائك، وتابع تحويلاتك من مكانك.'),('فرص تنمو','لأصحاب المشاريع الصغيرة','حلول الدفع الرقمية تساعد المشاريع على الوصول إلى زبائن أكثر.'),('الأمان أولًا','احمِ بياناتك المالية','لا تشارك رمز التحقق، وتأكد من موثوقية التطبيق والرابط.'),('مستقبل مالي أذكى','عُمان، نحو اقتصاد رقمي','مع التقنية المالية، نقدر نبني تجربة أسهل وأكثر أمانًا للجميع.')]
for i,(title,sub,caption) in enumerate(scenes):
 if i==0: bg=coast(); fg=group(man(),180,275,1.05)+phone(620,370,.65)+coin(650,270,.6)
 elif i==1: bg=rect(0,0,W,H,'#DDECE4')+circle(425,510,415,'#B7DED0')+circle(425,510,330,'#CFE7D8')+rect(0,850,W,230,'#C5D6C8')+group(store(),40,280,1.1); fg=group(man(),105,300,.85)+phone(535,250,.92)+coin(765,280,.8)+coin(780,420,.55)
 elif i==2: bg=rect(0,0,W,H,'#E9E4D6')+circle(420,485,400,'#C6DBCD')+path('M80 760Q400 140 830 700','none','#8FBDB0',10)+rect(0,875,W,205,'#D4C0A2')+palm(86,890,.7); fg=group(man(),45,390,.73)+group(woman(),650,397,.72)+phone(340,260,.85,'send')+coin(340,230,.6)+coin(640,280,.6)
 elif i==3: bg=rect(0,0,W,H,'#F2E1C8')+circle(470,500,420,'#E5C79F')+rect(0,870,W,210,'#C4A47F')+group(store(),65,270,1.18)+palm(850,860,.58); fg=group(woman(),400,315,.87)+phone(660,410,.53)+coin(745,320,.6)
 elif i==4: bg=rect(0,0,W,H,'#173D4D')+circle(430,530,400,'#205565')+circle(430,530,315,'#286D73')+path('M30 760L820 230M0 450L710 900','none','#367D80',5); fg=phone(280,242,1.02,'safe')+group(shield(),660,535,.8)+group(man(),20,430,.65)
 else: bg=coast()+rect(0,0,W,1080,'#173D4D')+circle(400,480,380,'#205565')+path('M0 790Q250 660 500 790T1000 790','none','#4EA99F',9)+group(building(0,0,200,260),60,650,.8)+group(building(0,0,200,260),620,640,.8)+palm(80,950,.7); fg=group(man(),170,330,.9)+group(woman(),500,350,.87)+coin(430,230,.8)+phone(380,580,.42)
 # Independent movement layers: illustrated people and interactive devices.
 if i==0: fg=group(man(),180,275,1.05); device=phone(620,370,.65)+coin(650,270,.6)
 elif i==1: fg=group(man(),105,300,.85); device=phone(535,250,.92)+coin(765,280,.8)+coin(780,420,.55)
 elif i==2: fg=group(man(),45,390,.73)+group(woman(),650,397,.72); device=phone(340,260,.85,'send')+coin(340,230,.6)+coin(640,280,.6)
 elif i==3: fg=group(woman(),170,380,.75); device=phone(660,410,.53)+coin(745,320,.6)
 elif i==4: fg=group(man(),20,430,.65); device=phone(280,242,1.02,'safe')+group(shield(),660,535,.8)
 else: fg=group(man(),170,330,.9)+group(woman(),500,350,.87); device=coin(430,230,.8)+phone(380,580,.42)
 png(bg,f'bg{i}'); png(fg,f'fg{i}'); png(device,f'device{i}')
 # Type lives on a separate, stationary layer and is never letter-by-letter animated.
 im=Image.new('RGBA',(W,H)); d=ImageDraw.Draw(im); dark=i>=4; col=WHITE if dark else NAVY; minor='#B9E2D8' if dark else TEAL
 # Solid text panel for contrast, clean composition with clear margin.
 d.rounded_rectangle((975,100,1840,950),radius=48,fill=('#153644' if dark else '#FBF5E9'))
 d.rounded_rectangle((1700,165,1775,176),radius=5,fill=GOLD)
 d.text((1775,225),f'٠{i+1}' if False else ['٠١','٠٢','٠٣','٠٤','٠٥','٠٦'][i],font=ImageFont.truetype(REG,34),fill=minor,anchor='rt',direction='rtl')
 for j,t in enumerate(title.split('\n')): d.text((1775,300+j*120),t,font=ImageFont.truetype(FONT,89 if i==0 else 91),fill=col,anchor='rt',direction='rtl',language='ar')
 sy=550 if i==0 else 440
 d.text((1775,sy),sub,font=ImageFont.truetype(FONT,49),fill=minor,anchor='rt',direction='rtl',language='ar')
 # fit caption in two or three lines
 f=ImageFont.truetype(REG,39); words=caption.split(); lines=[]; t=''
 for word in words:
  new=(t+' '+word).strip()
  if d.textlength(new,font=f,direction='rtl')>720: lines.append(t); t=word
  else:t=new
 if t:lines.append(t)
 for j,t in enumerate(lines): d.text((1775,sy+110+j*63),t,font=f,fill=col,anchor='rt',direction='rtl',language='ar')
 d.line((1040,855,1775,855),fill=('#3B6C73' if dark else '#D9C9AF'),width=2)
 for k in range(6): d.rounded_rectangle((1775-k*47-30,887,1775-k*47,895),radius=4,fill=GOLD if k==i else ('#3B6C73' if dark else '#C9D5C8'))
 im.save(A/f'text{i}.png')
 # master composited still
 b=Image.open(A/f'bg{i}.png').convert('RGBA'); b.alpha_composite(Image.open(A/f'fg{i}.png').convert('RGBA')); b.alpha_composite(Image.open(A/f'device{i}.png').convert('RGBA')); b.alpha_composite(im); b.convert('RGB').save(A/f'still{i}.jpg',quality=95)
# Original instrumental sound bed, gentle plucked tones and transition sweeps.
sr=48000; t=np.arange(sr*60)/sr; audio=np.zeros_like(t)
for j in range(0,60,2):
 chord=[146.83,220,293.66] if (j//8)%2==0 else [130.81,196,261.63]
 for k,f in enumerate(chord):
  start=j+k*.09; idx=np.arange(int(sr*start),min(len(t),int(sr*(start+2.6)))); u=idx/sr-start; env=(1-np.exp(-u*22))*np.exp(-u*2.6); audio[idx]+=.055*env*(np.sin(2*np.pi*f*u)+.22*np.sin(4*np.pi*f*u))
for start in [2.8,12.4,22.3,32.3,42.3,52.2]:
 idx=np.arange(int(start*sr),int((start+.48)*sr)); u=idx/sr-start; audio[idx]+=.12*np.sin(2*np.pi*(720*u+140*u*u))*np.sin(np.pi*u/.48)**2
for start in [9.7,19.6,29.5,39.4,49.3]:
 idx=np.arange(int(start*sr),int((start+.7)*sr)); u=idx/sr-start; audio[idx]+=.045*np.sin(2*np.pi*(180*u+220*u*u))*np.sin(np.pi*u/.7)**2
fade=np.minimum(1,np.minimum(t/1.5,(60-t)/2)); audio*=fade
with wave.open(str(A/'sound.wav'),'wb') as w: w.setparams((1,2,sr,0,'NONE','not compressed')); w.writeframes((audio*32767).astype('<i2').tobytes())
print('Created vector art, Arabic type layers and sound bed.')
