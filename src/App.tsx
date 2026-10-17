import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, where } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, ChevronDown, Clock3, Cross, Instagram, MapPin, Menu as MenuIcon, Play, X, Youtube, LogIn, LogOut, Trash2, ImagePlus } from 'lucide-react'
import { ADMIN_EMAIL, auth, db, storage } from './firebase'

type Page = { id: string; title: string; section: string; description: string }
type MenuGroup = { title: string; items: Page[] }

const groups: MenuGroup[] = [
  { title: '교회소개', items: [
    { id: 'about', title: '반가운교회 소개', section: '교회소개', description: '하나님과의 사귐으로 사람이 변화되고, 함께 하나님 나라를 살아가는 공동체입니다.' },
    { id: 'pastor', title: '담임목사 소개', section: '교회소개', description: '안경혁 목사와 반가운교회를 향한 마음을 소개합니다.' },
    { id: 'vision', title: '목회철학', section: '교회소개', description: '영성목회, 공동체, 다음세대의 세 기둥 위에 세워가는 목회입니다.' },
    { id: 'history', title: '교회 발자취', section: '교회소개', description: '가정에서 시작해 예배의 자리로 이어진 반가운교회의 이야기입니다.' },
    { id: 'location', title: '오시는 길', section: '교회소개', description: '서울 성북구 성북로4길 52, 한신한진아파트 근린상가 3층에 있습니다.' },
  ] },
  { title: '말씀과 예배', items: [
    { id: 'sermons', title: '주일설교', section: '말씀과 예배', description: '함께 들은 말씀을 다시 듣고, 삶의 자리에서 천천히 묵상합니다.' },
    { id: 'bulletin', title: '주보', section: '말씀과 예배', description: '매주 예배 순서와 교회 소식을 담은 주보를 모아봅니다.' },
    { id: 'worship', title: '예배안내', section: '말씀과 예배', description: '주일예배와 주중 예배 시간, 예배 장소를 안내합니다.' },
    { id: 'prayer', title: '기도와 예배', section: '말씀과 예배', description: '새벽을 깨우고 함께 기도하는 반가운교회의 예배를 소개합니다.' },
  ] },
  { title: '공동체', items: [
    { id: 'community', title: '공동체 소개', section: '공동체', description: '말씀을 나누고, 함께 밥을 먹으며 서로의 삶을 돌봅니다.' },
    { id: 'community-story', title: '공동체 이야기', section: '공동체', description: '함께 웃고 나누며 자라가는 우리들의 일상입니다.' },
    { id: 'prayer-share', title: '기도 나눔', section: '공동체', description: '서로의 기도 제목과 마음을 나누는 공동체의 기록입니다.' },
  ] },
  { title: '다음세대', items: [
    { id: 'nextgen', title: '다음세대 소개', section: '다음세대', description: '어린이와 학생이 믿음 안에서 함께 자라는 공동체입니다.' },
    { id: 'nextgen-story', title: '다음세대 이야기', section: '다음세대', description: '예배와 배움, 놀이 속에서 자라나는 다음세대의 이야기입니다.' },
  ] },
  { title: '교회소식', items: [
    { id: 'notices', title: '공지사항', section: '교회소식', description: '반가운교회의 새 소식과 안내를 전합니다.' },
    { id: 'calendar', title: '교회 일정', section: '교회소식', description: '함께 기억하고 참여할 예배와 모임 일정을 확인하세요.' },
    { id: 'gallery', title: '사진앨범', section: '교회소식', description: '예배와 교제, 교회가 걸어온 순간들을 담았습니다.' },
    { id: 'sns', title: 'SNS 채널', section: '교회소식', description: '인스타그램과 유튜브에서 반가운교회의 소식을 만나보세요.' },
  ] },
  { title: '새가족안내', items: [
    { id: 'welcome', title: '처음 오셨나요?', section: '새가족안내', description: '처음 오시는 분도 편안하게 예배드릴 수 있도록 안내해 드립니다.' },
    { id: 'preview', title: '예배 미리보기', section: '새가족안내', description: '예배의 흐름과 분위기를 미리 살펴보세요.' },
    { id: 'faq', title: '자주 묻는 질문', section: '새가족안내', description: '방문 전에 궁금하신 내용을 모았습니다.' },
    { id: 'newcomer', title: '새가족 등록', section: '새가족안내', description: '새가족 등록과 방문 문의 화면은 준비 중입니다.' },
  ] },
]
const allPages = groups.flatMap((group) => group.items)
const boardCategories: Record<string, string> = { sermons: 'sermons', bulletin: 'bulletin', notices: 'notices', calendar: 'calendar', gallery: 'gallery', 'community-story': 'community', 'nextgen-story': 'nextgen', 'prayer-share': 'prayer' }
const memberBoardCategories = new Set(['gallery', 'prayer'])
const images = {
  first: '/images/first-service.jpg', interior: '/images/church-interior.jpg', prayer: '/images/prayer-sharing.jpg',
  board: '/images/hallway-board.jpg', opening: '/images/sanctuary-opening.jpg', sheet1: '/images/sermon-sheet-01.jpg',
  sheet2: '/images/sermon-sheet-02.jpg', sharing: '/images/after-sermon-sharing.jpg', practice: '/images/practice-room-first-service.jpg',
  bulletin1: '/images/bulletin-01.jpg', bulletin2: '/images/bulletin-02.jpg', newsletter1: '/images/newsletter-01.jpg',
  newsletter2: '/images/newsletter-02.jpg', newsletter3: '/images/newsletter-03.jpg',
}

