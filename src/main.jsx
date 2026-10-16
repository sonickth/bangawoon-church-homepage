import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowRight, ArrowUpRight, Menu, X, MapPin, Clock3, Instagram, Youtube, Heart, Sparkles, UsersRound, BookOpen, Cross, ChevronRight } from 'lucide-react';
import './style.css';

const address = '서울 성북구 성북로4길 52, 한신한진아파트 411동 근린상가 3층 3302호';
const nav = [
  { title: '교회소개', links: ['반가운교회', '목회철학', '담임목사', '오시는 길'] },
  { title: '예배와 말씀', links: ['예배 안내', '말씀 나눔', '기도 모임'] },
  { title: '공동체', links: ['함께하는 사람들', '다음세대', '소그룹'] },
  { title: '소식과 나눔', links: ['교회 소식', '사진 이야기', '처음 오셨나요?'] },
];
const beliefs = [
  ['01', '하나님과 사귀는 신앙', '문제 해결을 넘어 하나님과의 인격적인 사귐을 신앙의 중심에 둡니다.', 'heart'],
  ['02', '오늘 여기의 하나님 나라', '죽어서 가는 천국만이 아니라, 지금 우리의 삶에 임하는 하나님 나라를 살아갑니다.', 'sparkles'],
  ['03', '마음에서 시작되는 변화', '겉으로 보이는 활동보다 한 사람의 마음이 말씀 안에서 새로워지는 일에 집중합니다.', 'book'],
  ['04', '함께 자라는 영적 공동체', '있는 모습 그대로 서로 사랑하며, 진실한 나눔으로 함께 성장합니다.', 'people'],
];
const Icon = ({name,...props}) => ({heart:<Heart {...props}/>,sparkles:<Sparkles {...props}/>,book:<BookOpen {...props}/>,people:<UsersRound {...props}/>}[name]);

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('');
  const jump = (id) => { document.getElementById(id)?.scrollIntoView({behavior:'smooth'}); setMenuOpen(false); setActive(''); };
  return <>
    <div className="topline"><span>대한예수교장로회 통합</span><span className="topline-right">서울 성북구 성북동 · 반가운교회</span></div>
    <header className="header">
      <a className="brand" href="#home" aria-label="반가운교회 홈"><span className="brand-symbol"><Cross size={21}/></span><span><b>반가운교회</b><small>BANGAWOON CHURCH</small></span></a>
      <nav className="desktop-nav">{nav.map(item=><button key={item.title} onMouseEnter={()=>setActive(item.title)} onClick={()=>setActive(active===item.title?'':item.title)}>{item.title}<span className="nav-dot"/></button>)}</nav>
      <button className="visit-btn" onClick={()=>jump('visit')}>처음 오셨나요? <ArrowUpRight size={15}/></button>
      <button className="mobile-menu" onClick={()=>setMenuOpen(!menuOpen)} aria-label="메뉴 열기">{menuOpen?<X/>:<Menu/>}</button>
      {active && <div className="mega" onMouseLeave={()=>setActive('')}><div><span className="eyebrow">{active}</span><h3>반가운 마음으로<br/>여러분을 기다립니다.</h3></div><div className="mega-links">{nav.find(n=>n.title===active)?.links.map(l=><button key={l} onClick={()=>jump(l==='오시는 길'?'visit':l==='예배 안내'?'worship':l==='목회철학'?'beliefs':'about')}>{l}<ChevronRight size={14}/></button>)}</div><div className="mega-note">하나님과 사귀며<br/>함께 자라가는 공동체</div></div>}
    </header>
    {menuOpen && <div className="mobile-drawer">{nav.map(n=><div key={n.title}><button className="mobile-nav-title" onClick={()=>setActive(active===n.title?'':n.title)}>{n.title}<ChevronRight size={16}/></button>{active===n.title&&n.links.map(l=><button className="mobile-nav-sub" key={l} onClick={()=>jump(l==='오시는 길'?'visit':l==='예배 안내'?'worship':l==='목회철학'?'beliefs':'about')}>{l}</button>)}</div>)}<button className="drawer-visit" onClick={()=>jump('visit')}>처음 오셨나요? <ArrowRight size={16}/></button></div>}

    <main id="home">
      <section className="hero">
        <div className="hero-image"><div className="sunwash"/><div className="hero-arch"><div className="arch-inner"><div className="arch-cross"><span/></div><div className="arch-copy"><span>WORSHIP · COMMUNITY · NEXT GENERATION</span><b>함께 예배하고<br/>함께 자라는</b><em>반가운 공동체</em></div></div></div></div>
        <div className="hero-content"><span className="eyebrow"><i/> 하나님과 사귀며, 함께 자라는 교회</span><h1>당신의 오늘에<br/><span>반가운 은혜</span>가 있기를</h1><p>있는 모습 그대로 환대하고, 말씀과 기도 안에서<br className="desktop-only"/> 하나님과 함께 자라가는 공동체입니다.</p><div className="hero-actions"><button className="primary-btn" onClick={()=>jump('visit')}>교회에 처음 오시나요? <ArrowRight size={17}/></button><button className="text-btn" onClick={()=>jump('about')}>반가운교회 알아보기 <ArrowDown size={15}/></button></div></div>
        <div className="hero-index"><b>01</b><span/>03</div><div className="hero-side">A PLACE TO GROW TOGETHER</div>
      </section>

      <section className="quickbar" id="worship"><div className="quick-intro"><span className="eyebrow">JOIN US THIS WEEK</span><strong>함께 예배해요</strong></div><div className="service"><span className="service-icon"><Cross size={17}/></span><div><small>주일예배</small><b>주일 오전 11:00</b></div></div><div className="service"><span className="service-icon green"><Clock3 size={17}/></span><div><small>새벽예배 · 화–금</small><b>오전 5:30</b></div></div><div className="service"><span className="service-icon sand"><Heart size={17}/></span><div><small>금요기도회</small><b>금요일 저녁 8:30</b></div></div><button className="bar-arrow" onClick={()=>jump('visit')} aria-label="오시는 길"><ArrowRight size={19}/></button></section>

      <section className="intro section-pad" id="about"><div className="intro-left"><span className="eyebrow"><i className="blue-dot"/> WELCOME TO BANGAWOON</span><h2>반가운 마음으로<br/>함께 걸어가요<span className="period">.</span></h2><p>반가운교회는 하나님과의 인격적인 사귐을 통해 사람이 변화되고, 변화된 사람들이 공동체와 세상 속에서 하나님 나라를 살아내도록 세워가는 교회입니다.</p><button className="under-link" onClick={()=>jump('beliefs')}>우리 교회 더 알아보기 <ArrowRight size={16}/></button></div><div className="intro-right"><div className="intro-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><span className="art-cross"><Cross size={43}/></span><div className="art-caption"><span>GROW IN</span><b>Grace<br/>&amp; Truth</b></div><span className="art-stamp">성북동에서<br/>함께 자라다</span></div><div className="intro-quote"><span>“</span><p>하나님과의 사귐이<br/>우리의 삶을 바꿉니다.</p></div></div></section>

      <section className="belief-section section-pad" id="beliefs"><div className="section-heading"><div><span className="eyebrow">OUR VISION & VALUES</span><h2>우리가 함께 바라보는 것</h2></div><p>말씀과 기도, 예배와 소그룹 안에서<br/>하나님 나라를 함께 살아갑니다.</p></div><div className="belief-grid">{beliefs.map(([n,title,desc,icon])=><article className="belief-card" key={n}><div className="belief-top"><span>{n}</span><Icon name={icon} size={19}/></div><h3>{title}</h3><p>{desc}</p><span className="belief-line"/></article>)}</div><div className="vision-note"><span className="vision-mark">“</span><p>한 사람의 변화가 가정과 학교, 일터와 세상으로 흘러가도록<br className="desktop-only"/> 우리는 함께 하나님 나라를 꿈꿉니다.</p><span className="vision-tag">SPIRITUALITY · COMMUNITY · NEXT GENERATION</span></div></section>

      <section className="story-section"><div className="story-photo"><div className="photo-overlay"/><div className="photo-label"><span>OUR STORY</span><b>작은 시작,<br/>함께 세운 예배의 자리</b></div><div className="photo-note">2026. 10. 04<br/>새 성전 첫 예배</div></div><div className="story-copy"><span className="eyebrow">A CHURCH PLANTED IN FEBRUARY</span><h2>반가운교회,<br/>이야기가 시작됐어요</h2><p>목사님 가정에서 시작된 작은 예배가 성도들의 기도와 사랑으로 이어졌습니다. 연습실에서 함께 예배하고 나누던 시간들을 지나, 2026년 10월 새로운 성전에서 예배를 드리게 되었습니다.</p><div className="timeline"><div><b>02</b><span>가정에서 시작한 첫 예배</span></div><div><b>04</b><span>연습실에서 함께 드린 예배</span></div><div className="current"><b>10</b><span>새 성전 입당, 새로운 걸음</span></div></div><button className="under-link" onClick={()=>jump('visit')}>우리 공동체 만나기 <ArrowRight size={16}/></button></div></section>

      <section className="welcome section-pad" id="visit"><div className="welcome-copy"><span className="eyebrow"><i className="green-dot"/> YOUR FIRST VISIT</span><h2>처음이어도<br/>괜찮아요<span className="period">.</span></h2><p>낯설고 어색한 마음까지 반갑게 맞이할게요.<br/>예배 시간에 맞춰 편하게 찾아와 주세요.</p><div className="welcome-meta"><div><span className="meta-icon"><MapPin size={18}/></span><div><small>오시는 곳</small><b>{address}</b></div></div><div><span className="meta-icon"><Clock3 size={18}/></span><div><small>주일예배</small><b>매주 주일 오전 11:00</b></div></div></div><a className="map-btn" href="https://naver.me/xZKH48EF" target="_blank" rel="noreferrer">네이버 지도로 길찾기 <ArrowUpRight size={16}/></a></div><div className="map-card"><div className="map-bg"><div className="street street-a"/><div className="street street-b"/><div className="street street-c"/><div className="park"><span>성북동</span></div><div className="map-block block-a"/><div className="map-block block-b"/><div className="map-block block-c"/><div className="map-block block-d"/><div className="map-pin"><MapPin size={23} fill="currentColor"/><span>반가운교회</span></div><span className="map-label label-a">성북로</span><span className="map-label label-b">한신한진아파트</span><span className="map-label label-c">성북천</span></div><a className="map-foot" href="https://naver.me/xZKH48EF" target="_blank" rel="noreferrer"><span><b>반가운교회</b><small>서울 성북구 성북로4길 52 · 3층 3302호</small></span><ArrowUpRight size={18}/></a></div></section>

      <section className="connect"><div><span className="eyebrow">STAY CONNECTED</span><h2>반가운 소식을 만나보세요</h2><p>예배와 공동체의 이야기를 나눕니다.</p></div><div className="social-links"><a href="https://www.instagram.com/bangawoonchurch/" target="_blank" rel="noreferrer"><Instagram size={19}/><span>Instagram</span><ArrowUpRight size={15}/></a><a href="https://www.youtube.com/@%EB%B0%98%EA%B0%80%EC%9A%B4%EA%B5%90%ED%9A%8C" target="_blank" rel="noreferrer"><Youtube size={20}/><span>YouTube</span><ArrowUpRight size={15}/></a></div></section>
    </main>
    <footer><div className="footer-main"><a className="brand footer-brand" href="#home"><span className="brand-symbol"><Cross size={21}/></span><span><b>반가운교회</b><small>BANGAWOON CHURCH</small></span></a><p>하나님과의 사귐 안에서<br/>함께 자라가는 공동체</p><div className="footer-details"><span>{address}</span><span>담임목사 안경혁 · 대한예수교장로회 통합</span></div><a className="footer-map" href="https://naver.me/xZKH48EF" target="_blank" rel="noreferrer">오시는 길 <ArrowUpRight size={14}/></a></div><div className="footer-bottom"><span>© 2026 반가운교회. All rights reserved.</span><span>성북동에 반가운 교회, 반가운 사람들</span></div></footer>
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);

