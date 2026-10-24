'use client'

import Link from 'next/link'
import { ArrowDown, ArrowRight, Camera, MapPin, ShieldCheck, Recycle, Coins, Users, ClipboardCheck, Truck, BarChart3, Sparkles, Leaf, Smartphone, Check, Clock3, Navigation, CircleHelp } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import MapBackground from '@/components/MapBackground'

const steps = [
  { icon: Camera, title: 'Spot it. Report it.', text: 'Add a photo, choose the waste type and pin the place. A clear report gives the team something they can act on.' },
  { icon: ShieldCheck, title: 'Review the details.', text: 'The report enters the shared queue for review, helping keep duplicate or unclear reports from slowing the work.' },
  { icon: Truck, title: 'Assign a pickup.', text: 'An administrator can route an approved report to an available collector with the location and context attached.' },
  { icon: BarChart3, title: 'Follow the progress.', text: 'See when a report is reviewed, assigned and updated. Residents and field teams share the same status.' },
]
const roles = [
  { icon: Users, title: 'Residents', tag: 'REPORT', text: 'Point out a local hotspot, add useful context and follow the response from your account.' },
  { icon: Recycle, title: 'Collectors', tag: 'COLLECT', text: 'View admin-assigned pickups, open their location and update the collection status from mobile.' },
  { icon: ClipboardCheck, title: 'Administrators', tag: 'COORDINATE', text: 'Review reports, approve collector access, assign work and monitor activity in the web dashboard.' },
]