function App() {
  const [pageId, setPageId] = useState(() => location.hash.slice(1) || 'home')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<User | null>(auth.currentUser)
  const [authReady, setAuthReady] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authMessage, setAuthMessage] = useState('')
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL
  const page = allPages.find((item) => item.id === pageId)
  const navigate = (id: string) => {
    history.pushState({}, '', id === 'home' ? location.pathname : `#${id}`)
    setPageId(id)
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  useEffect(() => {
    const onPop = () => setPageId(location.hash.slice(1) || 'home')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser)
    setAuthReady(true)
  }), [])

  const authenticate = async (mode: 'login' | 'signup', email: string, password: string) => {
    setAuthMessage('')
    try {
      if (mode === 'signup') await createUserWithEmailAndPassword(auth, email.trim(), password)
      else await signInWithEmailAndPassword(auth, email.trim(), password)
      setLoginOpen(false)
      setAuthMessage(mode === 'signup' ? '회원가입과 로그인이 완료되었습니다.' : '로그인되었습니다.')
    } catch {
      setAuthMessage(mode === 'signup' ? '회원가입에 실패했습니다. 이메일 형식, 비밀번호(6자 이상), Firebase 이메일 로그인 설정을 확인해 주세요.' : '로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.')
    }
  }

  const openAuth = (mode: 'login' | 'signup' = 'login') => { setAuthMode(mode); setAuthMessage(''); setLoginOpen(true) }

  return <>
    <div className="topline"><span>SEOUL · SUNGBOOK-GU</span><span>하나님과 사람을 반갑게 맞이하는 교회</span><a href="https://www.instagram.com/bangawoonchurch/" target="_blank" rel="noreferrer">INSTAGRAM <ArrowUpRight size={12}/></a></div>
    <header className="header">
      <button className="brand" onClick={() => navigate('home')} aria-label="반가운교회 홈"><img src="/brand-lockup.png" alt="반가운교회" /></button>
      <nav className="desktop-nav">{groups.map((group) => <div className="nav-group" key={group.title}><button onClick={() => navigate(group.items[0].id)}>{group.title}<ChevronDown size={13}/></button><div className="dropdown">{group.items.map((item) => <button key={item.id} onClick={() => navigate(item.id)}>{item.title}</button>)}</div></div>)}</nav>
      <button className="visit-button" onClick={() => navigate('location')}>예배와 방문 안내 <ArrowUpRight size={15}/></button>
      <button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="메뉴 열기">{mobileOpen ? <X/> : <MenuIcon/>}</button>
    </header>
    {mobileOpen && <div className="mobile-nav">{groups.map((group) => <div key={group.title}><p>{group.title}</p>{group.items.map((item) => <button key={item.id} onClick={() => navigate(item.id)}>{item.title}<ArrowRight size={14}/></button>)}</div>)}</div>}
    {page ? <Interior page={page} navigate={navigate} user={user} isAdmin={isAdmin} authReady={authReady} onAuthOpen={openAuth}/> : <Home navigate={navigate}/>}
    <Footer navigate={navigate} user={user} isAdmin={isAdmin} onAuthOpen={openAuth} onLogout={() => { void signOut(auth); setAuthMessage('로그아웃되었습니다.') }}/>
    {loginOpen && <LoginDialog mode={authMode} onModeChange={setAuthMode} onClose={() => setLoginOpen(false)} onAuthenticate={authenticate} message={authMessage}/>}
    {authMessage && !loginOpen && <div className="auth-toast" role="status">{authMessage}<button onClick={() => setAuthMessage('')} aria-label="알림 닫기"><X size={15}/></button></div>}
  </>
}

