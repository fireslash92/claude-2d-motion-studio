# Six timed narration cues, authored for an Omani Arabic voice. Requires network and edge-tts.
import asyncio, pathlib, subprocess, wave, array
import edge_tts
P=pathlib.Path(__file__).parent; A=P/'assets'
CUES=[
"في عُمان، التقنية المالية صارت جزء من يومنا. من أول مشوار، لين آخر تعامل، كل شي صار أقرب وأسهل.",
"تخيّل إنك تدخل متجر وتدفع من تلفونك في ثواني. ما تحتاج تحمل كاش، وتقدر تتابع مصاريفك بسهولة.",
"وتقدر تحوّل لأهلك أو لأصحابك من مكانك. تتأكد من بيانات المستفيد قبل ما ترسل، وتتابع العملية.",
"والمشاريع الصغيرة بعد تستفيد. صاحب المشروع يقدر يستقبل المدفوعات الرقمية ويوصل لزبائن أكثر.",
"بس الأمان قبل كل شي. لا تعطي حد رمز التحقق، وتأكد من التطبيق والرابط قبل ما تدخل بياناتك.",
"مع التقنية المالية، نقدر نبني تجربة أسهل وأكثر أمان. عُمان، نحو مستقبل مالي أذكى."
]
async def main():
 for i,text in enumerate(CUES):
  await edge_tts.Communicate(text,voice="ar-OM-AbdullahNeural",rate="+3%").save(str(A/f'cue{i}.mp3'))
asyncio.run(main())
# A separate voice track, timed to each scene. Reject clips too long instead of overlapping.
args=['ffmpeg','-y','-i',str(A/'sound.wav')]
for i in range(6): args+=['-i',str(A/f'cue{i}.mp3')]
filters=['[0:a]volume=0.38[bed]']; names=['[bed]']
for i in range(6):
 dur=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(A/f'cue{i}.mp3')]))
 if dur>9.45: raise RuntimeError(f'Cue {i+1} is {dur:.2f}s; shorten/re-record for its 9.45s window.')
 delay=round((i*9.9+.35)*1000)
 filters.append(f'[{i+1}:a]aresample=48000,adelay={delay}:all=1[v{i}]'); names.append(f'[v{i}]')
filters.append(''.join(names)+'amix=inputs=7:duration=first:normalize=0,alimiter=limit=0.95[m]')
subprocess.run(args+['-filter_complex',';'.join(filters),'-map','[m]','-t','60','-c:a','pcm_s16le',str(A/'narrated.wav')],check=True)
