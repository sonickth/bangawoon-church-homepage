import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, where } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, ChevronDown, Clock3, Cross, Copy, Instagram, MapPin, Menu as MenuIcon, Search, X, Youtube, LogIn, LogOut, Trash2, ImagePlus } from 'lucide-react'
import { ADMIN_EMAIL, auth, db, storage } from './firebase'

type Page = { id: string; title: string; section: string; description: string }
type MenuGroup = { title: string; items: Page[] }

const groups: MenuGroup[] = [
  { title: '교회소개', items: [
    { id: 'about', title: '반가운교회 소개', section: '교회소개', description: '하나님과의 사귐으로 사람이 변화되고, 함께 하나님 나라를 살아가는 공동체입니다.' },
    { id: 'pastor', title: '담임목사 소개', section: '교회소개', description: '안경혁 목사와 반가운교회를 향한 마음을 소개합니다.' },
    { id: 'vision', title: '목회철학', section: '교회소개', description: '영성목회, 공동체, 다음세대의 세 기둥 위에 세워가는 목회입니다.' },
    { id: 'history', title: '교회 발자취', section: '교회소개', description: '가정에서 시작해 예배의 자리로 이어진 반가운교회의 이야기입니다.' },
    { id: 'location', title: '오시는 길', section: '교회소개', description: '서울시 성북구 성북로4길 52, 411동(근린상가) 3층 3302호에 있습니다.' },
  ] },
  { title: '말씀과 예배', items: [
    { id: 'sermons', title: '주일설교', section: '말씀과 예배', description: '함께 들은 말씀을 다시 듣고, 삶의 자리에서 천천히 묵상합니다.' },
    { id: 'bulletin', title: '주보', section: '말씀과 예배', description: '매주 예배 순서와 교회 소식을 담은 주보를 모아봅니다.' },
    { id: 'worship', title: '예배안내', section: '말씀과 예배', description: '주일예배와 주중 예배 시간, 예배 장소를 안내합니다.' },
    { id: 'offering', title: '온라인 봉헌', section: '말씀과 예배', description: '온라인으로 봉헌하실 수 있도록 교회 계좌를 안내합니다.' },
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
  { title: '교회안내', items: [
    { id: 'welcome', title: '처음 오셨나요?', section: '새가족안내', description: '처음 오시는 분도 편안하게 예배드릴 수 있도록 안내해 드립니다.' },
    { id: 'preview', title: '예배 미리보기', section: '새가족안내', description: '예배의 흐름과 분위기를 미리 살펴보세요.' },
    { id: 'faq', title: '자주 묻는 질문', section: '새가족안내', description: '방문 전에 궁금하신 내용을 모았습니다.' },
    { id: 'newcomer', title: '새가족 안내', section: '교회안내', description: '새가족 등록부터 일대일 교육과 소그룹 연결까지 안내합니다.' },
    { id: 'discipleship', title: '제자훈련', section: '교회안내', description: '찾는 이부터 신앙의 기초와 영성 형성까지 함께하는 훈련 과정입니다.' },
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
  const [searchOpen, setSearchOpen] = useState(false)
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
    <div className="topline"><img src="/pck-ci.png" alt="대한예수교장로회"/><span>하나님과 사람을 반갑게 맞이하는 교회</span><button className="top-search-button" onClick={() => setSearchOpen(true)} aria-label="사이트 검색"><Search size={14}/> 검색</button></div>
    <header className="header">
      <button className="brand" onClick={() => navigate('home')} aria-label="반가운교회 홈"><img src="/brand-lockup.png" alt="반가운교회" /></button>
      <nav className="desktop-nav">{groups.map((group) => <div className="nav-group" key={group.title}><button onClick={() => navigate(group.items[0].id)}>{group.title}<ChevronDown size={13}/></button><div className="dropdown">{group.items.map((item) => <button key={item.id} onClick={() => navigate(item.id)}>{item.title}</button>)}</div></div>)}</nav>
      <button className="visit-button" onClick={() => navigate('location')}>예배와 방문 안내 <ArrowUpRight size={15}/></button>
      <div className="header-auth">{user ? <><span>{isAdmin ? '관리자' : user.email}</span><button onClick={() => { void signOut(auth); setAuthMessage('로그아웃되었습니다.') }}><LogOut size={13}/> 로그아웃</button></> : <><button onClick={() => openAuth('login')}><LogIn size={14}/> 로그인</button><button onClick={() => openAuth('signup')}>회원가입</button></>}</div>
      <button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="메뉴 열기">{mobileOpen ? <X/> : <MenuIcon/>}</button>
    </header>
    {mobileOpen && <div className="mobile-nav">{groups.map((group) => <div key={group.title}><p>{group.title}</p>{group.items.map((item) => <button key={item.id} onClick={() => navigate(item.id)}>{item.title}<ArrowRight size={14}/></button>)}</div>)}</div>}
    {page ? <Interior page={page} navigate={navigate} user={user} isAdmin={isAdmin} authReady={authReady} onAuthOpen={openAuth}/> : <Home navigate={navigate}/>}
    <Footer navigate={navigate}/>
    {loginOpen && <LoginDialog mode={authMode} onModeChange={setAuthMode} onClose={() => setLoginOpen(false)} onAuthenticate={authenticate} message={authMessage}/>}
    {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} onNavigate={navigate}/>}
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

    <section className="worship section-wrap"><div className="section-label"><span>02 / GATHER WITH US</span><span>예배 안내</span></div><div className="worship-content"><div><span className="eyebrow"><i/> COME AS YOU ARE</span><h2>함께 예배해요</h2><p>처음 오시는 분도 환영합니다.<br/>편안한 마음으로 찾아와 주세요.</p><button className="text-link" onClick={() => navigate('worship')}>예배 안내 보기 <ArrowRight size={16}/></button></div><div className="service-list"><Service day="매주 주일" title="주일예배" time="오전 11:00"/><Service day="화–금" title="새벽예배" time="오전 05:30"/><Service day="매주 금요일" title="금요기도회" time="오후 08:30"/><button className="service-location" onClick={() => navigate('location')}><MapPin size={14}/> 서울시 성북구 성북로4길 52 · 오시는 길 <ArrowUpRight size={14}/></button></div></div></section>

    <section className="story-feature section-wrap"><div className="story-photo"><img src={images.first} alt="개척 첫 예배"/><span>OUR BEGINNING · 2026.02</span></div><div className="story-copy"><span className="eyebrow"><i/> A STORY OF GRACE</span><h2>가정에서 시작된 예배,<br/>함께 세운 교회</h2><p>2026년 2월의 첫 예배부터 10월 새 성전 입당까지. 작은 시작을 이끌어 주신 은혜의 발자취를 함께 나눕니다.</p><button className="text-link" onClick={() => navigate('history')}>교회 발자취 보기 <ArrowRight size={16}/></button></div></section>

    <section className="home-board"><div className="section-wrap"><div className="board-heading"><div><span className="eyebrow"><i/> FROM OUR CHURCH</span><h2>교회의 오늘과 기록</h2></div><button className="text-link" onClick={() => navigate('gallery')}>사진과 소식 더 보기 <ArrowRight size={16}/></button></div><div className="home-board-grid"><button className="home-card bulletin-home" onClick={() => navigate('bulletin')}><div className="home-card-image"><img src={images.bulletin1} alt="2026년 10월 18일 주보"/></div><div className="home-card-meta"><span>WEEKLY BULLETIN</span><ArrowUpRight size={17}/></div><h3>주일 주보</h3><p>2026년 10월 18일 예배와 교회 소식</p></button><button className="home-card" onClick={() => navigate('community-story')}><div className="home-card-image"><img src={images.sharing} alt="설교 후 말씀 나눔"/></div><div className="home-card-meta"><span>COMMUNITY</span><ArrowUpRight size={17}/></div><h3>말씀을 나누고, 서로를 알아가요</h3><p>예배 후 이어지는 따뜻한 교제의 시간</p></button><button className="home-card newsletter-home" onClick={() => navigate('notices')}><div className="home-card-image"><img src={images.newsletter1} alt="반가운교회 소식지"/></div><div className="home-card-meta"><span>CHURCH NEWS</span><ArrowUpRight size={17}/></div><h3>반가운교회 소식지</h3><p>교회의 소식과 함께 걷는 이야기를 전합니다</p></button></div></div></section>

    <section className="welcome-band"><div><span className="eyebrow light">A PLACE FOR YOU</span><h2>이번 주일,<br/>반갑게 기다릴게요.</h2><p>서울시 성북구 성북로4길 52 · 411동(근린상가) 3층 3302호</p></div><button className="round-arrow" onClick={() => navigate('location')} aria-label="오시는 길"><ArrowUpRight/></button></section>
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
  if (page.id === 'sermons') return <SermonsPage/>
  if (boardCategories[page.id]) return <BoardPage page={page} category={boardCategories[page.id]} user={user} isAdmin={isAdmin} authReady={authReady} onAuthOpen={onAuthOpen}/>
  if (page.id === 'bulletin') return <div className="archive-content"><ArchiveHeading eyebrow="WEEKLY BULLETIN" title="주일마다 함께 나누는 예배 안내" note="주보 이미지를 누르면 큰 화면으로 볼 수 있습니다."/><div className="document-grid">{[[images.bulletin1,'주보 1면'],[images.bulletin2,'주보 2면']].map(([src,label]) => <a className="document-card" href={src} target="_blank" rel="noreferrer" key={label}><img src={src} alt={`2026년 10월 18일 ${label}`}/><span>2026.10.18 · {label} <ArrowUpRight size={15}/></span></a>)}</div></div>
  if (page.id === 'history') return <Timeline/>
  if (page.id === 'gallery') return <Gallery/>
  if (page.id === 'notices') return <NewsletterArchive/>
  if (page.id === 'community-story' || page.id === 'prayer-share' || page.id === 'prayer') return <CommunityPage page={page}/>
  if (page.id === 'worship') return <div className="worship-page"><div className="service-list large"><Service day="매주 주일" title="주일예배" time="오전 11:00"/><Service day="화–금" title="새벽예배" time="오전 05:30"/><Service day="매주 금요일" title="금요기도회" time="오후 08:30"/></div><div className="worship-page-photo"><img src={images.interior} alt="반가운교회 예배 공간"/><div><span>WORSHIP TOGETHER</span><b>처음 오시는 분도<br/>편안히 함께 예배드려요.</b></div></div><button className="text-link" onClick={() => navigate('location')}>예배 장소와 오시는 길 <ArrowRight size={16}/></button></div>
  if (page.id === 'offering') return <OfferingPage/>
  if (page.id === 'location') return <div className="location-layout"><div className="location-card"><MapPin size={22}/><div><span className="eyebrow"><i/> FIND US</span><h2>반가운교회</h2><p>서울시 성북구 성북로4길 52<br/>411동(근린상가) 3층 3302호</p><a href="https://map.naver.com/p/search/%ED%95%98%EB%82%98%ED%83%81%EA%B5%AC%ED%81%B4%EB%9F%BD%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%B6%81%EA%B5%AC%20%EC%84%B1%EB%B6%81%EB%A1%9C4%EA%B8%B8%2052" target="_blank" rel="noreferrer" className="text-link">네이버 지도로 길찾기 <ArrowUpRight size={16}/></a></div></div><iframe className="church-map" title="하나탁구클럽이 있는 건물의 반가운교회 위치 지도" src="https://maps.google.com/maps?q=%ED%95%98%EB%82%98%ED%83%81%EA%B5%AC%ED%81%B4%EB%9F%BD%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%B6%81%EA%B5%AC%20%EC%84%B1%EB%B6%81%EB%A1%9C4%EA%B8%B8%2052%20%EC%A7%80%ED%95%981%EC%B8%B5&z=18&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/></div>
  if (page.id === 'faq') return <div className="faq-list">{['처음 방문할 때 어떻게 하면 되나요?','아이와 함께 예배드릴 수 있나요?','주차 및 건물 출입은 어떻게 하나요?'].map((question, index) => <button className="faq-item" key={question} onClick={() => setOpenFaq(openFaq === index ? null : index)}><b><span>Q{index + 1}</span>{question}<ChevronDown size={17}/></b>{openFaq === index && <p>{index === 0 ? '예배 시간에 맞춰 오시면 안내해 드립니다. 처음 오셨다면 편하게 인사해 주세요.' : index === 1 ? '어린이와 학생도 환영합니다. 가족과 함께 편안하게 예배드리실 수 있습니다.' : '주차와 건물 진입 안내는 교회에서 확인 중입니다. 방문 안내가 정리되면 이곳에 업데이트하겠습니다.'}</p>}</button>)}</div>
  if (page.id === 'sns') return <div className="sns-layout"><section className="social-preview instagram-latest"><div className="youtube-latest-heading"><div><span className="eyebrow"><i/> LATEST FROM INSTAGRAM</span><h2>반가운교회 인스타그램</h2><p>교회의 일상과 최신 게시물을 확인해 보세요.</p></div><a href="https://www.instagram.com/bangawoonchurch/" target="_blank" rel="noreferrer">프로필 방문 <ArrowUpRight size={15}/></a></div><iframe className="instagram-latest-frame" src="https://www.instagram.com/bangawoonchurch/embed" title="반가운교회 Instagram 최신 게시물" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/><a className="social-preview-link" href="https://www.instagram.com/bangawoonchurch/" target="_blank" rel="noreferrer"><Instagram size={16}/> Instagram에서 게시물 더 보기 <ArrowUpRight size={14}/></a></section><section className="social-preview youtube-latest"><div className="youtube-latest-heading"><div><span className="eyebrow"><i/> LATEST FROM YOUTUBE</span><h2>반가운교회 최신 영상</h2><p>재생 버튼을 누르면 이곳에서 바로 시청할 수 있습니다.</p></div><a href="https://www.youtube.com/@%EB%B0%98%EA%B0%80%EC%9A%B4%EA%B5%90%ED%9A%8C" target="_blank" rel="noreferrer">채널 방문 <ArrowUpRight size={15}/></a></div><iframe className="youtube-latest-player" src="https://www.youtube-nocookie.com/embed/videoseries?list=UUuDEXkGt2YDc2rp4ZATt8ow&rel=0" title="반가운교회 YouTube 최신 영상" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/></section></div>
  if (page.id === 'welcome' || page.id === 'preview') return <WelcomePage navigate={navigate}/>
  if (page.id === 'newcomer') return <NewcomerPage/>
  if (page.id === 'discipleship') return <DiscipleshipPage/>
  if (page.id === 'calendar') return <ComingSoon page={page}/>
  if (page.id === 'nextgen' || page.id === 'nextgen-story') return <NextGenerationPage page={page}/>
  return <ChurchIntro page={page}/>
}

function ArchiveHeading({ eyebrow, title, note }: { eyebrow: string; title: string; note: string }) {
  return <div className="archive-heading"><span className="eyebrow"><i/> {eyebrow}</span><h2>{title}</h2><p>{note}</p></div>
}

type PostAttachment = { url: string; path: string; name: string; type: string }
type ChurchPost = { id: string; category: string; title: string; body: string; date: string; imageUrl?: string; fileUrl?: string; filePath?: string; fileName?: string; fileType?: string; attachments?: PostAttachment[]; linkUrl?: string; authorEmail?: string; authorUid?: string }

function BoardPage({ page, category, user, isAdmin, authReady, onAuthOpen }: { page: Page; category: string; user: User | null; isAdmin: boolean; authReady: boolean; onAuthOpen: (mode?: 'login' | 'signup') => void }) {
  const [posts, setPosts] = useState<ChurchPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<ChurchPost | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [attachments, setAttachments] = useState<File[]>([])
  const attachmentInput = useRef<HTMLInputElement>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const canManage = isAdmin || (!!user && memberBoardCategories.has(category))
  const postsQuery = query(collection(db, 'posts'), where('category', '==', category), orderBy('date', 'desc'))

  const refreshPosts = async () => {
    const snapshot = await getDocs(postsQuery)
    setPosts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ChurchPost)))
    setError('')
  }

  const refreshList = async () => {
    setRefreshing(true)
    try { await refreshPosts() }
    catch (cause) {
      const details = cause instanceof Error ? cause.message : '다시 조회하지 못했습니다.'
      setError(`게시물 재조회 실패: ${details}`)
    } finally { setRefreshing(false) }
  }

  useEffect(() => {
    setLoading(true)
    return onSnapshot(postsQuery, (snapshot) => {
      setPosts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ChurchPost)))
      setLoading(false)
      setError('')
    }, (cause) => {
      setLoading(false)
      console.error('Firestore 게시판 조회 오류:', cause)
      setError(`게시물을 불러오지 못했습니다 (${cause.code}). 다시 조회해 보세요. 계속되면 Firebase 규칙/색인 배포 상태를 확인해 주세요.`)
    })
  }, [category])

  const savePost = async (postTitle: string, postDate: string, postBody: string, files: File[], relatedLink: string) => {
    if (!canManage || !user?.email) return
    setSaving(true)
    setError('')
    const uploadedPaths: string[] = []
    let postCreated = false
    try {
      if (files.length > 10) {
        setError('게시물 한 건에 첨부할 수 있는 파일은 최대 10개입니다.')
        return
      }
      if (files.some((file) => file.size > 15 * 1024 * 1024 || !/^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(file.type))) {
        setError('첨부 파일은 JPG, PNG, WEBP, GIF 또는 PDF 형식이며 각각 15MB 이하여야 합니다.')
        return
      }
      const uploadResults = await Promise.allSettled(files.map(async (file) => {
        const safeName = file.name.replace(/[^\w.-]+/g, '-')
        const path = `posts/${category}/${user.uid}/${crypto.randomUUID()}-${safeName}`
        uploadedPaths.push(path)
        const uploaded = await uploadBytes(ref(storage, path), file, { contentType: file.type })
        return { url: await getDownloadURL(uploaded.ref), path, name: file.name, type: file.type }
      }))
      const failedUpload = uploadResults.find((result): result is PromiseRejectedResult => result.status === 'rejected')
      if (failedUpload) throw failedUpload.reason
      const uploadedFiles = uploadResults.map((result) => (result as PromiseFulfilledResult<PostAttachment>).value)
      const firstAttachment = uploadedFiles[0]
      const firstImage = uploadedFiles.find((file) => file.type.startsWith('image/'))
      await addDoc(collection(db, 'posts'), {
        category, title: postTitle.trim(), body: postBody.trim(), date: postDate,
        ...(firstAttachment ? { fileUrl: firstAttachment.url, filePath: firstAttachment.path, fileName: firstAttachment.name, fileType: firstAttachment.type } : {}),
        ...(firstImage ? { imageUrl: firstImage.url } : {}),
        ...(uploadedFiles.length ? { attachments: uploadedFiles } : {}),
        ...(relatedLink.trim() ? { linkUrl: relatedLink.trim() } : {}),
        authorEmail: user.email, authorUid: user.uid, createdAt: serverTimestamp(),
      })
      postCreated = true
      await refreshPosts()
      setTitle(''); setBody(''); setAttachments([]); setLinkUrl(''); setSelected(null)
      if (attachmentInput.current) attachmentInput.current.value = ''
    } catch {
      if (!postCreated) await Promise.all(uploadedPaths.map((path) => deleteObject(ref(storage, path)).catch(() => undefined)))
      setError(postCreated ? '게시물은 저장됐지만 목록 새로고침에 실패했습니다. 잠시 후 다시 확인해 주세요.' : '게시물 등록에 실패했습니다. 이메일 로그인 제공자, Firebase Storage 버킷과 배포된 보안 규칙을 확인해 주세요.')
    } finally { setSaving(false) }
  }

  const createPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await savePost(title, date, body, attachments, linkUrl)
  }

  const createSampleBulletin = async () => {
    try {
      const response = await fetch(images.bulletin1)
      if (!response.ok) throw new Error('Could not load bulletin image')
      const blob = await response.blob()
      const file = new File([blob], '주보01_20261018.jpg', { type: blob.type || 'image/jpeg' })
      await savePost('주일 주보 · 2026년 10월 18일', '2026-10-18', '참고사진 폴더의 주보 예시입니다. 주보 1면을 첨부했습니다.', [file], '')
    } catch {
      setError('예시 주보 파일을 불러오지 못했습니다.')
    }
  }

  const removePost = async (post: ChurchPost) => {
    if (!canManage || !window.confirm(`“${post.title}” 게시물을 삭제할까요?`)) return
    try {
      await deleteDoc(doc(db, 'posts', post.id))
      const filePaths = post.attachments?.map((file) => file.path) ?? (post.filePath ? [post.filePath] : [])
      await Promise.all(filePaths.map((path) => deleteObject(ref(storage, path)).catch(() => undefined)))
      await refreshPosts()
      if (selected?.id === post.id) setSelected(null)
    } catch { setError('게시물을 삭제하지 못했습니다. 권한과 Firestore 보안 규칙을 확인해 주세요.') }
  }

  return <div className="archive-content board-page">
    <div className="board-topline"><ArchiveHeading eyebrow={category === 'bulletin' ? 'WEEKLY BULLETIN' : page.section.toUpperCase()} title={category === 'bulletin' ? '매주 주보를 모아봅니다' : `${page.title} 게시판`} note={category === 'bulletin' ? '예배 날짜별 주보와 안내를 확인할 수 있습니다.' : page.description}/>
      {user ? <span className="admin-badge">{isAdmin ? '관리자 로그인됨' : '회원 로그인됨'}</span> : <div className="board-auth-buttons"><button className="board-login" onClick={() => onAuthOpen('login')}><LogIn size={15}/> 로그인</button><button className="board-login" onClick={() => onAuthOpen('signup')}>회원가입</button></div>}
    </div>
    {!authReady && <p className="board-status">로그인 상태를 확인하고 있습니다.</p>}
    {canManage && <form className="post-form" onSubmit={createPost}><h3>새 게시물 등록</h3><div className="post-form-grid"><label>제목<input required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="게시물 제목"/></label><label>게시 날짜<input required type="date" value={date} onChange={(e) => setDate(e.target.value)}/></label><label className="wide-field">내용<textarea maxLength={20000} value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="게시물 내용을 입력해 주세요."/></label><label className="attachment-picker"><span>사진 또는 PDF 여러 개 첨부 (최대 10개, 파일당 15MB)</span><input ref={attachmentInput} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={(e) => setAttachments(Array.from(e.target.files ?? []))}/>{attachments.length > 0 && <small><ImagePlus size={13}/> {attachments.length}개 선택됨: {attachments.map((file) => file.name).join(', ')}</small>}</label><label>관련 링크(선택)<input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..."/></label></div><button className="pill-button" disabled={saving}>{saving ? '등록 후 목록을 확인하는 중…' : '게시물 등록'} <ArrowRight size={15}/></button></form>}
    {error && <div className="board-error" role="alert"><span>{error}</span><button type="button" onClick={() => void refreshList()} disabled={refreshing}>{refreshing ? '조회 중…' : '다시 조회'}</button></div>}
    <div className="post-list-tools"><span>{posts.length}개 게시물</span><button type="button" onClick={() => void refreshList()} disabled={refreshing}>{refreshing ? '다시 조회 중…' : '목록 다시 조회'}</button></div>
    {loading ? <p className="board-status">게시물을 불러오는 중입니다.</p> : posts.length === 0 ? <div className="board-empty"><BookOpen size={28}/><h3>등록된 게시물이 없습니다.</h3><p>{canManage ? '위 입력란에서 게시물과 사진을 등록해 보세요.' : '새 소식이 등록되면 이곳에서 확인하실 수 있습니다.'}</p>{isAdmin && category === 'bulletin' && <button className="sample-bulletin-button" type="button" disabled={saving} onClick={() => void createSampleBulletin()}>{saving ? '참고 주보 등록 및 목록 확인 중…' : '참고사진의 주보 예시 바로 등록'}</button>}</div> : <div className="post-list">{posts.map((post) => { const postFiles = post.attachments?.length ? post.attachments : post.fileUrl ? [{ url: post.fileUrl, path: post.filePath ?? '', name: post.fileName ?? '첨부 파일', type: post.fileType ?? '' }] : []; const thumbnail = postFiles.find((file) => file.type.startsWith('image/'))?.url ?? post.imageUrl; return <article className="post-card" key={post.id}>{thumbnail && <button className="post-image" onClick={() => setSelected(post)}><img src={thumbnail} alt="첨부 미리보기"/>{postFiles.filter((file) => file.type.startsWith('image/')).length > 1 && <span className="attachment-count">사진 {postFiles.filter((file) => file.type.startsWith('image/')).length}장</span>}</button>}<button className="post-main" onClick={() => setSelected(post)}><time>{post.date}</time><h3>{post.title}</h3><p>{post.body || postFiles.map((file) => file.name).join(', ') || '자세한 내용을 확인하세요.'}</p></button>{canManage && <button className="post-delete" onClick={() => void removePost(post)} aria-label={`${post.title} 삭제`}><Trash2 size={16}/></button>}</article>})}</div>}
    {selected && <div className="post-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null) }}><article className="post-detail" role="dialog" aria-modal="true" aria-label={selected.title}><button className="post-close" onClick={() => setSelected(null)} aria-label="닫기"><X/></button><time>{selected.date}</time><h2>{selected.title}</h2><p>{selected.body}</p><div className="post-attachments">{(selected.attachments?.length ? selected.attachments : selected.fileUrl ? [{ url: selected.fileUrl, path: selected.filePath ?? '', name: selected.fileName ?? '첨부 파일', type: selected.fileType ?? '' }] : []).map((file) => file.type.startsWith('image/') ? <a key={file.path || file.url} href={file.url} target="_blank" rel="noreferrer" className="post-attachment-image"><img src={file.url} alt={file.name}/><span>{file.name} <ArrowUpRight size={14}/></span></a> : <a className="post-attachment-file" key={file.path || file.url} href={file.url} target="_blank" rel="noreferrer"><BookOpen size={17}/>{file.name}<ArrowUpRight size={14}/></a>)}</div>{selected.linkUrl && <a className="text-link" href={selected.linkUrl} target="_blank" rel="noreferrer">관련 자료 열기 <ArrowUpRight size={15}/></a>}{canManage && <button className="post-delete detail-delete" onClick={() => void removePost(selected)}><Trash2 size={15}/> 게시물 삭제</button>}</article></div>}
  </div>
}

function SearchDialog({ onClose, onNavigate }: { onClose: () => void; onNavigate: (id: string) => void }) {
  const [term, setTerm] = useState('')
  const [posts, setPosts] = useState<Array<{ id: string; title: string; body: string; date: string; category: string }>>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  useEffect(() => {
    let active = true
    void getDocs(collection(db, 'posts')).then((snapshot) => {
      if (!active) return
      setPosts(snapshot.docs.map((item) => {
        const data = item.data()
        return { id: item.id, title: String(data.title ?? ''), body: String(data.body ?? ''), date: String(data.date ?? ''), category: String(data.category ?? '') }
      }))
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setLoadError(true)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  const normalizedTerm = term.trim().toLocaleLowerCase('ko')
  const pageResults = normalizedTerm ? allPages.filter((item) => `${item.title} ${item.section} ${item.description}`.toLocaleLowerCase('ko').includes(normalizedTerm)) : []
  const pageIdByCategory: Record<string, string> = { sermons: 'sermons', bulletin: 'bulletin', notices: 'notices', calendar: 'calendar', gallery: 'gallery', community: 'community-story', nextgen: 'nextgen-story', prayer: 'prayer-share' }
  const postResults = normalizedTerm ? posts.filter((item) => `${item.title} ${item.body} ${item.category} ${item.date}`.toLocaleLowerCase('ko').includes(normalizedTerm)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10) : []
  const hasResults = pageResults.length + postResults.length > 0
  const goToPage = (id: string) => { onClose(); onNavigate(id) }

  return <div className="post-overlay search-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><section className="search-dialog" role="dialog" aria-modal="true" aria-label="사이트 검색"><button className="post-close" onClick={onClose} aria-label="검색 닫기"><X/></button><span className="eyebrow"><i/> BANGAWOON SEARCH</span><h2>무엇을 찾으세요?</h2><label className="search-input-wrap"><Search size={19}/><input type="search" autoFocus value={term} onChange={(e) => setTerm(e.target.value)} placeholder="메뉴와 게시물 검색" aria-label="검색어"/></label><div className="search-results" aria-live="polite">{!normalizedTerm ? <p className="search-hint">메뉴 이름이나 게시물 제목, 내용을 검색해 보세요.</p> : <>{pageResults.map((item) => <button className="search-result" key={`page-${item.id}`} onClick={() => goToPage(item.id)}><span>메뉴 · {item.section}</span><b>{item.title}</b><ArrowRight size={16}/></button>)}{postResults.map((item) => { const destination = pageIdByCategory[item.category]; const categoryName = allPages.find((page) => page.id === destination)?.title ?? '게시판'; return <button className="search-result" key={`post-${item.id}`} onClick={() => destination && goToPage(destination)} disabled={!destination}><span>게시물 · {categoryName} · {item.date}</span><b>{item.title}</b><small>{item.body || '게시물 내용을 확인하세요.'}</small><ArrowRight size={16}/></button> })}{!hasResults && !loading && <p className="search-hint">검색 결과가 없습니다.</p>}</>}{normalizedTerm && loading && <p className="search-hint">게시물을 함께 검색하고 있습니다…</p>}{normalizedTerm && loadError && <p className="search-load-error">게시물을 불러오지 못했습니다. 메뉴 검색 결과는 계속 표시됩니다.</p>}</div></section></div>
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
  if (page.id === 'about') return <div className="about-page"><div className="about-feature"><img src={images.interior} alt="반가운교회 예배 공간"/><div><span className="eyebrow"><i/> OUR CHURCH</span><h2>하나님과의 사귐으로<br/>사람이 변화되는 교회</h2><p>하나님과의 인격적인 사귐을 통해 사람을 변화시키고, 그 변화된 사람들이 공동체와 세상 속에서 하나님 나라를 살아내도록 세워갑니다.</p><div className="content-tags"><span>대한예수교장로회 통합</span><span>서울 성북구</span></div></div></div><div className="church-keywords"><span className="eyebrow"><i/> OUR KEYWORDS</span><b>영성목회</b><b>다음 세대</b></div></div>
  if (page.id === 'vision') return <div className="vision-page"><ArchiveHeading eyebrow="OUR PASTORAL PHILOSOPHY" title="하나님과 사귀며, 지금 여기서 하나님 나라를" note="한 사람의 마음에서 시작된 변화가 공동체와 세상으로 흘러가도록 말씀·기도·예배·소그룹에 집중합니다."/><div className="philosophy-list">{[
    ['01','사귐 중심의 신앙','문제 해결과 소원 성취 중심에서 벗어나 하나님과 인격적으로 사귀는 신앙을 지향합니다.'],
    ['02','지금 여기의 하나님 나라','죽어서 가는 천국에만 머물지 않고, 지금 여기 임한 하나님 나라를 살아갑니다.'],
    ['03','사람이 교회입니다','교회는 건물이 아니라 하나님과 친밀히 교제하고 하나님의 다스림을 받으며 살아가는 사람입니다.'],
    ['04','마음의 변화에 집중','겉으로 드러나는 활동보다 한 사람의 마음이 하나님 안에서 변화되는 일을 소중히 여깁니다.'],
    ['05','영적 목마름을 채우는 신앙','프로그램과 봉사에 앞서 말씀, 기도, 예배, 소그룹을 통해 영적인 목마름이 해갈되도록 합니다.'],
    ['06','변화가 흘러가는 선교 공동체','한 사람의 변화가 가정·학교·직장·교회·사회·나라·열방으로 흘러가 온 세상에 하나님 나라가 임하기를 지향합니다.'],
    ['07','함께 갈망하는 영적 공동체','하나님과의 사귐과 영적 성장을 함께 갈망하는 공동체로 뿌리내리고 실제로 기능할 때 열매 맺음을 믿습니다.'],
    ['08','있는 모습 그대로 사랑하기','소그룹 안에서 말씀을 나누고, 진실하게 나누며, 있는 모습 그대로 서로 사랑하는 공동체를 세웁니다.'],
  ].map(([number,title,body]) => <article className="philosophy-card" key={number}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div><div className="philosophy-pillars"><span>말씀</span><span>기도</span><span>예배</span><span>소그룹</span><span>선교</span></div></div>
  return <div className="pastor-feature"><div className="pastor-placeholder"><Cross size={42}/><span>PASTOR</span></div><div><span className="eyebrow"><i/> SENIOR PASTOR</span><h2>안경혁 목사</h2><p>대한예수교장로회 통합교단 소속으로, 광나루 장로회신학대학교를 졸업하고 반가운교회를 섬기고 있습니다.</p><span className="content-note">담임목사 · 대한예수교장로회 통합 · 광나루 장신대 졸업</span></div></div>
}

function OfferingPage() {
  const [copied, setCopied] = useState(false)
  const accountNumber = '1005-504-951566'
  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }
  return <div className="offering-page"><ArchiveHeading eyebrow="ONLINE OFFERING" title="마음과 정성을 함께 나눕니다" note="온라인으로 봉헌하실 수 있도록 교회 계좌를 안내합니다. 보내주신 정성은 반가운교회의 사역과 하나님 나라를 위해 사용됩니다."/><section className="offering-account"><div className="offering-mark"><BookOpen size={23}/></div><span>WOORI BANK · 우리은행</span><h2>반가운교회</h2><div className="offering-number"><b>{accountNumber}</b><button onClick={() => void copyAccount()} aria-label="계좌번호 복사">{copied ? '복사 완료' : <><Copy size={15}/> 계좌번호 복사</>}</button></div><p>예금주 <b>반가운교회</b></p></section><p className="offering-note">봉헌 관련 문의가 있으시면 교회로 문의해 주세요. 보내실 때 성함이나 봉헌 항목을 함께 기재하실 수 있습니다.</p></div>
}

function NewcomerPage() {
  const steps = [
    ['01', '새가족 등록 신청', '새가족부원의 안내를 받아 등록카드를 작성합니다. 등록은 예배 후 담임목사님과 만나 진행하실 수 있습니다.'],
    ['02', '담임목사님과 일대일 교육', '담임목사님과 시간을 정해 일대일로 4주간 교육과정을 가집니다.'],
    ['03', '소그룹 모임과 함께하는 신앙생활', '새가족 교육과정을 마친 뒤 소그룹 모임에 참석하며 공동체 안에서 신앙생활을 이어갑니다.'],
  ]
  return <div className="newcomer-page"><ArchiveHeading eyebrow="WELCOME TO BANGAWOON" title="반가운 공동체에 오신 것을 환영합니다" note="새가족 등록부터 공동체에 함께하기까지 차근차근 안내해 드립니다."/><div className="newcomer-steps">{steps.map(([number,title,body]) => <article className="newcomer-step" key={number}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div><p className="newcomer-note">처음 오신 날 예배 후 담임목사님이나 새가족부원에게 말씀해 주세요. 반갑게 맞이하고 다음 과정을 안내해 드리겠습니다.</p></div>
}

function DiscipleshipPage() {
  const courses = [
    ['01', '풍성한 삶으로의 초대', '찾는 이를 위한 과정', '8주 과정'],
    ['02', '풍성한 삶의 첫걸음', '초신자를 위한 과정', '10주 과정'],
    ['03', '풍성한 삶의 기초', '균형 있는 신앙을 위한 과정', '12주 과정'],
    ['04', '내적치유 과정', '소그룹으로 함께하는 과정', '12주 과정'],
    ['05', '향심기도 훈련', '하나님과의 일치를 위한 기도 훈련', '기도 훈련'],
    ['06', '영성 형성 기도 과정', '일대일 영적 지도 과정', '일대일 과정'],
  ]
  return <div className="discipleship-page"><ArchiveHeading eyebrow="GROWING IN FAITH" title="함께 배우고, 함께 자랍니다" note="삶의 자리에서 하나님과 동행하도록 돕는 반가운교회의 제자훈련 과정입니다."/><div className="discipleship-intro"><span className="eyebrow"><i/> DISCIPLESHIP & SPIRITUAL FORMATION</span><p>찾는 이에게는 믿음의 초대를, 신앙의 첫걸음을 걷는 이에게는 든든한 기초를, 공동체에는 함께 깊어지는 영성의 길을 안내합니다.</p></div><div className="discipleship-grid">{courses.map(([number,title,description,duration]) => <article className="discipleship-card" key={number}><span className="discipleship-number">{number}</span><span className="discipleship-duration">{duration}</span><h3>{title}</h3><p>{description}</p></article>)}</div><p className="discipleship-note">과정의 일정과 참여 안내는 교회 공지 또는 예배 후 교회에서 확인해 주세요.</p></div>
}

function WelcomePage({ navigate }: { navigate: (id: string) => void }) {
  return <div className="welcome-info"><div><span className="eyebrow"><i/> YOU ARE WELCOME</span><h2>처음이어도<br/>괜찮습니다.</h2><p>낯선 마음까지 편안히 쉬어갈 수 있도록 반가운교회가 함께하겠습니다. 예배 시간과 위치를 확인하고 찾아와 주세요.</p><button className="pill-button" onClick={() => navigate('worship')}>예배 시간 보기 <ArrowRight size={16}/></button></div><div className="welcome-info-card"><img src={images.first} alt="반가운교회 예배 모습"/><b>주일예배</b><span>매주 주일 오전 11:00</span><small>서울시 성북구 성북로4길 52<br/>411동(근린상가) 3층 3302호</small><button onClick={() => navigate('location')}>오시는 길 <ArrowUpRight size={14}/></button></div></div>
}

function NextGenerationPage({ page }: { page: Page }) {
  return <div className="nextgen-feature"><div className="nextgen-symbol"><span>함께</span><Cross size={38}/><span>자라요</span></div><div><span className="eyebrow"><i/> NEXT GENERATION</span><h2>{page.title}</h2><p>어린이와 학생도 예배와 공동체의 소중한 일원으로 환영합니다. 다음세대의 예배와 활동, 교육 내용을 소개할 공간입니다.</p><span className="content-note">전용 사진과 사역 일정, 연령별 안내를 받으면 실제 콘텐츠로 채울 수 있습니다.</span></div></div>
}

function ComingSoon({ page }: { page: Page }) {
  return <div className="coming-content"><div className="empty-icon">{page.id === 'calendar' ? <CalendarDays/> : <BookOpen/>}</div><span>{page.section.toUpperCase()}</span><h2>{page.title} 화면을 준비하고 있습니다.</h2><p>게시할 일정이나 신청 내용을 전달해 주시면 이 화면에 실제 운영 콘텐츠를 구성하겠습니다.</p></div>
}

function SermonsPage() {
  const livePlaylistUrl = 'https://www.youtube.com/playlist?list=UULVuDEXkGt2YDc2rp4ZATt8ow'
  return <div className="sermons-page"><ArchiveHeading eyebrow="SUNDAY WORSHIP · YOUTUBE LIVE" title="날짜별 주일예배 다시보기" note="반가운교회 YouTube 라이브 다시보기 목록을 최신 날짜순으로 연결했습니다. 목록에서 날짜와 ‘주일예배’가 표시된 영상을 선택해 재생하세요."/><section className="sermon-live-card"><div className="sermon-live-header"><span><i/> YOUTUBE LIVE ARCHIVE</span><a href={livePlaylistUrl} target="_blank" rel="noreferrer">YouTube에서 날짜별 목록 보기 <ArrowUpRight size={15}/></a></div><iframe className="sermon-live-player" src="https://www.youtube-nocookie.com/embed/videoseries?list=UULVuDEXkGt2YDc2rp4ZATt8ow&rel=0" title="반가운교회 주일예배 라이브 다시보기" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/><p className="sermon-live-note">재생목록은 YouTube 채널의 공개 라이브 영상을 기준으로 갱신됩니다. 영상 제목의 날짜를 확인해 원하는 주일예배를 선택해 주세요.</p></section><a className="sermon-channel-link" href="https://www.youtube.com/@%EB%B0%98%EA%B0%80%EC%9A%B4%EA%B5%90%ED%9A%8C/streams" target="_blank" rel="noreferrer"><Youtube size={18}/> 반가운교회 YouTube 라이브 탭 열기 <ArrowUpRight size={15}/></a></div>
}

function Footer({ navigate }: { navigate: (id: string) => void }) {
  return <footer className="footer"><div className="footer-main"><button className="footer-brand" onClick={() => navigate('home')} aria-label="반가운교회 홈"><img src="/brand-lockup.png" alt="반가운교회"/></button><p>하나님과의 사귐으로 변화되고<br/>함께 하나님 나라를 살아가는 공동체</p><div className="footer-address"><MapPin size={15}/>서울시 성북구 성북로4길 52, 411동(근린상가) 3층 3302호</div><div className="footer-social"><a href="https://www.instagram.com/bangawoonchurch/" target="_blank" rel="noreferrer"><Instagram size={17}/></a><a href="https://www.youtube.com/@%EB%B0%98%EA%B0%80%EC%9A%B4%EA%B5%90%ED%9A%8C" target="_blank" rel="noreferrer"><Youtube size={18}/></a></div></div><div className="footer-bottom"><span>© 2026 반가운교회. All rights reserved.</span><div className="footer-actions"><button onClick={() => navigate('location')}>오시는 길 <ArrowRight size={13}/></button></div></div></footer>
}

export default App