function Home({ navigate }: { navigate: (id: string) => void }) {
  return <main>
    <section className="hero hero-photo-layout">
      <div className="hero-copy"><span className="eyebrow"><i/> BANGAWOON CHURCH · 성북구</span><h1>하나님과 사람을<br/><em>반갑게</em> 맞이하는 교회</h1><p>하나님과의 인격적인 사귐으로 변화되고,<br/>함께 하나님 나라를 살아가는 공동체.</p><div className="hero-actions"><button className="pill-button" onClick={() => navigate('welcome')}>처음 오셨나요? <ArrowRight size={16}/></button><button className="hero-text-link" onClick={() => navigate('worship')}>예배 시간 보기</button></div><div className="hero-scroll"><span>SCROLL TO EXPLORE</span><ArrowDown size={15}/></div></div>
      <div className="hero-photo"><img src={images.opening} alt="새성전 입당 예배 모습"/><div className="hero-photo-caption"><span>2026 · 10 · 04</span><b>새로운 예배의 자리에서</b></div><div className="hero-photo-mark">BANGAWOON<br/>CHURCH</div></div>
      <div className="hero-side">SPIRITUALITY <b>·</b> COMMUNITY <b>·</b> NEXT GENERATION</div>
    </section>

    <section className="intro section-wrap"><div className="section-label"><span>01 / OUR HEART</span><span>반가운교회는</span></div><div className="intro-content"><p className="serif-lead">작은 만남이 모여<br/><span>따뜻한 공동체</span>가 됩니다.</p><div className="intro-right"><p>반가운교회는 하나님과의 인격적인 사귐으로 사람이 변화되고, 변화된 사람들이 공동체와 세상 속에서 하나님 나라를 살아가도록 세워가는 교회입니다.</p><button className="text-link" onClick={() => navigate('about')}>교회 소개 보기 <ArrowRight size={16}/></button></div></div></section>

    <section className="values"><div className="section-wrap"><div className="values-head"><div><span className="eyebrow light">OUR THREE PILLARS</span><h2>우리가 함께<br/>세워가는 세 가지</h2></div><p>서로 다른 세 가지 색이 모여<br/>반가운교회의 한 마음이 됩니다.</p></div><div className="value-grid"><Value color="blue" number="01" title="영성목회" english="SPIRITUALITY" body="하나님과 깊이 만나고, 말씀과 기도로 삶이 새로워집니다."/><Value color="sand" number="02" title="공동체" english="COMMUNITY" body="서로를 환대하고 돌보며, 함께 믿음의 길을 걸어갑니다."/><Value color="sage" number="03" title="다음세대" english="NEXT GENERATION" body="어린이와 청소년이 사랑 안에서 믿음의 뿌리를 내립니다."/></div></div></section>

    <section className="worship section-wrap"><div className="section-label"><span>02 / GATHER WITH US</span><span>예배 안내</span></div><div className="worship-content"><div><span className="eyebrow"><i/> COME AS YOU ARE</span><h2>함께 예배해요</h2><p>처음 오시는 분도 환영합니다.<br/>편안한 마음으로 찾아와 주세요.</p><button className="text-link" onClick={() => navigate('worship')}>예배 안내 보기 <ArrowRight size={16}/></button></div><div className="service-list"><Service day="주일" title="주일예배" time="오전 11:00"/><Service day="화–금" title="새벽예배" time="오전 05:30"/><Service day="금요일" title="금요기도회" time="오후 08:30"/><button className="service-location" onClick={() => navigate('location')}><MapPin size={14}/> 서울 성북구 성북로4길 52 · 오시는 길 <ArrowUpRight size={14}/></button></div></div></section>

    <section className="story-feature section-wrap"><div className="story-photo"><img src={images.first} alt="개척 첫 예배"/><span>OUR BEGINNING · 2026.02</span></div><div className="story-copy"><span className="eyebrow"><i/> A STORY OF GRACE</span><h2>가정에서 시작된 예배,<br/>함께 세운 교회</h2><p>2026년 2월의 첫 예배부터 10월 새 성전 입당까지. 작은 시작을 이끌어 주신 은혜의 발자취를 함께 나눕니다.</p><button className="text-link" onClick={() => navigate('history')}>교회 발자취 보기 <ArrowRight size={16}/></button></div></section>

    <section className="home-board"><div className="section-wrap"><div className="board-heading"><div><span className="eyebrow"><i/> FROM OUR CHURCH</span><h2>교회의 오늘과 기록</h2></div><button className="text-link" onClick={() => navigate('gallery')}>사진과 소식 더 보기 <ArrowRight size={16}/></button></div><div className="home-board-grid"><button className="home-card bulletin-home" onClick={() => navigate('bulletin')}><div className="home-card-image"><img src={images.bulletin1} alt="2026년 10월 18일 주보"/></div><div className="home-card-meta"><span>WEEKLY BULLETIN</span><ArrowUpRight size={17}/></div><h3>주일 주보</h3><p>2026년 10월 18일 예배와 교회 소식</p></button><button className="home-card" onClick={() => navigate('community-story')}><div className="home-card-image"><img src={images.sharing} alt="설교 후 말씀 나눔"/></div><div className="home-card-meta"><span>COMMUNITY</span><ArrowUpRight size={17}/></div><h3>말씀을 나누고, 서로를 알아가요</h3><p>예배 후 이어지는 따뜻한 교제의 시간</p></button><button className="home-card newsletter-home" onClick={() => navigate('notices')}><div className="home-card-image"><img src={images.newsletter1} alt="반가운교회 소식지"/></div><div className="home-card-meta"><span>CHURCH NEWS</span><ArrowUpRight size={17}/></div><h3>반가운교회 소식지</h3><p>교회의 소식과 함께 걷는 이야기를 전합니다</p></button></div></div></section>

    <section className="welcome-band"><div><span className="eyebrow light">A PLACE FOR YOU</span><h2>이번 주일,<br/>반갑게 기다릴게요.</h2><p>서울 성북구 성북로4길 52 · 근린상가 3층</p></div><button className="round-arrow" onClick={() => navigate('location')} aria-label="오시는 길"><ArrowUpRight/></button></section>
    <section className="quick-links section-wrap"><button onClick={() => navigate('sermons')}><BookOpen/><span>말씀 다시 나누기</span><ArrowUpRight/></button><button onClick={() => navigate('bulletin')}><CalendarDays/><span>이번 주 주보</span><ArrowUpRight/></button><button onClick={() => navigate('prayer')}><Cross/><span>기도와 예배</span><ArrowUpRight/></button></section>
  </main>
}

function Value({ color, number, title, english, body }: { color: string; number: string; title: string; english: string; body: string }) {
  return <article className={`value-card ${color}`}><span>{number} / {english}</span><div className="value-mark"><i/><b/><em/></div><h3>{title}</h3><p>{body}</p></article>
}

function Service({ day, title, time }: { day: string; title: string; time: string }) {
  return <div className="service-row"><span>{day}</span><b>{title}</b><time><Clock3 size={14}/>{time}</time></div>
}