export default function MarketingLanding() {
  const { t } = useLanguage()
  return (
    <main className="overflow-hidden bg-white text-[#172820]">
      <header className="sticky top-0 z-40 border-b border-[#10271f]/10 bg-white/95 text-[#172820] backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8" aria-label="Main navigation">
          <a href="#top" className="flex items-center gap-3" aria-label="WasteChain home"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eaf6ec] text-[#198044]"><Recycle size={24}/></span><span><b className="block text-lg tracking-tight">WASTE<span className="text-[#198044]">CHAiN</span></b><small className="hidden text-xs text-slate-500 sm:block">Cleaner places, together</small></span></a>
          <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex"><a href="#how" className="hover:text-[#198044]">How it works</a><a href="#roles" className="hover:text-[#198044]">For everyone</a><a href="#map" className="hover:text-[#198044]">Locations</a><a href="#faq" className="hover:text-[#198044]">FAQ</a></div>
          <Link href="/login" className="rounded-full bg-[#198044] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#123323]">{t('landing.login_btn')}</Link>
        </nav>
      </header>

      <section id="top" className="relative isolate bg-white/70 text-[#172820] overflow-hidden min-h-[85vh] flex items-center justify-center">
        {/* Full-width Map Background with clear visibility */}
        <MapBackground opacity={0.65} />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center justify-center text-center px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#198044]/25 bg-white/90 backdrop-blur-md px-5 py-2.5 text-xs font-extrabold uppercase tracking-[.14em] text-[#198044] shadow-sm">
            <Sparkles size={16}/> Community-powered cleanup coordination
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-[-.055em] sm:text-6xl lg:text-7xl">
            See a hotspot?<br/>
            <span className="text-[#198044]">Move it forward.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg sm:text-xl leading-8 text-slate-700 font-medium">
            One clear place for residents to report waste, administrators to coordinate a response, and collectors to close the loop in Munger district.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row items-center justify-center">
            <Link href="/login" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#198044] px-8 text-base font-extrabold text-white shadow-xl shadow-emerald-900/25 transition hover:-translate-y-0.5 hover:bg-[#123323]">
              Create your account <ArrowRight size={19}/>
            </Link>
            <a href="#how" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#123323]/20 bg-white/90 backdrop-blur-md px-8 text-base font-bold text-[#123323] transition hover:bg-[#f1f8f2]">
              See the workflow <ArrowDown size={17}/>
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-semibold text-slate-700">
            <span className="flex items-center gap-2 bg-white/85 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200/80 shadow-xs">
              <MapPin size={17} className="text-[#198044]"/> Munger District Live Map
            </span>
            <span className="flex items-center gap-2 bg-white/85 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200/80 shadow-xs">
              <Smartphone size={17} className="text-[#198044]"/> Web dashboard + Android app
            </span>
          </div>
        </div>
      </section>

      <section className="border-b border-[#10271f]/5 bg-white py-5"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-5 sm:grid-cols-4 md:px-8">{[{i:Camera,t:'Photo-led reports'},{i:MapPin,t:'Mapped locations'},{i:Coins,t:'Contribution points'},{i:ShieldCheck,t:'Admin-reviewed flow'}].map(({i:Icon,t})=><div key={t} className="flex items-center justify-center gap-2 rounded-xl bg-[#f5f8f4] px-2 py-3 text-center text-xs font-extrabold text-[#34483b] sm:text-sm"><Icon size={18} className="shrink-0 text-[#198044]"/>{t}</div>)}</div></section>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:px-8 md:py-28"><div><p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#198044]">A familiar local problem</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">A photo in a chat is easy to miss.</h2><p className="mt-5 max-w-xl leading-7 text-[#66736a]">When a report, its location and its follow-up live in different places, it is harder to know who is handling it. WasteCHAiN keeps those steps connected in one workflow.</p></div><div className="grid gap-3 sm:grid-cols-2"><article className="rounded-3xl border border-[#e5ebe4] bg-white p-6"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff4e9] text-xl">📥</span><h3 className="mt-4 font-extrabold">Before</h3><p className="mt-2 text-sm leading-6 text-[#6c786f]">A location gets shared, then the update gets lost in another conversation.</p></article><article className="rounded-3xl bg-[#123323] p-6 text-white"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#c9f06a] text-[#10271f]"><Check size={22}/></span><h3 className="mt-4 font-extrabold">With WasteCHAiN</h3><p className="mt-2 text-sm leading-6 text-white/65">Report, review, assignment and pickup status stay tied to the same place.</p></article></div></section>

      <section className="bg-white py-20 md:py-28" id="how"><div className="mx-auto max-w-7xl px-5 md:px-8"><div className="mx-auto max-w-2xl text-center"><p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#198044]">A simple path from report to response</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Everyone sees the next step.</h2><p className="mt-5 leading-7 text-[#66736a]">A shared timeline gives the neighbourhood and operations team the same picture.</p></div><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{steps.map(({icon:Icon,title,text},n)=><article key={title} className="group rounded-3xl border border-[#e5ebe4] bg-[#f9fbf8] p-6 transition hover:-translate-y-1 hover:border-[#a8d6b4] hover:shadow-xl"><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eaf6ec] text-[#198044]"><Icon size={23}/></span><span className="text-sm font-black text-[#198044]/35">0{n+1}</span></div><h3 className="mt-6 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#68766c]">{text}</p></article>)}</div></div></section>

      <section className="bg-[#f7faf7] py-20 md:py-24" id="roles"><div className="mx-auto max-w-7xl px-5 md:px-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="max-w-2xl"><p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#198044]">One connected platform</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Clear roles. Shared progress.</h2><p className="mt-5 leading-7 text-slate-600">Residents raise reports, field teams handle assigned pickups, and administrators coordinate the work.</p></div><span className="inline-flex items-center gap-2 text-sm font-bold text-slate-600"><Clock3 size={17} className="text-[#198044]"/> Collector access is admin-approved</span></div><div className="mt-11 grid gap-4 md:grid-cols-3">{roles.map(({icon:Icon,title,tag,text})=><article key={title} className="rounded-3xl border border-[#e5ebe4] bg-white p-7 shadow-sm"><div className="flex items-center justify-between"><Icon size={27} className="text-[#198044]"/><span className="rounded-full border border-[#e5ebe4] px-3 py-1 text-[9px] font-extrabold tracking-[.15em] text-slate-500">{tag}</span></div><h3 className="mt-5 text-xl font-extrabold">For {title.toLowerCase()}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></div></section>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:px-8 md:py-24" id="map"><div><p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#198044]">Built around the place</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Give the pickup a place to go.</h2><p className="mt-5 leading-7 text-[#66736a]">Attach a map location to help the pickup team find the report. WasteCHAiN uses OpenStreetMap for map context, with no Google Maps API key.</p><ul className="mt-6 space-y-3 text-sm font-semibold text-[#425348]"><li className="flex gap-3"><Navigation className="shrink-0 text-[#198044]"/> Add a nearby address, landmark or device location.</li><li className="flex gap-3"><ShieldCheck className="shrink-0 text-[#198044]"/> Follow assignment and collection status in the app.</li><li className="flex gap-3"><Leaf className="shrink-0 text-[#198044]"/> Map data credited to OpenStreetMap contributors.</li></ul></div><div className="rounded-[2rem] bg-[#e8f3e8] p-5 sm:p-8"><div className="rounded-3xl bg-white p-6 shadow-xl"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#198044] text-white"><MapPin/></span><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#98a39a]">Report lifecycle</p><p className="font-extrabold">One report. Clear updates.</p></div></div><div className="my-6 h-px bg-slate-100"/><div className="space-y-4">{['Report submitted','Admin review','Collector assignment','Pickup update'].map((x,i)=><div className="flex items-center gap-3" key={x}><span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${i===0?'bg-[#198044] text-white':'bg-[#eaf6ec] text-[#198044]'}`}>{i===0?'✓':i+1}</span><span className="text-sm font-bold text-[#34483b]">{x}</span><span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-[#98a39a]">Status</span></div>)}</div></div></div></section>

      <section className="bg-white py-20" id="rewards"><div className="mx-auto grid max-w-7xl items-center gap-8 px-5 md:grid-cols-[.8fr_1.2fr] md:px-8"><div><p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#198044]">Make participation visible</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Your contribution has a history.</h2><p className="mt-4 leading-7 text-[#66736a]">Eligible activity can earn contribution points in your account, so you can see the work you have taken part in over time.</p><p className="mt-3 text-xs leading-5 text-[#78857b]">Points are platform recognition, not cash or a guaranteed payout. Current rules are shown in Rewards.</p></div><div className="grid gap-3 sm:grid-cols-3">{[{icon:Camera,title:'Report',text:'Share useful context'},{icon:Check,title:'Verify',text:'Help confirm the issue'},{icon:Recycle,title:'Contribute',text:'Follow the cleanup'}].map(({icon:Icon,title,text})=><div key={title} className="rounded-2xl border border-[#e5ebe4] bg-[#f9fbf8] p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf7ee] text-[#198044]"><Icon size={20}/></span><p className="mt-4 font-extrabold">{title}</p><p className="mt-1 text-xs text-[#738077]">{text}</p></div>)}</div></div></section>

      <section className="bg-white py-20" id="faq"><div className="mx-auto max-w-4xl px-5 md:px-8"><div className="text-center"><CircleHelp className="mx-auto text-[#198044]"/><p className="mt-3 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#198044]">Good to know</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Quick answers before you start.</h2></div><div className="mt-9 space-y-3">{[
        ['How do I report waste?', 'Create an account, add a clear photo, select the visible waste type and provide its location.'],
        ['What happens after I report?', 'The report goes to the service for review. An administrator can coordinate collector assignment and status updates.'],
        ['Which map does the app use?', 'OpenStreetMap is used for map views and location context. Google Maps API keys are not required.'],
        ['How does collector access work?', 'Choose the collector option during signup or request it from your profile. An administrator reviews and approves access before pickup tasks are enabled.'],
        ['Are contribution points cash?', 'No. Points track eligible activity in the platform and are not a cash payout.'],
      ].map(([q,a])=><details key={q} className="group rounded-2xl border border-[#e5ebe4] bg-[#f9fbf8] p-5"><summary className="cursor-pointer list-none pr-8 font-extrabold marker:hidden">{q}<span className="float-right text-[#198044] transition group-open:rotate-45">＋</span></summary><p className="mt-3 max-w-3xl text-sm leading-6 text-[#68766c]">{a}</p></details>)}</div></div></section>

      <section className="px-5 py-16 md:px-8 md:py-24"><div className="mx-auto max-w-6xl rounded-[2rem] border border-[#e5ebe4] bg-[#f7faf7] px-6 py-12 text-center sm:px-14 sm:py-16"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf6ec] text-[#198044]"><Recycle size={28}/></div><p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#198044]">Your neighbourhood’s next cleanup</p><h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">Start with one clear report.</h2><p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-600">Join WasteCHAiN to connect the report, the location and the people coordinating its response.</p><Link href="/login" className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#198044] px-7 font-extrabold text-white transition hover:bg-[#123323]">Get started <ArrowRight size={19}/></Link></div></section>

      <footer className="border-t border-[#10271f]/10 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-[#78857b] sm:flex-row sm:items-center sm:justify-between md:px-8"><a href="#top" className="font-black tracking-tight text-[#183024]">WASTE<span className="text-[#198044]">CHAiN</span></a><p>Cleaner places, together · Map data © OpenStreetMap contributors</p><Link href="/login" className="font-bold text-[#198044] hover:underline">{t('landing.login_btn')}</Link></div></footer>
    </main>
  )
}