function Interior({ page, navigate, user, isAdmin, authReady, onAuthOpen }: { page: Page; navigate: (id: string) => void; user: User | null; isAdmin: boolean; authReady: boolean; onAuthOpen: (mode?: 'login' | 'signup') => void }) {
  return <main className="interior"><section className="page-hero"><div className="section-wrap"><span className="eyebrow"><i/> {page.section.toUpperCase()}</span><h1>{page.title}</h1><p>{page.description}</p><div className="breadcrumbs"><button onClick={() => navigate('home')}>홈</button><span>/</span><span>{page.section}</span><span>/</span><b>{page.title}</b></div></div><div className="page-orb"/></section>
    <section className="page-body section-wrap"><PageContent page={page} navigate={navigate} user={user} isAdmin={isAdmin} authReady={authReady} onAuthOpen={onAuthOpen}/></section>
    <section className="page-next section-wrap"><span>다음으로 둘러보기</span><button onClick={() => navigate('welcome')}>처음 오셨나요? <ArrowRight size={16}/></button></section>
  </main>
}

function PageContent({ page, navigate, user, isAdmin, authReady, onAuthOpen }: { page: Page; navigate: (id: string) => void; user: User | null; isAdmin: boolean; authReady: boolean; onAuthOpen: (mode?: 'login' | 'signup') => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  if (boardCategories[page.id]) return <BoardPage page={page} category={boardCategories[page.id]} user={user} isAdmin={isAdmin} authReady={authReady} onAuthOpen={onAuthOpen}/>
  if (page.id === 'bulletin') return <div className="archive-content"><ArchiveHeading eyebrow="WEEKLY BULLETIN" title="주일마다 함께 나누는 예배 안내" note="주보 이미지를 누르면 큰 화면으로 볼 수 있습니다."/><div className="document-grid">{[[images.bulletin1,'주보 1면'],[images.bulletin2,'주보 2면']].map(([src,label]) => <a className="document-card" href={src} target="_blank" rel="noreferrer" key={label}><img src={src} alt={`2026년 10월 18일 ${label}`}/><span>2026.10.18 · {label} <ArrowUpRight size={15}/></span></a>)}</div></div>
  if (page.id === 'sermons') return <div className="archive-content"><ArchiveHeading eyebrow="SUNDAY SERMON" title="말씀을 듣고, 삶으로 이어갑니다" note="설교 영상 주소가 준비되면 재생 버튼과 말씀 정보를 이곳에 연결할 수 있습니다."/><div className="sermon-feature"><div className="sermon-photo"><img src={images.sheet1} alt="2026년 10월 11일 설교 나눔지"/><span><Play size={19}/> 설교 영상 연결 예정</span></div><div><span className="eyebrow"><i/> 2026.10.11 · 설교 나눔</span><h2>주일 말씀을<br/>함께 묵상합니다</h2><p>예배에서 들은 말씀을 주중에도 다시 읽고, 나눔 질문과 함께 묵상할 수 있도록 설교 자료를 모아 둡니다.</p><a className="text-link" href={images.sheet1} target="_blank" rel="noreferrer">설교 나눔지 보기 <ArrowUpRight size={15}/></a></div></div><div className="sermon-thumbs"><a href={images.sheet2} target="_blank" rel="noreferrer"><img src={images.sheet2} alt="설교 나눔지 두 번째 면"/><span>말씀 나눔 자료 · 2면</span></a><figure><img src={images.sharing} alt="설교 후 나눔 모임"/><figcaption>예배 후 말씀 나눔 · 2026.09.26</figcaption></figure></div></div>
  if (page.id === 'history') return <Timeline/>
  if (page.id === 'gallery') return <Gallery/>
  if (page.id === 'notices') return <NewsletterArchive/>
  if (page.id === 'community-story' || page.id === 'prayer-share' || page.id === 'prayer') return <CommunityPage page={page}/>
  if (page.id === 'worship') return <div className="worship-page"><div className="service-list large"><Service day="SUNDAY" title="주일예배" time="매주 오전 11:00"/><Service day="TUE–FRI" title="새벽예배" time="화–금 오전 05:30"/><Service day="FRIDAY" title="금요기도회" time="매주 오후 08:30"/></div><div className="worship-page-photo"><img src={images.interior} alt="반가운교회 예배 공간"/><div><span>WORSHIP TOGETHER</span><b>처음 오시는 분도<br/>편안히 함께 예배드려요.</b></div></div><button className="text-link" onClick={() => navigate('location')}>예배 장소와 오시는 길 <ArrowRight size={16}/></button></div>
  if (page.id === 'location') return <div className="location-layout"><div className="location-card"><MapPin size={22}/><div><span className="eyebrow"><i/> FIND US</span><h2>반가운교회</h2><p>서울 성북구 성북로4길 52<br/>한신한진아파트 411동 근린상가 3층 3302호</p><a href="https://naver.me/xZKH48EF" target="_blank" rel="noreferrer" className="text-link">네이버 지도로 길찾기 <ArrowUpRight size={16}/></a></div></div><iframe className="church-map" title="반가운교회 위치 지도" src="https://maps.google.com/maps?q=%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%B6%81%EA%B5%AC%20%EC%84%B1%EB%B6%81%EB%A1%9C4%EA%B8%B8%2052&z=17&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/></div>
  if (page.id === 'faq') return <div className="faq-list">{['처음 방문할 때 어떻게 하면 되나요?','아이와 함께 예배드릴 수 있나요?','주차 및 건물 출입은 어떻게 하나요?'].map((question, index) => <button className="faq-item" key={question} onClick={() => setOpenFaq(openFaq === index ? null : index)}><b><span>Q{index + 1}</span>{question}<ChevronDown size={17}/></b>{openFaq === index && <p>{index === 0 ? '예배 시간에 맞춰 오시면 안내해 드립니다. 처음 오셨다면 편하게 인사해 주세요.' : index === 1 ? '어린이와 학생도 환영합니다. 가족과 함께 편안하게 예배드리실 수 있습니다.' : '주차와 건물 진입 안내는 교회에서 확인 중입니다. 방문 안내가 정리되면 이곳에 업데이트하겠습니다.'}</p>}</button>)}</div>
  if (page.id === 'sns') return <div className="social-cards"><a href="https://www.instagram.com/bangawoonchurch/" target="_blank" rel="noreferrer"><Instagram/><span>INSTAGRAM</span><b>반가운교회 일상</b><ArrowUpRight/></a><a href="https://www.youtube.com/@%EB%B0%98%EA%B0%80%EC%9A%B4%EA%B5%90%ED%9A%8C" target="_blank" rel="noreferrer"><Youtube/><span>YOUTUBE</span><b>말씀과 예배 영상</b><ArrowUpRight/></a></div>
  if (page.id === 'welcome' || page.id === 'preview') return <WelcomePage navigate={navigate}/>
  if (page.id === 'calendar' || page.id === 'newcomer') return <ComingSoon page={page}/>
  if (page.id === 'nextgen' || page.id === 'nextgen-story') return <NextGenerationPage page={page}/>
  return <ChurchIntro page={page}/>
}

function ArchiveHeading({ eyebrow, title, note }: { eyebrow: string; title: string; note: string }) {
  return <div className="archive-heading"><span className="eyebrow"><i/> {eyebrow}</span><h2>{title}</h2><p>{note}</p></div>
}

type ChurchPost = { id: string; category: string; title: string; body: string; date: string; imageUrl?: string; fileUrl?: string; filePath?: string; fileName?: string; fileType?: string; linkUrl?: string; authorEmail?: string; authorUid?: string }

function BoardPage({ page, category, user, isAdmin, authReady, onAuthOpen }: { page: Page; category: string; user: User | null; isAdmin: boolean; authReady: boolean; onAuthOpen: (mode?: 'login' | 'signup') => void }) {
  const [posts, setPosts] = useState<ChurchPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<ChurchPost | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [attachment, setAttachment] = useState<File | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const canManage = isAdmin || (!!user && memberBoardCategories.has(category))
  const postsQuery = query(collection(db, 'posts'), where('category', '==', category), orderBy('date', 'desc'))

  const refreshPosts = async () => {
    const snapshot = await getDocs(postsQuery)
    setPosts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ChurchPost)))
  }

  useEffect(() => {
    setLoading(true)
    return onSnapshot(postsQuery, (snapshot) => {
      setPosts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ChurchPost)))
      setLoading(false)
      setError('')
    }, () => {
      setLoading(false)
      setError('게시물을 불러오지 못했습니다. Firestore 데이터베이스와 규칙 배포 상태를 확인해 주세요.')
    })
  }, [category])

  const savePost = async (postTitle: string, postDate: string, postBody: string, file: File | null, relatedLink: string) => {
    if (!canManage || !user?.email) return
    setSaving(true)
    setError('')
    let uploadedPath = ''
    let postCreated = false
    try {
      if (file && (file.size > 15 * 1024 * 1024 || !/^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(file.type))) {
        setError('첨부 파일은 JPG, PNG, WEBP, GIF 또는 PDF 형식이며 15MB 이하여야 합니다.')
        return
      }
      let uploadedUrl = ''
      if (file) {
        const safeName = file.name.replace(/[^\w.-]+/g, '-')
        uploadedPath = `posts/${category}/${user.uid}/${crypto.randomUUID()}-${safeName}`
        const uploaded = await uploadBytes(ref(storage, uploadedPath), file, { contentType: file.type })
        uploadedUrl = await getDownloadURL(uploaded.ref)
      }
      await addDoc(collection(db, 'posts'), {
        category, title: postTitle.trim(), body: postBody.trim(), date: postDate,
        ...(uploadedUrl ? { fileUrl: uploadedUrl, ...(file?.type.startsWith('image/') ? { imageUrl: uploadedUrl } : {}), filePath: uploadedPath, fileName: file?.name, fileType: file?.type } : {}),
        ...(relatedLink.trim() ? { linkUrl: relatedLink.trim() } : {}),
        authorEmail: user.email, authorUid: user.uid, createdAt: serverTimestamp(),
      })
      postCreated = true
      await refreshPosts()
      setTitle(''); setBody(''); setAttachment(null); setLinkUrl(''); setSelected(null)
    } catch {
      if (uploadedPath && !postCreated) await deleteObject(ref(storage, uploadedPath)).catch(() => undefined)
      setError(postCreated ? '게시물은 저장됐지만 목록 새로고침에 실패했습니다. 잠시 후 다시 확인해 주세요.' : '게시물 등록에 실패했습니다. 이메일 로그인 제공자, Firebase Storage 버킷과 배포된 보안 규칙을 확인해 주세요.')
    } finally { setSaving(false) }
  }

  const createPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await savePost(title, date, body, attachment, linkUrl)
  }

  const createSampleBulletin = async () => {
    try {
      const response = await fetch(images.bulletin1)
      if (!response.ok) throw new Error('Could not load bulletin image')
      const blob = await response.blob()
      const file = new File([blob], '주보01_20261018.jpg', { type: blob.type || 'image/jpeg' })
      await savePost('주일 주보 · 2026년 10월 18일', '2026-10-18', '참고사진 폴더의 주보 예시입니다. 주보 1면을 첨부했습니다.', file, '')
    } catch {
      setError('예시 주보 파일을 불러오지 못했습니다.')
    }
  }

  const removePost = async (post: ChurchPost) => {
    if (!canManage || !window.confirm(`“${post.title}” 게시물을 삭제할까요?`)) return
    try {
      await deleteDoc(doc(db, 'posts', post.id))
      if (post.filePath) await deleteObject(ref(storage, post.filePath)).catch(() => undefined)
      await refreshPosts()
      if (selected?.id === post.id) setSelected(null)
    } catch { setError('게시물을 삭제하지 못했습니다. 권한과 Firestore 보안 규칙을 확인해 주세요.') }
  }

  return <div className="archive-content board-page">
    <div className="board-topline"><ArchiveHeading eyebrow={category === 'bulletin' ? 'WEEKLY BULLETIN' : page.section.toUpperCase()} title={category === 'bulletin' ? '매주 주보를 모아봅니다' : `${page.title} 게시판`} note={category === 'bulletin' ? '예배 날짜별 주보와 안내를 확인할 수 있습니다.' : page.description}/>
      {user ? <span className="admin-badge">{isAdmin ? '관리자 로그인됨' : '회원 로그인됨'}</span> : <div className="board-auth-buttons"><button className="board-login" onClick={() => onAuthOpen('login')}><LogIn size={15}/> 로그인</button><button className="board-login" onClick={() => onAuthOpen('signup')}>회원가입</button></div>}
    </div>
    {!authReady && <p className="board-status">로그인 상태를 확인하고 있습니다.</p>}
    {canManage && <form className="post-form" onSubmit={createPost}><h3>새 게시물 등록</h3><div className="post-form-grid"><label>제목<input required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="게시물 제목"/></label><label>게시 날짜<input required type="date" value={date} onChange={(e) => setDate(e.target.value)}/></label><label className="wide-field">내용<textarea maxLength={20000} value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="게시물 내용을 입력해 주세요."/></label><label className="attachment-picker"><span>사진 또는 PDF 첨부 (최대 15MB)</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}/>{attachment && <small><ImagePlus size={13}/> {attachment.name}</small>}</label><label>관련 링크(선택)<input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..."/></label></div><button className="pill-button" disabled={saving}>{saving ? '등록 후 목록을 확인하는 중…' : '게시물 등록'} <ArrowRight size={15}/></button></form>}
    {error && <p className="board-error" role="alert">{error}</p>}
    {loading ? <p className="board-status">게시물을 불러오는 중입니다.</p> : posts.length === 0 ? <div className="board-empty"><BookOpen size={28}/><h3>등록된 게시물이 없습니다.</h3><p>{canManage ? '위 입력란에서 게시물과 사진을 등록해 보세요.' : '새 소식이 등록되면 이곳에서 확인하실 수 있습니다.'}</p>{isAdmin && category === 'bulletin' && <button className="sample-bulletin-button" type="button" disabled={saving} onClick={() => void createSampleBulletin()}>{saving ? '참고 주보 등록 및 목록 확인 중…' : '참고사진의 주보 예시 바로 등록'}</button>}</div> : <div className="post-list">{posts.map((post) => <article className="post-card" key={post.id}>{post.imageUrl && <button className="post-image" onClick={() => setSelected(post)}><img src={post.imageUrl} alt=""/></button>}<button className="post-main" onClick={() => setSelected(post)}><time>{post.date}</time><h3>{post.title}</h3><p>{post.body || post.fileName || '자세한 내용을 확인하세요.'}</p></button>{canManage && <button className="post-delete" onClick={() => void removePost(post)} aria-label={`${post.title} 삭제`}><Trash2 size={16}/></button>}</article>)}</div>}
    {selected && <div className="post-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null) }}><article className="post-detail" role="dialog" aria-modal="true" aria-label={selected.title}><button className="post-close" onClick={() => setSelected(null)} aria-label="닫기"><X/></button><time>{selected.date}</time><h2>{selected.title}</h2>{selected.imageUrl && <img className="post-detail-image" src={selected.imageUrl} alt="첨부 이미지"/>}<p>{selected.body}</p>{selected.fileUrl && !selected.imageUrl && <a className="text-link" href={selected.fileUrl} target="_blank" rel="noreferrer">첨부 파일 보기 · {selected.fileName || '파일 열기'} <ArrowUpRight size={15}/></a>}{selected.linkUrl && <a className="text-link" href={selected.linkUrl} target="_blank" rel="noreferrer">관련 자료 열기 <ArrowUpRight size={15}/></a>}{canManage && <button className="post-delete detail-delete" onClick={() => void removePost(selected)}><Trash2 size={15}/> 게시물 삭제</button>}</article></div>}
  </div>
}

function LoginDialog({ mode, onModeChange, onClose, onAuthenticate, message }: { mode: 'login' | 'signup'; onModeChange: (mode: 'login' | 'signup') => void; onClose: () => void; onAuthenticate: (mode: 'login' | 'signup', email: string, password: string) => void; message: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return <div className="post-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><form className="login-dialog" onSubmit={(e) => { e.preventDefault(); void onAuthenticate(mode, email, password) }}><button type="button" className="post-close" onClick={onClose} aria-label="닫기"><X/></button><span className="eyebrow"><i/> BANGAWOON ACCOUNT</span><h2>{mode === 'signup' ? '회원가입' : '로그인'}</h2><p>{mode === 'signup' ? '이메일과 비밀번호로 가입하면 게시판을 읽고 사진앨범·기도 나눔에 참여할 수 있습니다.' : '로그인한 회원은 게시판 권한에 따라 글을 등록·삭제할 수 있습니다.'}</p><label>이메일<input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}/></label><label>비밀번호<input type="password" required minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6자 이상"/></label>{message && <p className="board-error">{message}</p>}<button className="pill-button">{mode === 'signup' ? '회원가입' : '로그인'} <ArrowRight size={15}/></button><button type="button" className="auth-mode-toggle" onClick={() => onModeChange(mode === 'signup' ? 'login' : 'signup')}>{mode === 'signup' ? '이미 계정이 있나요? 로그인' : '처음 오셨나요? 회원가입'}</button><small>관리자 이메일은 별도 관리자 권한을 갖고, 일반 회원은 사진앨범과 기도 나눔 게시판을 관리할 수 있습니다.</small></form></div>
}

function Timeline() {
  const steps = [
    { date: '2026.02', title: '가정에서 시작한 첫 예배', text: '반가운교회의 첫 예배를 드리며 공동체의 걸음을 시작했습니다.', src: images.first },
    { date: '2026.04', title: '연습실에서 이어진 예배', text: '함께 예배드릴 자리를 마련하고 이웃을 맞이했습니다.', src: images.practice },
    { date: '2026.10.04', title: '새 성전에 입당하다', text: '새로운 예배의 자리에서 하나님께 감사의 예배를 드렸습니다.', src: images.opening },
  ]
  return <div className="timeline-page"><ArchiveHeading eyebrow="OUR JOURNEY" title="함께 걸어온 은혜의 시간" note="반가운교회의 시작과 예배의 자리를 사진으로 기록합니다."/><div className="timeline">{steps.map((step, index) => <article className="timeline-item" key={step.date}><div className="timeline-date"><span>0{index + 1}</span><b>{step.date}</b></div><img src={step.src} alt={step.title}/><div><h3>{step.title}</h3><p>{step.text}</p></div></article>)}</div></div>
}

function Gallery() {
  const items = [
    ['새 성전 입당 예배', '2026.10.04', images.opening], ['처음 드린 예배', '2026.02', images.first],
    ['연습실 예배', '2026.04', images.practice], ['기도 모임 나눔', '2026.09.20', images.prayer],
    ['설교 후 말씀 나눔', '2026.09.26', images.sharing], ['예배 공간', '반가운교회', images.interior],
  ]
  return <div className="gallery-page"><ArchiveHeading eyebrow="CHURCH GALLERY" title="우리의 순간을 함께 기억합니다" note="교회가 함께 예배하고 나눈 순간을 담았습니다."/><div className="gallery-grid">{items.map(([title,date,src]) => <figure key={title}><img src={src} alt={title}/><figcaption><span>{date}</span><b>{title}</b></figcaption></figure>)}</div></div>
}

function NewsletterArchive() {
  const issues = [[images.newsletter1,'01면'],[images.newsletter2,'02면'],[images.newsletter3,'03면']]
  return <div className="archive-content"><ArchiveHeading eyebrow="CHURCH NEWSLETTER" title="반가운 소식을 나눕니다" note="현재는 디자인 참고용으로 소식지 이미지를 올려두었습니다. 이후 게시판에서 호별로 등록할 수 있습니다."/><div className="document-grid newsletter-grid">{issues.map(([src,label]) => <a className="document-card" href={src} target="_blank" rel="noreferrer" key={label}><img src={src} alt={`2026년 10월 소식지 ${label}`}/><span>2026.10.17 · {label} <ArrowUpRight size={15}/></span></a>)}</div></div>
}

function CommunityPage({ page }: { page: Page }) {
  const isPrayer = page.id === 'prayer-share' || page.id === 'prayer'
  return <div className="community-feature"><div className="community-feature-image"><img src={isPrayer ? images.prayer : images.sharing} alt={isPrayer ? '기도 모임 나눔' : '설교 후 말씀 나눔'}/><span>{isPrayer ? 'PRAYER · 2026.09.20' : 'FELLOWSHIP · 2026.09.26'}</span></div><div><span className="eyebrow"><i/> {isPrayer ? 'PRAY TOGETHER' : 'LIFE TOGETHER'}</span><h2>{isPrayer ? <>함께 기도하고,<br/>서로를 품습니다.</> : <>말씀을 나누고,<br/>삶을 나눕니다.</>}</h2><p>{isPrayer ? '기도 모임에서 서로의 마음을 나누고 함께 기도합니다. 기도 제목은 기도 나눔 게시판에서 확인하실 수 있습니다.' : '예배 후 나눔과 교제의 순간을 사진과 이야기로 기록합니다. 작은 만남이 쌓여 공동체의 이야기가 됩니다.'}</p><span className="content-note">교회가 함께 예배하고 나눈 순간을 사진으로 담았습니다.</span></div></div>
}

function ChurchIntro({ page }: { page: Page }) {
  if (page.id === 'history') return <Timeline/>
  if (page.id === 'about') return <div className="about-feature"><img src={images.interior} alt="반가운교회 예배 공간"/><div><span className="eyebrow"><i/> OUR CHURCH</span><h2>하나님과의 사귐으로<br/>사람이 변화되는 교회</h2><p>하나님과의 인격적인 사귐을 통해 사람을 변화시키고, 변화된 사람들이 공동체와 세상 속에서 하나님 나라를 살아내도록 세워갑니다.</p><div className="content-tags"><span>대한예수교장로회 통합</span><span>서울 성북구</span></div></div></div>
  if (page.id === 'vision') return <div className="vision-page"><ArchiveHeading eyebrow="OUR VISION" title="세 가지 목회 방향, 하나의 공동체" note="CI에 담긴 세 가지 색을 교회의 핵심 목회 방향으로 소개합니다."/><div className="vision-grid"><Value color="blue" number="01" title="영성목회" english="SPIRITUALITY" body="하나님과의 인격적인 사귐을 통해 삶의 변화를 구합니다."/><Value color="sand" number="02" title="공동체" english="COMMUNITY" body="서로 환대하고 돌보며 하나님 나라를 함께 살아갑니다."/><Value color="sage" number="03" title="다음세대" english="NEXT GENERATION" body="어린이와 학생이 믿음 안에서 자라도록 함께 세웁니다."/></div></div>
  return <div className="pastor-feature"><div className="pastor-placeholder"><Cross size={42}/><span>PASTOR</span></div><div><span className="eyebrow"><i/> GREETING</span><h2>안경혁 목사</h2><p>담임목사님의 인사말과 목회 여정을 소개할 공간입니다. 정식 프로필 사진과 환영 인사 원고를 받으면 반가운교회의 마음을 담아 구성하겠습니다.</p><span className="content-note">초안 단계 · 목사님 사진과 인사말 자료 필요</span></div></div>
}

function WelcomePage({ navigate }: { navigate: (id: string) => void }) {
  return <div className="welcome-info"><div><span className="eyebrow"><i/> YOU ARE WELCOME</span><h2>처음이어도<br/>괜찮습니다.</h2><p>낯선 마음까지 편안히 쉬어갈 수 있도록 반가운교회가 함께하겠습니다. 예배 시간과 위치를 확인하고 찾아와 주세요.</p><button className="pill-button" onClick={() => navigate('worship')}>예배 시간 보기 <ArrowRight size={16}/></button></div><div className="welcome-info-card"><img src={images.first} alt="반가운교회 예배 모습"/><b>주일예배</b><span>매주 오전 11시</span><small>서울 성북구 성북로4길 52</small><button onClick={() => navigate('location')}>오시는 길 <ArrowUpRight size={14}/></button></div></div>
}

function NextGenerationPage({ page }: { page: Page }) {
  return <div className="nextgen-feature"><div className="nextgen-symbol"><span>함께</span><Cross size={38}/><span>자라요</span></div><div><span className="eyebrow"><i/> NEXT GENERATION</span><h2>{page.title}</h2><p>어린이와 학생도 예배와 공동체의 소중한 일원으로 환영합니다. 다음세대의 예배와 활동, 교육 내용을 소개할 공간입니다.</p><span className="content-note">전용 사진과 사역 일정, 연령별 안내를 받으면 실제 콘텐츠로 채울 수 있습니다.</span></div></div>
}

function ComingSoon({ page }: { page: Page }) {
  return <div className="coming-content"><div className="empty-icon">{page.id === 'calendar' ? <CalendarDays/> : <BookOpen/>}</div><span>{page.section.toUpperCase()}</span><h2>{page.title} 화면을 준비하고 있습니다.</h2><p>게시할 일정이나 신청 내용을 전달해 주시면 이 화면에 실제 운영 콘텐츠를 구성하겠습니다.</p></div>
}

function Footer({ navigate, user, isAdmin, onAuthOpen, onLogout }: { navigate: (id: string) => void; user: User | null; isAdmin: boolean; onAuthOpen: (mode?: 'login' | 'signup') => void; onLogout: () => void }) {
  return <footer className="footer"><div className="footer-main"><button className="footer-brand" onClick={() => navigate('home')} aria-label="반가운교회 홈"><img src="/brand-lockup.png" alt="반가운교회"/></button><p>하나님과의 사귐으로 변화되고<br/>함께 하나님 나라를 살아가는 공동체</p><div className="footer-address"><MapPin size={15}/>서울 성북구 성북로4길 52, 근린상가 3층 3302호</div><div className="footer-social"><a href="https://www.instagram.com/bangawoonchurch/" target="_blank" rel="noreferrer"><Instagram size={17}/></a><a href="https://www.youtube.com/@%EB%B0%98%EA%B0%80%EC%9A%B4%EA%B5%90%ED%9A%8C" target="_blank" rel="noreferrer"><Youtube size={18}/></a></div></div><div className="footer-bottom"><span>© 2026 반가운교회. All rights reserved.</span><div className="footer-actions"><button onClick={() => navigate('location')}>오시는 길 <ArrowRight size={13}/></button>{user ? <><span className="signed-in-email">{isAdmin ? '관리자' : user.email}</span><button onClick={onLogout}><LogOut size={13}/> 로그아웃</button></> : <><button onClick={() => onAuthOpen('login')}><LogIn size={13}/> 로그인</button><button onClick={() => onAuthOpen('signup')}>회원가입</button></>}</div></div></footer>
}

export default App
